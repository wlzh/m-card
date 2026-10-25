export interface EngagementStats {
  replies: number | string;
  shares: number | string;
  likes: number | string;
  views?: number | string;
  bookmarks?: number | string;
}

const STAT_SELECTORS = {
  replies: '[data-testid="reply"]',
  shares: '[data-testid="retweet"], [data-testid="unretweet"]',
  likes: '[data-testid="like"], [data-testid="unlike"]',
} as const;

const readStat = (container: Element, selector: string): number | string => {
  const element = container.querySelector(selector);
  if (!element) return 0;

  const visibleValue = element.textContent?.trim();
  if (visibleValue) return visibleValue;

  // X omits visible text for zero counts, but keeps the count at the start of aria-label.
  const ariaLabel = element.getAttribute('aria-label')?.trim() || '';
  return ariaLabel.match(/^[\d.,]+(?:\s*[万千KMB])?/i)?.[0]?.replace(/\s+/g, '') || 0;
};

const readOptionalStat = (group: Element, selector: string, labelPattern: RegExp): string | undefined => {
  const element = group.querySelector(selector);
  const groupCount = group.getAttribute('aria-label')?.match(labelPattern)?.[1];
  if (groupCount) return groupCount.replace(/\s+/g, '');
  const labelCount = element?.getAttribute('aria-label')?.match(/^[\d.,]+(?:\s*[万千KMB])?/i)?.[0];
  if (labelCount) return labelCount.replace(/\s+/g, '');
  return element?.textContent?.trim() || undefined;
};

export const extractEngagementStats = (postElement: Element, belongsToPost: (node: Element) => boolean = () => true): EngagementStats => {
  const groups = Array.from(postElement.querySelectorAll('[role="group"]')).filter(belongsToPost);
  const stats = groups.find(group => (
    group.querySelector(STAT_SELECTORS.replies)
    && group.querySelector(STAT_SELECTORS.shares)
    && group.querySelector(STAT_SELECTORS.likes)
  ));

  if (!stats) return { replies: 0, shares: 0, likes: 0 };

  const views = readOptionalStat(stats, 'a[href*="/analytics"]', /([\d.,]+(?:\s*[万千KMB])?)\s*(?:次观看|次查看|views?)/i);
  const bookmarks = readOptionalStat(stats, '[data-testid="bookmark"], [data-testid="removeBookmark"]', /([\d.,]+(?:\s*[万千KMB])?)\s*(?:书签|bookmarks?)/i);
  return {
    replies: readStat(stats, STAT_SELECTORS.replies),
    shares: readStat(stats, STAT_SELECTORS.shares),
    likes: readStat(stats, STAT_SELECTORS.likes),
    ...(views !== undefined ? { views } : {}),
    ...(bookmarks !== undefined ? { bookmarks } : {}),
  };
};
