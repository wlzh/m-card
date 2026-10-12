import * as _ from 'lodash-es';

import { domToPng, domToJpeg, domToSvg, type Options, createContext, destroyContext } from 'modern-screenshot'
import type { XConfig } from '@src/hooks/useCardStore';
import { iframeMessageSystem } from './IFrameMessageSystem';
import { checkAppliedStyle, getAdjacentCellDiv, traverseAndCheck } from './element';



export function checkTheVerticalLine(element) {
  if (!element) return false;
  const styleProperties = [['width', '2px'], ['flex-grow', '1']];
  if (checkAppliedStyle(element, styleProperties)) return true;
  return false;
}


export const checkPostIsThread = (postElement) => {

  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.height !== '0px';
  }

  const isThread = traverseAndCheck(postElement, (element) => { return checkTheVerticalLine(element) });
  let prePostIsThread = false;
  let prePost = getAdjacentCellDiv(postElement, 'previous');
  while (true) {
    if (!prePost) break;
    if (isElementVisible(prePost)) {
      // console.log('prePost', prePost);
      prePostIsThread = traverseAndCheck(prePost, (element) => { return checkTheVerticalLine(element) });
      break;
    }
    prePost = getAdjacentCellDiv(prePost, 'previous');
  }
  return isThread || prePostIsThread;
}

export const getPostThread = (postElement) => {
  // function isElementVisible(element) {
  //   const style = window.getComputedStyle(element);
  //   return style.height !== '0px';
  // }
  const isElementVisible = element => element.offsetHeight !== 0;


  // if (!isThread) return [postElement];

  const postThread = [postElement];
  let prePost = getAdjacentCellDiv(postElement, 'previous');

  while (true) {
    if (!prePost) break;
    if (isElementVisible(prePost)) {
      const prePostIsThread = traverseAndCheck(prePost, (element) => { return checkTheVerticalLine(element) });
      if (prePostIsThread) {
        postThread.unshift(prePost);
      } else {
        break
      }
    }
    prePost = getAdjacentCellDiv(prePost, 'previous');
  }

  // let nextPost = getAdjacentCellDiv(postElement, 'next');
  let nextPost = getAdjacentCellDiv(postElement, 'next');
  const isEndThread = !traverseAndCheck(postElement, (element) => { return checkTheVerticalLine(element) });
  console.log('isEndThread', isEndThread, postElement);
  if (isEndThread) {
    return postThread;
  }
  while (true) {
    if (!nextPost) break;
    if (isElementVisible(nextPost)) {
      const nextPostIsThread = traverseAndCheck(nextPost, (element) => { return checkTheVerticalLine(element) });
      console.log('nextPostIsThread', nextPostIsThread, nextPost);
      postThread.push(nextPost);
      if (!nextPostIsThread) {
        break;
      }
    }
    nextPost = getAdjacentCellDiv(nextPost, 'next');
  }

  return postThread;
}



export type CopyImage = (tweetInfo: XConfig | XConfig[], cardConfig: any) => Promise<string>;
export const copyImage: CopyImage = async (tweetInfo, cardConfig = {}) => {
  const format2Array = _.isArray(tweetInfo) ? tweetInfo : [tweetInfo];
  const value = await sendMessageToIframe('generate-card-local', {
    tweetInfo: format2Array,
    cardConfig
  }, 3000);

  const imageDataUrl = value.dataUrl;

  try {
    // Extract MIME type and base64 data from the data URL
    const [, mimeType, base64Data] = imageDataUrl.match(/^data:(.+);base64,(.+)$/);

    // Convert base64 to Blob more efficiently
    const blob = await fetch(imageDataUrl).then(res => res.blob());

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [mimeType]: blob
      })
    ]);

    console.log('Image copied to clipboard successfully');
    return imageDataUrl;
  } catch (err) {
    console.error('Failed to copy image:', err);
  }
}


export const downloadImage = async (tweetInfo: XConfig | XConfig[], cardConfig = {}) => {

  const format2Array = _.isArray(tweetInfo) ? tweetInfo : [tweetInfo];

  const value = await sendMessageToIframe('generate-card-local', {
    tweetInfo: format2Array,
    cardConfig,
  }, 20000);
  const { url, dataUrl } = value;
  const xName = 'm-card'
  const link = document.createElement('a');
  link.download = `${xName}.${cardConfig?.format || 'png'}`
  link.href = dataUrl;
  link.click();
}



export const sendMessageToIframe = async (name: string, data: any, timeout: number = 10000): Promise<any> => {
  const iframe = findXCardsIframe();
  if (!iframe || !iframe.contentWindow) {
    throw new Error('Invalid iframe');
  }
  try {
    const value = await iframeMessageSystem.publish(iframe, name, data, timeout);
    return value;
  } catch (error) {
    console.error('Error sending message to iframe:', error);
    throw error;
  }
};




