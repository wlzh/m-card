# M.Card 自托管部署

## 架构

这不是一个只需安装扩展的离线项目：

- Chrome 扩展负责在 `x.com` 读取帖子 DOM、展示操作界面、复制和下载。
- Next.js 站点的 `/independent` 页面在隐藏 iframe 中完成卡片渲染。
- 扩展通过 `PLASMO_PUBLIC_RENDERER_URL` 指向你的渲染站点，不再依赖上游服务。
- 站点使用 Next.js 纯静态导出，可部署到 Cloudflare Pages，不需要 VPS。

## 本地构建

要求 Node.js 20 和 pnpm 9.15.4。

```bash
pnpm install --frozen-lockfile
NEXT_PUBLIC_SITE_URL=https://mcard.wlz.si pnpm build:next
PLASMO_PUBLIC_RENDERER_URL=https://mcard.wlz.si/independent pnpm build
pnpm package
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

首次发布后，将真实 `pages.dev` 地址写入上面两个环境变量，重新构建站点和扩展并再发布。自定义域名可在 Pages 控制台绑定，绑定后同样要重新构建扩展。

## Chrome 安装

1. 打开 `chrome://extensions` 并启用开发者模式。
2. 点击“加载已解压的扩展程序”。
3. 选择 `build/chrome-mv3-prod/`。
4. 打开 `https://x.com` 验证单帖、连帖、图片、视频封面、复制和六种下载格式。

## 当前边界

- 视频“素材包”会尝试保存当前视频 URL；X 若只暴露 `blob:` 或分片流，仍不等于可移植 MP4 下载。
- 连帖识别依赖 X 当前 DOM 的连接线，X 改版后需要现网回归。
- 上游的网页编辑器有未启用组件和类型债务；生产构建可通过，`pnpm typecheck` 会如实列出它们。

## MPL-2.0

保留 `LICENSE` 和上游版权信息。向他人分发扩展或站点时，被修改的 MPL 源文件必须继续以 MPL-2.0 提供源码；独立新增文件可使用其他协议。
