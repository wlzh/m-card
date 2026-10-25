const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText;

const load = (file, dependencies = {}, globals = {}) => {
  const exportsObject = {};
  vm.runInNewContext(compile(file), {
    exports: exportsObject,
    require: id => dependencies[id] || {},
    ...globals,
  });
  return exportsObject;
};

test('ordinary post extraction does not absorb a nested quote article, media, links, or stats', () => {
  const dom = new JSDOM(`<article data-testid="tweet">
    <div role="link" tabindex="0">
      <div data-testid="Tweet-User-Avatar"><img src="https://pbs.twimg.com/quote.jpg"></div>
      <div data-testid="User-Name"><div dir="ltr">Quoted author</div><div dir="ltr">@quoted</div></div>
      <a href="https://x.com/quoted/status/999">Quoted status</a>
      <div data-testid="twitter-article-title">Quoted title</div>
      <div data-testid="twitterArticleRichTextView"><p>Quoted body</p></div>
      <div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/quote?name=small"></div>
      <div role="group"><button data-testid="reply">9</button><button data-testid="retweet">9</button><button data-testid="like">9</button></div>
    </div>
    <div data-testid="Tweet-User-Avatar"><img src="https://pbs.twimg.com/main.jpg"></div>
    <div data-testid="User-Name"><a href="https://x.com/main">Main author</a><time datetime="2026-10-25T00:00:00Z"></time></div>
    <a href="https://x.com/main/status/123">Main status</a>
    <div data-testid="tweetText">Main comment</div>
    <div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/main?name=small"></div>
    <div role="group"><button data-testid="reply">1</button><button data-testid="retweet">2</button><button data-testid="like">3</button></div>
  </article>`, { url: 'https://x.com/main/status/123' });
  const article = load('src/app/utils/article.ts');
  const engagement = load('src/app/utils/engagement.ts');
  const quoted = load('src/app/utils/quoted-tweet.ts', { './article': article });
  const utils = load('src/app/utils/index.ts', {
    'lodash-es': { compact: values => values.filter(Boolean) },
    './article': article,
    './engagement': engagement,
    './quoted-tweet': quoted,
  }, { window: dom.window, console });

  const tweet = utils.extractTweetInfo(dom.window.document.querySelector('article'));
  assert.equal(tweet.username, 'Main author');
  assert.equal(tweet.authorUrl, 'https://x.com/main');
  assert.equal(tweet.url, 'https://x.com/main/status/123');
  assert.equal(tweet.text, 'Main comment');
  assert.equal(tweet.title, undefined);
  assert.equal(tweet.articleMode, undefined);
  assert.equal(tweet.avatar, 'https://pbs.twimg.com/main.jpg');
  assert.deepEqual(Array.from(tweet.images), ['https://pbs.twimg.com/media/main?name=large']);
  assert.deepEqual({ replies: tweet.replies, shares: tweet.shares, likes: tweet.likes }, { replies: '1', shares: '2', likes: '3' });
  assert.equal(tweet.links.some(link => link.href.includes('/quoted/')), false);
  assert.equal(tweet.quotedTweet.username, 'Quoted author');
  assert.equal(tweet.quotedTweet.handle, '@quoted');
  assert.equal(tweet.quotedTweet.title, 'Quoted title');
  assert.equal(tweet.quotedTweet.text, 'Quoted body');
  assert.deepEqual(Array.from(tweet.quotedTweet.images), ['https://pbs.twimg.com/media/quote?name=large']);

  const { tweet2Markdown } = load('src/app/utils/export.ts');
  const markdown = tweet2Markdown([tweet]);
  assert.match(markdown, /Main comment/);
  assert.match(markdown, /Quoted post by Quoted author \(@quoted\)/);
  assert.match(markdown, /Quoted body/);
  assert.match(markdown, /Quoted image 1/);
});

test('quote visibility has matching defaults and controls in both panels', () => {
  const store = fs.readFileSync('src/hooks/useCardStore.tsx', 'utf8');
  const toast = fs.readFileSync('src/components/extension/x-cards-toast/tweet-control.tsx', 'utf8');
  const settings = fs.readFileSync('src/app/(app)/components/card-generator/controller/card-controller.tsx', 'utf8');
  const card = fs.readFileSync('src/app/(app)/components/card-generator/twitter-card.tsx', 'utf8');
  assert.match(store, /showQuote: true/);
  assert.match(toast, /toggleOption\('showQuote'\)/);
  assert.match(settings, /key: 'showQuote'/);
  assert.match(card, /cardStyles\.controls\.showQuote !== false/);
});

