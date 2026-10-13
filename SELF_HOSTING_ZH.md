# M.Card 自托管部署

## 架构

v0.4.0 起采用本地优先架构：

- Chrome 扩展负责在 `x.com` 读取帖子 DOM、展示操作界面、复制和下载。
- 扩展内置 `tabs/renderer.html`，默认在 `chrome-extension://` 本地隐藏 iframe 中生图，不依赖服务器可用性。
- `PLASMO_PUBLIC_RENDERER_URL` 指向故障回退渲染器；本地页面无法加载或生成失败时，同一次请求自动切换到云端并重试一次。
- 回退前会尽量导出本地设置并导入云端页面，避免云端使用另一套默认值。
- Next.js 站点仍提供官网、欢迎页和备选 `/independent`；纯静态导出可部署到 Cloudflare Pages，不需要 VPS。

## 本地构建

要求 Node.js 20 和 pnpm 9.15.4。

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
NEXT_PUBLIC_SITE_URL=https://mcard.wlz.si pnpm build:next
pnpm build:extension:prod
pnpm package:extension:prod
```

产物：

- Cloudflare Pages 静态目录：`out/`
- Chrome 未打包扩展：`build/chrome-mv3-prod/`
- 扩展 ZIP：`build/chrome-mv3-prod.zip`

## Cloudflare Pages

Wrangler 已通过 `wrangler.toml` 读取 `out/` 作为发布目录。首次部署前确认 Wrangler 当前账户：

```bash
wrangler whoami
wrangler pages project create m-card --production-branch master
pnpm deploy:pages --project-name m-card
```

首次发布后，将真实 `pages.dev` 或自定义域名写入 `PLASMO_PUBLIC_RENDERER_URL`，重新构建扩展。自定义域名可在 Pages 控制台绑定；它只影响备选渲染器和欢迎页，不影响本地生图。

## 部署凭证（仅存本机，不入库）

Wrangler 部署需要 Cloudflare 凭证。项目使用 `.env.local` 保存（已被 `.gitignore` 的 `.env*.local` 规则排除，**不会提交到 GitHub**）：

```bash
# .env.local 内容
CLOUDFLARE_ACCOUNT_ID=<你的账户 ID>
CLOUDFLARE_API_TOKEN=<需要 Pages:Edit 权限的 API Token>
```

填充后，用封装好的脚本一键部署（自动加载 `.env.local`）：

```bash
pnpm deploy:pages:local
```

等价的手动方式：

```bash
set -a; source .env.local; set +a
npx wrangler pages deploy out
```

验证线上效果（绕过本地代理 DNS 缓存）：

```bash
curl --noproxy '*' -sS -L https://mcard.wlz.si/ | head -n 5
```

> 提示：`.env.local` 属于本机私有文件，换机器部署时需要重新创建；仓库里的 `.env.example` 是公开变量的模板，不要把真实 Token 写进去。

## Chrome 安装

1. 打开 `chrome://extensions` 并启用开发者模式。
2. 点击“加载已解压的扩展程序”。
3. 选择 `build/chrome-mv3-prod/`。
4. 打开 `https://x.com` 验证普通帖、文章时间线摘要、文章详情全文、连帖、图片、视频封面、复制和六种下载格式。

工具栏图标打开官网，生图窗口内的“默认设置”打开扩展本地页面。v0.4.0 首次在 X 页面运行时，会尝试把旧 `mcard.wlz.si` origin 下的设置迁移一次；迁移标记保存在 `chrome.storage.local`。不同 Chrome 配置文件仍互不共享。

## 当前边界

- 视频“素材包”会尝试保存当前视频 URL；X 若只暴露 `blob:` 或分片流，仍不等于可移植 MP4 下载。
- 连帖识别依赖 X 当前 DOM 的连接线，X 改版后需要现网回归。
- 上游的网页编辑器有未启用组件和类型债务；生产构建可通过，`pnpm typecheck` 会如实列出它们。
- 云端回退是静态页面，不保存用户帖子或设置到服务端数据库；设置仍属于用户浏览器对应 origin 的 IndexedDB。

## MPL-2.0

保留 `LICENSE` 和上游版权信息。向他人分发扩展或站点时，被修改的 MPL 源文件必须继续以 MPL-2.0 提供源码；独立新增文件可使用其他协议。
