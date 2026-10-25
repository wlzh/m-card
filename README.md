# M.Card

[English](README.md) | [中文](README_ZH.md) | [Website](https://mcard.wlz.si) | [Changelog](CHANGELOG.md)

M.Card is a self-hosted Chrome extension for turning X posts, threads, and X Articles into shareable cards or portable data exports. It is based on the MPL-2.0 licensed [x-cards](https://github.com/hzeyuan/x-cards) project.

## Features

- Generate cards directly from the X action bar, with a live preview before copy or download.
- Capture ordinary posts, thread items, video posters, article previews, and full X Articles.
- Preserve headings, paragraphs, lists, quotes, dividers, semantic tables, code blocks, and inline image order on article detail pages. X-specific embeds remain a compatibility gap.
- Export PNG, JPEG, SVG, Markdown, JSON, or an asset ZIP.
- Configure width, padding, font size and family, image layout, background, border, visible fields, watermark, format, and 1x-4x export scale.
- Render cards inside the extension by default, with `mcard.wlz.si` as an automatic cloud fallback.
- Persist every default locally in extension-origin IndexedDB. Toast controls are temporary overrides for the current generation session.
- Enable or disable a customizable watermark, enabled as `@wlzh` by default. Save up to five named watermark presets in default settings, then choose a preset or no watermark as a one-session override in the X generation panel.
- Save, apply, rename, and delete local card templates from the default settings panel. Applying a template keeps your named watermark presets intact.
- Keep visible quoted posts separate from the main post and optionally render them as nested cards; quote visibility is a local default or per-generation override.
- Optionally show view and bookmark counts. The extra footer row is off by default; unavailable counts are not invented, while Markdown retains available values.

## Install The Extension

```bash
pnpm install --frozen-lockfile
pnpm build:extension:prod
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select:

```text
build/chrome-mv3-prod/
```

The production build includes `tabs/renderer.html` and uses it first. `PLASMO_PUBLIC_RENDERER_URL` only configures the cloud fallback; rebuild after changing it.

Clicking the extension toolbar icon opens the website. Open local default settings from the generation panel on X.

## Development

Requires Node.js 20 and pnpm 9.15.4.

```bash
pnpm install --frozen-lockfile
pnpm dev:next
pnpm dev:plasmo
pnpm typecheck
pnpm test
pnpm build:next
pnpm build:extension:prod
```

The optional fallback site is a static Next.js export deployed on Cloudflare Pages; no VPS is required. See [SELF_HOSTING_ZH.md](SELF_HOSTING_ZH.md) for deployment and credential handling, [ARTICLE_SETTINGS_AUDIT_ZH.md](ARTICLE_SETTINGS_AUDIT_ZH.md) for the settings contract, [PROJECT_AUDIT_ZH.md](PROJECT_AUDIT_ZH.md) for implementation boundaries, and [FEATURE_GAP_AUDIT_ZH.md](FEATURE_GAP_AUDIT_ZH.md) for the remaining capability gaps.

## License

MPL-2.0. Keep the license and upstream notices when redistributing modified MPL-covered files. See [LICENSE](LICENSE).

Community: [X](https://x.com/wlzh) | [Discord](https://discord.com/invite/cj9fusHpjQ)
