import * as _ from 'lodash-es';
import { belongsToMainTweet, extractPostContent, queryMainTweet, queryMainTweetAll } from './article';

import { domToPng, domToJpeg, domToSvg, type Options, createContext, destroyContext } from 'modern-screenshot'
import type { XConfig } from '@src/hooks/useCardStore';
import type { CardConfig } from '@src/components/extension/use-tweet-collection';
import { extractEngagementStats } from './engagement';
import { extractQuotedTweet } from './quoted-tweet';
import { iframeMessageSystem } from './IFrameMessageSystem';
import { getAdjacentCellDiv, traverseAndCheck, traverseAndCheckAsync } from './element';



export function checkTheVerticalLine(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.width === '2px' && style.flexGrow === '1';
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
  if (isEndThread) {
    return postThread;
  }
  while (true) {
    if (!nextPost) break;
    if (isElementVisible(nextPost)) {
      const nextPostIsThread = traverseAndCheck(nextPost, (element) => { return checkTheVerticalLine(element) });
      postThread.push(nextPost);
      if (!nextPostIsThread) {
        break;
      }
    }
    nextPost = getAdjacentCellDiv(nextPost, 'next');
  }

  return postThread;
}

export const getPostThreadAsync = async (postElement: Element) => {
  const isElementVisible = (element: Element) => (element as HTMLElement).offsetHeight !== 0;
  const hasThreadLine = (element: Element) => traverseAndCheckAsync(element, checkTheVerticalLine);
  const postThread = [postElement];

  let prePost = getAdjacentCellDiv(postElement, 'previous');
  while (prePost) {
    if (isElementVisible(prePost)) {
      if (await hasThreadLine(prePost)) {
        postThread.unshift(prePost);
      } else {
        break;
      }
    }
    prePost = getAdjacentCellDiv(prePost, 'previous');
  }

  let nextPost = getAdjacentCellDiv(postElement, 'next');
  if (!await hasThreadLine(postElement)) return postThread;

  while (nextPost) {
    if (isElementVisible(nextPost)) {
      const nextPostIsThread = await hasThreadLine(nextPost);
      postThread.push(nextPost);
      if (!nextPostIsThread) break;
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
  }, 60000);

  const imageDataUrl = value.dataUrl;
  if (!imageDataUrl?.startsWith('data:image/')) throw new Error(value.error || 'Invalid image response');

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

    return imageDataUrl;
  } catch (err) {
    console.error('Failed to copy image:', err);
  }
  return imageDataUrl;
}


