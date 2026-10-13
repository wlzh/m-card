# M.Card

[English](README.md) | [中文](README_ZH.md) | [官网](https://mcard.wlz.si) | [更新记录](CHANGELOG.md)

M.Card 是一个自托管 Chrome 扩展，可把 X 普通帖子、连帖和 X Articles 生成为分享卡片或可迁移的数据文件。本项目基于 MPL-2.0 协议的 [x-cards](https://github.com/hzeyuan/x-cards) 改造。

## 功能

- 在 X 操作栏直接生图，先显示实时预览，再由用户复制或下载。
- 采集普通推文、连帖、视频封面、文章时间线摘要和文章详情全文。
- 文章详情页按原 DOM 顺序保留标题、段落、列表、引用、分隔线和穿插图片。
- 支持 PNG、JPEG、SVG、Markdown、JSON 和素材 ZIP 导出。
- 可设置宽度、Padding、字号、字体、图片布局、背景、边框、显示字段、水印、格式和 1x-4x 导出倍率。
- 默认在扩展内部本地渲染，`mcard.wlz.si` 只作为本地渲染不可用时的自动备选。
- 所有默认设置保存在扩展自身的本机 IndexedDB；生图面板的快捷调整只覆盖当前生成会话。
- 水印默认开启且文字为 `@wlzh`，可以关闭或修改。

## 安装 Chrome 扩展

```bash
pnpm install --frozen-lockfile
pnpm build:extension:prod
```

打开 `chrome://extensions`，开启“开发者模式”，点击“加载已解压的扩展程序”，选择：

```text
build/chrome-mv3-prod/
```

生产扩展内置 `tabs/renderer.html` 并优先本地渲染。`PLASMO_PUBLIC_RENDERER_URL` 只配置云端备选地址；修改后必须重新构建并重新加载扩展。

## 设置关系

- 点击扩展工具栏图标打开官网；生图窗口里的“默认设置”打开本地设置页，修改后自动保存在扩展本机存储。
- `Save as Default` 另存个人快照，`Load Default` 恢复该快照，`Reset` 恢复出厂值。
- 生图面板中的色板、宽度、Padding、显示开关、字号、格式和图片质量会先显示本机默认值；点击后只临时覆盖本次生图。
- 字体、背景、边框、图片布局和水印只在完整默认设置面板调整，生成时自动使用。
- 切换帖子或重新打开生图面板，会清除临时值和旧预览，再回到本机默认值。
- v0.4.0 首次运行会尝试把旧云端域名下的本机设置迁移到扩展存储；失败不会阻断生图，并会在以后重试。回退到云端时会把当前设置同步给该次云端渲染。

完整参数表见 [ARTICLE_SETTINGS_AUDIT_ZH.md](ARTICLE_SETTINGS_AUDIT_ZH.md)。

## 开发与验证

要求 Node.js 20 和 pnpm 9.15.4。

```bash
pnpm install --frozen-lockfile
pnpm dev:next
pnpm dev:plasmo
pnpm test
pnpm build:next
pnpm build:extension:prod
```

可选的云端备选渲染器使用 Next.js 纯静态导出并部署到 Cloudflare Pages，不需要 VPS。部署、凭证和线上验证见 [SELF_HOSTING_ZH.md](SELF_HOSTING_ZH.md)，工程边界见 [PROJECT_AUDIT_ZH.md](PROJECT_AUDIT_ZH.md)，未完成能力见 [FEATURE_GAP_AUDIT_ZH.md](FEATURE_GAP_AUDIT_ZH.md)。

## 协议

MPL-2.0。再分发修改后的 MPL 文件时需要保留协议、上游声明并提供相应源码，详见 [LICENSE](LICENSE)。

社区：[X](https://x.com/wlzh) | [Discord](https://discord.com/invite/cj9fusHpjQ)
