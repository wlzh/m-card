# 项目审计与改造记录

## 已验证的上游能力

- X 操作栏按钮、单帖和连帖采集、拖拽排序和删除。
- 背景色、宽度、边距、字体、字号、显示字段和 1x–4x 清晰度。
- PNG、JPEG、SVG 和 Markdown 导出，以及视频封面渲染。
- IndexedDB 模板存储代码存在，网页编辑器还包含微信卡片草稿。

## 本次已完成

- 渲染器与欢迎页改为环境变量地址，支持 Cloudflare Pages 自托管。
- 卡片水印已注释；Gumroad/Supabase 激活路由、扩展消息处理和不可达 UI 已移除。
- 连帖与 1x–4x 默认开放。
- JSON 和素材 ZIP 已接入扩展下载 UI；ZIP 内含每帖 JSON、Markdown、纯文本和可获取的媒体。
- iframe 发送端使用精确 `targetOrigin`，接收端限制为 `https://x.com` 父窗口。
- 移除上游 Microsoft Clarity 和 Google Analytics 埋点。
- 修复视频无 `<source>`、统计节点缺失和帖子节点读取失败时的崩溃路径。

## 尚未完成

- 真正的 HLS/DASH 分片视频合并下载。
- 可配置水印 UI、更多成品卡片主题、导出历史和批量任务队列。
- 修复所有上游 TypeScript 债务，并恢复严格构建门禁。
- 在实际 X 页面完成 DOM、剪贴板权限、多帖和媒体下载的人工验收。
