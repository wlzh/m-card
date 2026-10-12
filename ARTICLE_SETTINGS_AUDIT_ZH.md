# M.Card 0.3.6 文章与设置核对

核对日期：2026-10-12。示例：https://x.com/wlzh/status/2109433207318081885

## 文章来源与边界

- 实际详情 DOM：标题 `twitter-article-title`，正文 `twitterArticleRichTextView`，嵌套 `longformRichTextComponent` 不重复拼接。
- 示例实测标题“免费领 Cursor Pro：MLH Global Hack Week 保姆级图文教程”，正文 4,749 字符、图片 8 张。
- 时间线只含标题、摘要和封面，标记为“文章摘要”。进入文章后才有全文，插件不自动请求未加载的全文。
- 普通推文不再混入全页 og:description 或被引用推文的正文。
- 修复图片布局截断到 2/4 张、两三张时忽略所选布局、异步 Loading 占位被截入成图的问题。
- 正文保留换行，以纯文本呈现；配图集中排在正文后。暂不等同 X 原文的图文穿插、富文本和表格排版。

## 设置映射

完整设置面板自动保存当前设置到本站 IndexedDB `card-settings`。`Save as Default` 另存恢复快照 `card-defaults`；`Load Default` 恢复该快照；`Reset` 恢复出厂设置。帖子内容不保存。

| 设置 | 出厂值 | 生图侧对应/效果 |
| --- | --- | --- |
| Width | 582.547px | 外层卡片宽度；快捷面板 sm/md/lg/xl；自定义值不强行高亮档位 |
| Padding | 16px | 卡片外围留白；快捷 Padding |
| Font Size | 16px | 正文字号；标题为正文的 1.3 倍；快捷字号 |
| Font Family | sans-serif | 预览和导出字体；联网字体需可访问 Google Fonts |
| Export Format | PNG | 快捷格式；JPEG/SVG 也支持；MD/JSON/Assets 是独立数据导出 |
| Export Scale | 2x | 图片分辨率倍率；预览不再硬编码为 2x |
| Card Scale | 100% | 卡片内容视觉缩放，不是导出倍率 |
| Border Width / Color | 0 / transparent | 卡片边框 |
| Border Radius | 20px | 卡片圆角 |
| Image Layout | auto | 自动或 vertical/grid2/grid4；所有模式保留全部图片 |
| User / Logo | 开 | 作者信息/X 标志；对应快捷 Controls |
| Footer | 开 | 时间和互动数据的总开关 |
| Time / Actions | 开 | 脚注内部各自控制；快捷面板补上 Time |
| Watermark | 开，@wlzh | 单独的水印开关和文字，不受 Footer 影响 |
| Preset Color | 见 factorySettings.colorIndex | 快捷色板；选择预设退出自定义渐变/颜色/图片 |
| Custom Color | 关 | 自定义背景色；优先级低于开启的 Gradient |
| Background Opacity / Blur | 1 / 0px | 正确保存数值并应用 CSS |
| Gradient | 关，0deg，白到白 | 自定义渐变开关、角度和两端颜色 |
| Background Image | 空 | 本地图片数据保存，选预设时清除 |
| Noise / Opacity | 关 / 0.05 | 已打包噪点资源，不再引用缺失的 /noise1.png |

快捷生图面板的修改是当前会话覆盖值，不覆盖上述持久默认值；重新打开生图面板回到本机默认值。并发请求按请求 ID 对应并串行渲染，结束后恢复默认值，不将临时配置写回存储。

同机不同浏览器、不同站点域名不是同一份存储；Chrome 对第三方 iframe 的存储分区也可能导致官网顶层页和 X 内 iframe 分开。优先从 X 生图窗口内打开设置。不能保证跨浏览器同步。

## 验证与剩余验收

Cloudflare 直传成功：`76fffa8c.m-card-685.pages.dev`；`mcard.wlz.si/independent` 已核对返回本次 `page-119706d2a9b9496f.js` 构建。

- `pnpm test`：文章选择器/摘要/引用隔离、渲染参数、八张配图、持久化恢复。DOM 与 IndexedDB 使用测试替身，不冒充安装环境验收。
- 两端生产构建可运行；仓库 `typecheck` 尚存在旧代码类型错误，Next 配置跳过类型检查。
- 真实文章文本已导入本地渲染面板，标题与正文首尾可见。浏览器连接在 PNG 下载验证期间中断，尚未确认下载成功。
- 仍需重新加载 Chrome 已安装插件，再验证时间线摘要和文章全文的实际图片，以及 X 内设置跨刷新恢复。
