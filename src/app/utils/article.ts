import type { ArticleBlock } from '@src/hooks/useCardStore';

const read = (element: Element | null) =>
  ((element as HTMLElement | null)?.innerText || element?.textContent || '').trim();

export const belongsToMainTweet = (post: Element, node: Element): boolean => {
    const quote = node.closest('[data-testid="quoteTweet"], [data-testid="quotedTweet"]');
    // X currently renders a quote as a focusable role=link card, not quoteTweet.
    const quoteLink = node.closest('[role="link"][tabindex="0"]');
    const isQuoteLink = quoteLink && quoteLink !== post && post.contains(quoteLink)
      && quoteLink.querySelector('[data-testid="Tweet-User-Avatar"]');
    const nestedTweet = node.closest('article[data-testid="tweet"]');
    return !(quote && quote !== post && post.contains(quote))
      && !isQuoteLink
      && !(nestedTweet && nestedTweet !== post && post.contains(nestedTweet));
};

export const queryMainTweetAll = <T extends Element = Element>(post: Element, selector: string): T[] =>
  Array.from(post.querySelectorAll<T>(selector)).filter((node) => belongsToMainTweet(post, node));

export const queryMainTweet = <T extends Element = Element>(post: Element, selector: string): T | null =>
  queryMainTweetAll<T>(post, selector)[0] || null;

const findArticleBlockContainer = (body: Element) => {
  let container = body;
  while (container.children.length === 1) {
    const child = container.firstElementChild;
    if (!child || child.matches('[data-block="true"], h1, h2, h3, p, ol, ul, blockquote, pre, table')) break;
    container = child;
  }
  return container;
};

const structuredSelector = 'h1, h2, h3, p, ol, ul, blockquote, pre, table, img[src], [role="separator"]';

const extractArticleNode = (node: Element): ArticleBlock[] => {
  if (node.matches('img[src]')) {
    const image = node as HTMLImageElement;
    return image.src ? [{ type: 'image', src: image.src, alt: image.alt || undefined }] : [];
  }
  if (node.matches('[role="separator"]')) return [{ type: 'divider' }];
  if (node.matches('pre, code')) {
    const text = read(node);
    const language = (node.querySelector('code')?.getAttribute('class') || node.getAttribute('class') || '')
      .match(/language-([\w-]+)/)?.[1];
    return text ? [{ type: 'code', text, language }] : [];
  }
  if (node.matches('table')) {
    const rows = Array.from(node.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll(':scope > th, :scope > td')).map(read)
    ).filter((row) => row.length > 0);
    return rows.length ? [{ type: 'table', rows }] : [];
  }
  if (node.matches('h1, h2, h3')) {
    const text = read(node);
    return text ? [{ type: 'heading', text }] : [];
  }
  if (node.matches('ol, ul')) {
    const items = Array.from(node.querySelectorAll(':scope > li')).map(read).filter(Boolean);
    return items.length ? [{ type: 'list', items, ordered: node.tagName === 'OL' }] : [];
  }
  if (node.matches('blockquote')) {
    const text = read(node);
    return text ? [{ type: 'quote', text }] : [];
  }

  if (!node.querySelector(structuredSelector)) {
    const text = read(node);
    return text ? [{ type: 'paragraph', text }] : [];
  }

  const blocks: ArticleBlock[] = [];
  let pending = '';
  const flush = () => {
    const text = pending.trim();
    if (text) blocks.push({ type: 'paragraph', text });
    pending = '';
  };
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      pending += child.textContent || '';
      continue;
    }
    if (child.nodeType !== 1) continue;
    const element = child as Element;
    if (element.matches('br')) {
      pending += '\n';
    } else if (element.matches(structuredSelector) || element.querySelector(structuredSelector)) {
      flush();
      blocks.push(...extractArticleNode(element));
    } else {
      pending += read(element);
    }
  }
  flush();
  return blocks;
};

export function extractArticleBlocks(body: Element): ArticleBlock[] {
  if (!body.querySelector(structuredSelector)) {
    const text = read(body);
    return text ? [{ type: 'paragraph', text }] : [];
  }
  const container = findArticleBlockContainer(body);
  return extractArticleNode(container);
}

// Keep extraction scoped to the selected post; page metadata may describe another post.
export function extractPostContent(post: Element) {
  const body = queryMainTweet(post, '[data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"]');
  const title = read(queryMainTweet(post, '[data-testid="twitter-article-title"], [data-testid="articleTitle"], [data-testid="article-title"]'));
  if (body) {
    const articleBlocks = extractArticleBlocks(body);
    const text = articleBlocks.flatMap((block) => {
      if (block.type === 'list') return block.items;
      if (block.type === 'table') return block.rows.map((row) => row.join(' | '));
      return 'text' in block ? [block.text] : [];
    }).join('\n\n') || read(body);
    return { title, text, articleBlocks, articleMode: 'full' as const };
  }

  const ordinary = read(queryMainTweet(post, '[data-testid="tweetText"]'));
  // Timeline previews have no title testid. The cover's next sibling contains
  // two dir=auto blocks: title and excerpt. Do not mistake an ordinary quote for the post.
  const cover = queryMainTweet(post, '[data-testid="article-cover-image"]');
  if (cover && !ordinary) {
    const blocks = cover.nextElementSibling?.querySelectorAll('[dir="auto"]');
    return { title: title || read(blocks?.[0] || null), text: read(blocks?.[1] || null), articleMode: 'preview' as const };
  }
  return { title: title || undefined, text: ordinary || read(queryMainTweet(post, '[data-testid="richText"]')) };
}
