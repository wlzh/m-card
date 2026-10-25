import type { QuotedTweet } from '@src/hooks/useCardStore';
import { extractPostContent } from './article';

const highQualityImage = (src: string) => src.replace(/name=\w+/, 'name=large');

export const extractQuotedTweet = (post: Element): QuotedTweet | undefined => {
  const quote = Array.from(post.querySelectorAll<HTMLElement>('[role="link"][tabindex="0"]'))
    .find((node) => node.querySelector('[data-testid="Tweet-User-Avatar"]'))
    || post.querySelector<HTMLElement>('[data-testid="quoteTweet"], [data-testid="quotedTweet"]');
  if (!quote) return;

  const user = quote.querySelector('[data-testid="User-Name"]');
  const names = Array.from(user?.querySelectorAll('[dir="ltr"]') || [])
    .map((node) => node.textContent?.trim() || '').filter(Boolean);
  const username = names.find((name) => !name.startsWith('@') && name !== '·') || '';
  const handle = names.find((name) => name.startsWith('@'));
  const content = extractPostContent(quote);
  const images = Array.from(new Set(Array.from(quote.querySelectorAll<HTMLImageElement>(
    '[data-testid="tweetPhoto"] img, [data-testid="article-cover-image"] img'
  )).map((image) => highQualityImage(image.src)).filter(Boolean)));
  const poster = quote.querySelector<HTMLVideoElement>('video')?.poster;
  if (poster && !images.includes(highQualityImage(poster))) images.push(highQualityImage(poster));
  if (!username && !handle && !content.text && !content.title && !images.length) return;

  return {
    username: username || handle || 'Quoted post',
    handle,
    avatar: quote.querySelector<HTMLImageElement>('[data-testid="Tweet-User-Avatar"] img')?.src,
    title: content.title || undefined,
    text: content.text,
    images,
  };
};
