// Keep extraction scoped to the selected post; page metadata may describe another post.
export function extractPostContent(post: Element) {
  const read = (element: Element | null) =>
    ((element as HTMLElement | null)?.innerText || element?.textContent || '').trim();
  const body = post.querySelector('[data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"]');
  const title = read(post.querySelector('[data-testid="twitter-article-title"], [data-testid="articleTitle"], [data-testid="article-title"]'));
  if (body) return { title, text: read(body), articleMode: 'full' as const };

  const ordinary = read(post.querySelector('[data-testid="tweetText"]'));
  // Timeline previews have no title testid. The cover's next sibling contains
  // two dir=auto blocks: title and excerpt. Do not mistake an ordinary quote for the post.
  const cover = post.querySelector('[data-testid="article-cover-image"]');
  if (cover && !ordinary) {
    const blocks = cover.nextElementSibling?.querySelectorAll('[dir="auto"]');
    return { title: title || read(blocks?.[0] || null), text: read(blocks?.[1] || null), articleMode: 'preview' as const };
  }
  return { title: title || undefined, text: ordinary || read(post.querySelector('[data-testid="richText"]')) };
}
