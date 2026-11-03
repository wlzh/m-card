const statusIdFromUrl = (href: string): string | null => {
  try {
    return new URL(href).pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/)?.[1] ?? null;
  } catch {
    return null;
  }
};

// On a status detail page, articles before the focused post are its visible conversation context.
// Other posts on that page are replies and should remain single-card exports.
export const getDetailConversationPosts = (
  postElement: Element,
  pageUrl: string,
  postUrl: string,
): Element[] | null => {
  const pageStatusId = statusIdFromUrl(pageUrl);
  if (!pageStatusId) return null;
  if (statusIdFromUrl(postUrl) !== pageStatusId) return [postElement];

  const column = postElement.closest('[data-testid="primaryColumn"]') ?? postElement.closest('main');
  if (!column) return [postElement];
  const posts = Array.from(column.querySelectorAll('article[data-testid="tweet"]'))
    .filter(article => !article.parentElement?.closest('article[data-testid="tweet"]'));
  const selectedIndex = posts.indexOf(postElement);
  if (selectedIndex <= 0) return [postElement];
  return [...posts.slice(0, selectedIndex), postElement];
};
