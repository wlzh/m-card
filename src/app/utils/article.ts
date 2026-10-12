import type { ArticleBlock } from '@src/hooks/useCardStore';

const read = (element: Element | null) =>
  ((element as HTMLElement | null)?.innerText || element?.textContent || '').trim();

const findArticleBlockContainer = (body: Element) => {
  let container = body;
  while (container.children.length === 1) {
    const child = container.firstElementChild;
    if (!child || child.matches('[data-block="true"], h1, h2, h3, ol, ul, blockquote')) break;
    container = child;
  }
  return container;
};

export function extractArticleBlocks(body: Element): ArticleBlock[] {
  const container = findArticleBlockContainer(body);
  return Array.from(container.children).flatMap<ArticleBlock>((node) => {
    const image = node.querySelector<HTMLImageElement>('img[src]');
    if (image?.src) return [{ type: 'image', src: image.src, alt: image.alt || undefined }];
    if (node.matches('[role="separator"]') || node.querySelector('[role="separator"]')) return [{ type: 'divider' }];

    const heading = node.matches('h1, h2, h3') ? node : node.querySelector('h1, h2, h3');
    if (heading) {
      const text = read(heading);
      return text ? [{ type: 'heading', text }] : [];
    }
    if (node.matches('ol, ul')) {
      const items = Array.from(node.querySelectorAll(':scope > li')).map(read).filter(Boolean);
      return items.length ? [{ type: 'list', items, ordered: node.tagName === 'OL' }] : [];
    }

    const text = read(node);
    if (!text) return [];
    return [{ type: node.matches('blockquote') ? 'quote' : 'paragraph', text }];
  });
}

// Keep extraction scoped to the selected post; page metadata may describe another post.
export function extractPostContent(post: Element) {
  const body = post.querySelector('[data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"]');
  const title = read(post.querySelector('[data-testid="twitter-article-title"], [data-testid="articleTitle"], [data-testid="article-title"]'));
  if (body) {
    const articleBlocks = extractArticleBlocks(body);
    const text = articleBlocks.flatMap((block) => {
      if (block.type === 'list') return block.items;
      return 'text' in block ? [block.text] : [];
    }).join('\n\n') || read(body);
    return { title, text, articleBlocks, articleMode: 'full' as const };
  }

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