export const downloadImage = async (tweetInfo: XConfig | XConfig[], cardConfig: Partial<CardConfig> = {}) => {

  const format2Array = _.isArray(tweetInfo) ? tweetInfo : [tweetInfo];

  const value = await sendMessageToIframe('generate-card-local', {
    tweetInfo: format2Array,
    cardConfig,
  }, 60000);
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
  const waitForRenderer = async (attempts: number, pingTimeout: number) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await iframeMessageSystem.publish(iframe, 'renderer-ping', {}, pingTimeout);
      } catch (error) {
        lastError = error;
      }
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw lastError;
  };
  const switchToCloud = async () => {
    const fallbackSrc = iframe.dataset.fallbackSrc;
    if (!fallbackSrc) throw new Error('Cloud renderer fallback is unavailable');
    let localSettings: any = null;
    try {
      localSettings = await iframeMessageSystem.publish(iframe, 'export-card-settings', {}, 2000);
    } catch {
      // A completely unavailable local frame cannot provide settings; cloud uses its saved defaults.
    }
    const localSrc = iframe.src;
    iframe.dataset.rendererMode = 'cloud';
    iframe.src = fallbackSrc;
    try {
      await waitForRenderer(10, 1500);
    } catch (error) {
      iframe.dataset.rendererMode = 'local';
      iframe.src = localSrc;
      throw new Error('Cloud renderer did not become ready', { cause: error });
    }
    if (localSettings) {
      await iframeMessageSystem.publish(iframe, 'import-card-settings', localSettings, 5000);
    }
    console.warn('[m-card] Local renderer unavailable; using cloud fallback');
  };

  try {
    try {
      await waitForRenderer(6, 1500);
    } catch (localError) {
      if (iframe.dataset.rendererMode !== 'local') throw localError;
      await switchToCloud();
    }
    try {
      return await iframeMessageSystem.publish(iframe, name, data, timeout);
    } catch (renderError) {
      // A renderer error is a valid response, not evidence that the local iframe is unavailable.
      if (iframe.dataset.rendererMode !== 'local'
        || !(renderError instanceof Error)
        || renderError.message !== 'Iframe message timeout') throw renderError;
      await switchToCloud();
      return await iframeMessageSystem.publish(iframe, name, data, timeout);
    }
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
  tweet.avatar = queryMainTweet<HTMLImageElement>(postElement, '[data-testid="Tweet-User-Avatar"] img, img[draggable="true"]')?.src;

  // 提取用户信息和时间
  const userInfoDiv = queryMainTweet(postElement, '[data-testid="User-Name"]');
  if (!userInfoDiv) return;

  const authorUrls = Array.from(userInfoDiv.querySelectorAll<HTMLAnchorElement>('a')).map(e => e.href);
  //console.log('authorUrls', authorUrls);

  //账号URL
  tweet.authorUrl = authorUrls.length > 0 ? authorUrls[0] : '';

  //帖子URL
  const xPostStatusUrls = queryMainTweetAll<HTMLAnchorElement>(postElement, 'a[href*="/status/"]').map(a => a.href).filter(href => /\/status\/\d+(?:\?.*)?$/.test(href));
  //console.log('xPostStatusUrls', xPostStatusUrls);
  tweet.url = xPostStatusUrls.length > 0 ? xPostStatusUrls[0] : '';

  tweet.username = userInfoDiv.querySelector('div[dir="ltr"]')?.textContent || userInfoDiv.textContent || '';
  let timeStr = userInfoDiv.querySelector('time')?.getAttribute('datetime');
  // console.log('timeStr', timeStr, postElement.querySelector('time'));
  tweet.time = timeStr ? new Date(timeStr).getTime() / 1000 : 0;
  if (/\/status\/\d+(?:\?.*)?$/.test(window.location.href)) {
    timeStr = queryMainTweet(postElement, 'time')?.getAttribute('datetime');
    if (timeStr) {
      tweet.time = new Date(timeStr).getTime() / 1000;
    }
  }


  Object.assign(tweet, extractPostContent(postElement));
  if (tweet.articleMode !== 'full') tweet.quotedTweet = extractQuotedTweet(postElement);
  tweet.tags = [];
  queryMainTweetAll(postElement, '[data-testid="tweetText"] a[href^="/hashtag/"]').forEach(tag => {
    const tagText = tag.textContent;
    tweet.tags.push(tagText);
    tweet.text = tweet.text.replace(tagText, ''); // 从文本中移除标签
  });
  tweet.text = tweet.text.trim(); // 移除可能的多余空格

  // 提取图片（如果有）
  const images = _.compact([
    ...queryMainTweetAll<HTMLImageElement>(postElement, '[data-testid="tweetPhoto"] img, [data-testid="article-cover-image"] img'),
    // ...postElement.querySelectorAll('[data-testid="tweetPhoto"] video')
  ]);
  tweet.images = Array.from(images).map(img => img.src);



  // 图片换成高清图，
  // https://pbs.twimg.com/media/GUjKHbca8AEeT7e?format=jpg&name=small
  // https://pbs.twimg.com/media/GUjKHbca8AEeT7e?format=jpg&name=large
  tweet.images = tweet.images.map(img => img.replace(/name=\w+/, 'name=large'));
  if (tweet.articleBlocks) {
    tweet.articleBlocks = tweet.articleBlocks.map((block) => block.type === 'image'
      ? { ...block, src: block.src.replace(/name=\w+/, 'name=large') }
      : block);
  }

  // console.log('tweet.images', tweet.images);

  // 提取视频（如果有）
  const video = queryMainTweet<HTMLVideoElement>(postElement, 'video');
  if (video) {
    const source = video.currentSrc || video.src || video.querySelector('source')?.src || '';
    tweet.video = {
      poster: video.poster,
      src: source
    };
  }

  // 提取链接（如果有）
  const links = queryMainTweetAll<HTMLAnchorElement>(postElement, 'a[href^="https://"]');
  tweet.links = links.map(link => ({
    href: link.href,
    text: link.textContent,
    src: link.querySelector('img')?.src === tweet.avatar ? undefined : link.querySelector('img')?.src.replace(/name=\w+/, 'name=large')
  }));

  // X switches like/retweet test IDs after the current account activates them.
  Object.assign(tweet, extractEngagementStats(postElement, node => belongsToMainTweet(postElement, node)));
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