test('rendered card includes the quote only when its control is enabled', () => {
  const { TwitterCard } = load('src/app/(app)/components/card-generator/twitter-card.tsx', {
    react: { ...React, default: React },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '../ImageLayout': { default: () => null },
    'lodash-es': {
      uniq: values => [...new Set(values)],
      compact: values => values.filter(Boolean),
      isArray: Array.isArray,
      last: values => values[values.length - 1],
    },
    '@src/app/utils/format': { formatTimestamp: () => 'date' },
  }, { encodeURIComponent });
  const tweet = {
    avatar: '', username: 'Main author', text: 'Main comment', images: [],
    replies: 1, shares: 2, likes: 3, time: 0,
    quotedTweet: { username: 'Quoted author', handle: '@quoted', text: 'Quoted body', images: [] },
  };
  const backgroundStyles = { padding: 20, backgroundColor: '#fff', backgroundOpacity: 1, backgroundBlur: 0 };
  const baseStyles = {
    width: 582, scale: 100, borderRadius: 20, fontSize: 16,
    controls: { showUser: true, showActions: false, showTime: false, showFooter: false, showLogo: false, showQuote: true },
    watermark: { enabled: false, text: '' },
  };
  const render = showQuote => ReactDOMServer.renderToStaticMarkup(React.createElement(TwitterCard, {
    xConfig: [tweet], backgroundStyles, cardStyles: { ...baseStyles, controls: { ...baseStyles.controls, showQuote } },
  }));
  assert.match(render(true), /Quoted author/);
  assert.match(render(true), /Quoted body/);
  assert.doesNotMatch(render(false), /Quoted body/);
  assert.match(render(false), /Main comment/);
});

test('article code and table survive Markdown export and card rendering', () => {
  const tweet = {
    avatar: '', username: 'Author', title: 'Article', text: 'Body', images: ['https://pbs.twimg.com/cover.jpg'],
    authorUrl: 'https://x.com/author', url: 'https://x.com/author/status/1',
    replies: 0, shares: 0, likes: 0, time: 0, articleMode: 'full',
    articleBlocks: [
      { type: 'paragraph', text: 'Before' },
      { type: 'table', rows: [['Name', 'Score'], ['A|B', '95']] },
      { type: 'code', text: 'const n = 1;', language: 'ts' },
      { type: 'paragraph', text: 'After' },
    ],
  };
  const markdown = load('src/app/utils/export.ts').tweet2Markdown([tweet]);
  assert.match(markdown, /^# Article\n/);
  assert.match(markdown, /Article cover 1.*cover\.jpg/);
  assert.match(markdown, /Before[\s\S]*\| Name \| Score \|[\s\S]*A\\\|B[\s\S]*```ts[\s\S]*const n = 1;[\s\S]*After/);

  const { TwitterCard } = load('src/app/(app)/components/card-generator/twitter-card.tsx', {
    react: { ...React, default: React },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '../ImageLayout': { default: () => null },
    'lodash-es': { uniq: values => [...new Set(values)], compact: values => values.filter(Boolean), isArray: Array.isArray, last: values => values[values.length - 1] },
    '@src/app/utils/format': { formatTimestamp: () => 'date' },
  }, { encodeURIComponent });
  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(TwitterCard, {
    xConfig: [tweet],
    backgroundStyles: { padding: 20, backgroundColor: '#fff', backgroundOpacity: 1, backgroundBlur: 0 },
    cardStyles: { width: 582, scale: 100, borderRadius: 20, fontSize: 16, controls: { showUser: false, showActions: false, showTime: false, showFooter: false, showLogo: false }, watermark: { enabled: false, text: '' } },
  }));
  assert.match(html, /Before[\s\S]*<table[\s\S]*Name[\s\S]*Score[\s\S]*A\|B[\s\S]*<pre[\s\S]*const n = 1;[\s\S]*After/);
});
