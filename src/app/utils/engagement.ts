export interface EngagementStats {
  replies: number | string;
  shares: number | string;
  likes: number | string;
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

export const extractEngagementStats = (postElement: Element): EngagementStats => {
  const groups = Array.from(postElement.querySelectorAll('[role="group"]'));
  const stats = groups.find(group => (
    group.querySelector(STAT_SELECTORS.replies)
    && group.querySelector(STAT_SELECTORS.shares)
    && group.querySelector(STAT_SELECTORS.likes)
  ));

  if (!stats) return { replies: 0, shares: 0, likes: 0 };

  return {
    replies: readStat(stats, STAT_SELECTORS.replies),
    shares: readStat(stats, STAT_SELECTORS.shares),
    likes: readStat(stats, STAT_SELECTORS.likes),
  };
};
