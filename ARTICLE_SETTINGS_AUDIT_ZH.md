# M.Card 0.4.1 文章与设置核对

核对日期：2026-10-13。示例：https://x.com/wlzh/status/2109433207318081885

## 文章来源与边界

- 实际详情 DOM：标题 `twitter-article-title`，正文 `twitterArticleRichTextView`，嵌套 `longformRichTextComponent` 不重复拼接。
- 示例实测标题“免费领 Cursor Pro：MLH Global Hack Week 保姆级图文教程”，正文 4,749 字符、图片 8 张。
- 时间线只含标题、摘要和封面，标记为“文章摘要”。进入文章后才有全文，插件不自动请求未加载的全文。
- 普通推文不再混入全页 og:description 或被引用推文的正文。
- 修复图片布局截断到 2/4 张、两三张时忽略所选布局、异步 Loading 占位被截入成图的问题。
- 详情页正文按 DOM 结构采集为标题、段落、列表、引用、分隔线和图片块，图片保持在相邻文字之间；不支持的嵌入组件会降级为文本或忽略。

## 设置映射

完整设置面板自动保存当前设置到扩展 origin 的 IndexedDB `card-settings`。`Save as Default` 另存恢复快照 `card-defaults`；`Load Default` 恢复该快照；`Reset` 恢复出厂设置。帖子内容不保存。

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
| Time / Actions | 开 | 脚注内部各自控制；时间固定单行，互动项在下一行安全换行 |
| Watermark | 开，@wlzh | 单独的水印开关和文字，不受 Footer 影响 |
| Preset Color | 见 factorySettings.colorIndex | 快捷色板；选择预设退出自定义渐变/颜色/图片 |
| Custom Color | 关 | 自定义背景色；优先级低于开启的 Gradient |
| Background Opacity / Blur | 1 / 0px | 正确保存数值并应用 CSS |
| Gradient | 关，0deg，白到白 | 自定义渐变开关、角度和两端颜色 |
| Background Image | 空 | 本地图片数据保存，选预设时清除 |
| Noise / Opacity | 关 / 0.05 | 渲染链路已内联噪点资源，但当前控制器未开放该选项，属于保留参数 |

快捷生图面板的修改是当前会话覆盖值，不覆盖上述持久默认值；切换帖子或重新打开生图面板会清除临时值和旧预览，再回到本机默认值。并发请求按请求 ID 对应并串行渲染，结束后恢复默认值，不将临时配置写回存储。

同机不同浏览器、不同 Chrome 配置文件不是同一份存储。v0.4.0 的默认值保存在扩展 origin，不会由多个用户共享到 Cloudflare；旧云端 origin 设置会尝试一次性迁移。故障回退时当前本地设置会传给云端页面用于当次渲染，但不会形成服务端数据库或跨浏览器同步。

## 验证与剩余验收

- `pnpm test` 覆盖文章选择器、图文顺序、摘要/引用隔离、预览空态、页脚布局、渲染参数、八张配图和持久化恢复。DOM 与 IndexedDB 测试替身不冒充安装环境验收。
- Next.js 与 Chrome 扩展生产构建是发布门禁；`pnpm typecheck` 仍会如实列出上游未挂载组件的旧类型债务。
- Cloudflare 发布后必须分别检查 Pages 默认域名与 `https://mcard.wlz.si/independent`；重新加载后的 Chrome 扩展还需单独检查本地渲染和断网/故障回退，不能以构建通过代替安装环境验收。