export function extractTweetInfo(postElement: Element | null) {
  const tweet: XConfig = {
    authorUrl: '',
    url: '',
    avatar: "",
    username: "",
    time: 0,
    text: "",
    tags: [],
    images: [],
    links: [],
    shares: 0,
    replies: 0,
    likes: 0,
  };

  if (!postElement) return null;

  // 提取头像
  tweet.avatar = postElement.querySelector('img[draggable="true"]')?.src;

  // 提取用户信息和时间
  const userInfoDiv = postElement.querySelector('[data-testid="User-Name"]');
  if (!userInfoDiv) return;

  const authorUrls = Array.from(userInfoDiv.querySelectorAll('[data-testid="User-Name"] a'))?.map(e => e.href);
  //console.log('authorUrls', authorUrls);

  //账号URL
  tweet.authorUrl = authorUrls.length > 0 ? authorUrls[0] : null;

  //帖子URL
  const xPostStatusUrls = Array.from(postElement.querySelectorAll('a[href*="/status/"]')).map(a => a.href);
  //console.log('xPostStatusUrls', xPostStatusUrls);
  tweet.url = xPostStatusUrls.length > 0 ? xPostStatusUrls[0] : null;

  tweet.username = userInfoDiv.querySelector('div[dir="ltr"]').textContent;
  let timeStr = userInfoDiv.querySelector('time')?.getAttribute('datetime');
  // console.log('timeStr', timeStr, postElement.querySelector('time'));
  tweet.time = new Date(timeStr).getTime() / 1000;
  if (/\/status\/\d+$/.test(window.location.href)) {
    timeStr = postElement.querySelector('time')?.getAttribute('datetime');
    console.log('timeStr', timeStr);
    if (timeStr) {
      tweet.time = new Date(timeStr).getTime() / 1000;
    }
  }


  // 提取文本内容。
  // 普通推文:单个 [data-testid="tweetText"]。
  // 文章推文(X Articles):正文是富文本多块结构,标题在 heading 里 ——
  // 全部 tweetText 块拼接(普通推文等价于原来取第一块),空则回退 richText 块。
  const textBlocks = Array.from(postElement.querySelectorAll('[data-testid="tweetText"]'))
    .map(el => el.textContent?.trim() || '')
    .filter(Boolean);
  if (textBlocks.length === 0) {
    const richBlocks = Array.from(postElement.querySelectorAll('[data-testid="richText"]'))
      .map(el => el.textContent?.trim() || '')
      .filter(Boolean);
    textBlocks.push(...richBlocks);
  }
  tweet.text = textBlocks.join('\n\n');

  // 文章标题:优先专用 testid,回退 article 内首个 heading
  const titleEl = postElement.querySelector(
    '[data-testid="articleTitle"], [data-testid="article-title"]'
  ) || postElement.querySelector('h1, h2[dir="auto"]');
  const titleText = titleEl?.textContent?.trim() || '';
  if (titleText && titleText !== tweet.text) {
    tweet.title = titleText;
  }
  // 文章推文兜底:og:description 对文章推文就是文章标题(普通推文时与正文相同,
  // 被「与正文去重」条件自然排除)。详情页一定带该元数据,不依赖文章模块 DOM 结构。
  if (!tweet.title) {
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
    if (ogDesc && tweet.text && ogDesc !== tweet.text && !tweet.text.includes(ogDesc)) {
      tweet.title = ogDesc;
    }
  }
  // 文章推文的正文常只是一条 t.co 短链:有标题时清掉,卡片显示 标题+配图 而非无意义链接
  if (tweet.title && /^https:\/\/t\.co\/\S+$/.test(tweet.text.trim())) {
    tweet.text = '';
  }

  tweet.tags = [];
  postElement.querySelectorAll('[data-testid="tweetText"] a[href^="/hashtag/"]').forEach(tag => {
    const tagText = tag.textContent;
    tweet.tags.push(tagText);
    tweet.text = tweet.text.replace(tagText, ''); // 从文本中移除标签
  });
  tweet.text = tweet.text.trim(); // 移除可能的多余空格

  console.log('[m-card] extract:', {
    title: tweet.title ? `${tweet.title.slice(0, 40)}…(${tweet.title.length})` : '(none)',
    textLength: tweet.text.length,
    images: tweet.images?.length ?? 0,
  });


  // 提取图片（如果有）
  const images = _.compact([
    ...postElement.querySelectorAll('[data-testid="tweetPhoto"] img'),
    // ...postElement.querySelectorAll('[data-testid="tweetPhoto"] video')
  ]);
  tweet.images = Array.from(images).map(img => img.src);



  // 图片换成高清图，
  // https://pbs.twimg.com/media/GUjKHbca8AEeT7e?format=jpg&name=small
  // https://pbs.twimg.com/media/GUjKHbca8AEeT7e?format=jpg&name=large
  tweet.images = tweet.images.map(img => img.replace(/name=\w+/, 'name=large'));

  // console.log('tweet.images', tweet.images);

  // 提取视频（如果有）
  const video = postElement.querySelector('video');
  if (video) {
    const source = video.currentSrc || video.src || video.querySelector('source')?.src || '';
    tweet.video = {
      poster: video.poster,
      src: source
    };
  }

  // 提取链接（如果有）
  const links = postElement.querySelectorAll('a[href^="https://"]') as NodeListOf<HTMLAnchorElement>;
  tweet.links = Array.from(links).map(link => ({
    href: link.href,
    text: link.textContent,
    src: link?.querySelector('img')?.src
  }));

  // 提取统计信息
  const stats = postElement.querySelector('[role="group"]');
  tweet.replies = stats?.querySelector('[data-testid="reply"]')?.textContent || 0;
  tweet.shares = stats?.querySelector('[data-testid="retweet"]')?.textContent || 0;
  tweet.likes = stats?.querySelector('[data-testid="like"]')?.textContent || 0;
  // tweet.views = stats.querySelector('a[href$="/analytics"]').textContent;

  return tweet;
}

export const findXCardsIframe = () => {
  const shadowRoot = document.querySelector("xcards-ui")?.shadowRoot;
  if (!shadowRoot) throw new Error('Shadow root not found');

  const iframe = shadowRoot.getElementById('x-card-ai') as HTMLIFrameElement;
  if (!iframe) throw new Error('Iframe not found');
  return iframe;

}
