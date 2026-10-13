# M.Card

[English](README.md) | [中文](README_ZH.md) | [Website](https://mcard.wlz.si) | [Changelog](CHANGELOG.md)

M.Card is a self-hosted Chrome extension for turning X posts, threads, and X Articles into shareable cards or portable data exports. It is based on the MPL-2.0 licensed [x-cards](https://github.com/hzeyuan/x-cards) project.

## Features

- Generate cards directly from the X action bar, with a live preview before copy or download.
- Capture ordinary posts, thread items, video posters, article previews, and full X Articles.
- Preserve headings, paragraphs, lists, quotes, dividers, and inline image order on article detail pages.
- Export PNG, JPEG, SVG, Markdown, JSON, or an asset ZIP.
- Configure width, padding, font size and family, image layout, background, border, visible fields, watermark, format, and 1x-4x export scale.
- Persist every default locally in IndexedDB. Toast controls are temporary overrides for the current generation session.
- Enable or disable a customizable watermark, enabled as `@wlzh` by default.

## Install The Extension

```bash
pnpm install --frozen-lockfile
pnpm build:extension:prod
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select:

```text
build/chrome-mv3-prod/
```

The extension renderer is compiled to use `https://mcard.wlz.si/independent`. Rebuild it after changing `PLASMO_PUBLIC_RENDERER_URL`.

## Development

Requires Node.js 20 and pnpm 9.15.4.

```bash
pnpm install --frozen-lockfile
pnpm dev:next
pnpm dev:plasmo
pnpm test
pnpm build:next
pnpm build:extension:prod
```

The Next.js application is a static export deployed on Cloudflare Pages; no VPS is required. See [SELF_HOSTING_ZH.md](SELF_HOSTING_ZH.md) for deployment and credential handling, [ARTICLE_SETTINGS_AUDIT_ZH.md](ARTICLE_SETTINGS_AUDIT_ZH.md) for the settings contract, and [PROJECT_AUDIT_ZH.md](PROJECT_AUDIT_ZH.md) for implementation boundaries.

## License

MPL-2.0. Keep the license and upstream notices when redistributing modified MPL-covered files. See [LICENSE](LICENSE).

Community: [X](https://x.com/wlzh) | [Discord](https://discord.com/invite/cj9fusHpjQ)
