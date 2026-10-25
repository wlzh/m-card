# M.Card 0.4.16 文章与设置核对

核对日期：2026-10-25。示例：https://x.com/wlzh/status/2109433207318081885

## 文章来源与边界

- 实际详情 DOM：标题 `twitter-article-title`，正文 `twitterArticleRichTextView`，嵌套 `longformRichTextComponent` 不重复拼接。
- 示例实测标题“免费领 Cursor Pro：MLH Global Hack Week 保姆级图文教程”，正文 4,749 字符、图片 8 张。
- 时间线只含标题、摘要和封面，标记为“文章摘要”。进入文章后才有全文，插件不自动请求未加载的全文。
- 普通推文不再混入全页 og:description 或被引用推文的正文。
- 修复图片布局截断到 2/4 张、两三张时忽略所选布局、异步 Loading 占位被截入成图的问题。
- 详情页正文按 DOM 顺序采集标题、段落、列表、引用、分隔线、图片、语义化表格和代码块；同一容器里多张图片及前后文字不会再只保留首图。不支持的 X 特殊嵌入组件仍会降级为文本或忽略。

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
| Quote | 开 | 普通帖的可见引用卡片；默认设置和生图面板均可关闭，引用内容不会计入主帖图片与互动数 |
| Footer | 开 | 时间和互动数据的总开关 |
| Time / Actions | 开 | 脚注内部各自控制；时间单独一行，replies/shares/likes 在下一行保持单行 |
| Extra Stats | 关 | 浏览量/书签数可选显示在互动数据下一行；X 未提供的字段不显示，开启后水印与最后一行对齐 |
| Watermark | 开，@wlzh；最多 5 个命名预设 | 默认设置管理开关、文字和预设；生图面板可临时选择默认水印、无水印或某个预设，不写回默认值；不受 Footer 影响，与互动数据按文字基线右对齐，过长时在水印区域省略 |
| Preset Color | 见 factorySettings.colorIndex | 快捷色板；选择预设退出自定义渐变/颜色/图片 |
| Custom Color | 关 | 自定义背景色；优先级低于开启的 Gradient |
| Background Opacity / Blur | 1 / 0px | 正确保存数值并应用 CSS |
| Gradient | 关，0deg，白到白 | 自定义渐变开关、角度和两端颜色 |
| Background Image | 空 | 本地图片数据保存，选预设时清除 |
| Noise / Opacity | 关 / 0.05 | 渲染链路已内联噪点资源，但当前控制器未开放该选项，属于保留参数 |

快捷生图面板的修改是当前会话覆盖值，不覆盖上述持久默认值；其中水印选择支持“默认水印”“无水印”和已保存预设。切换帖子或重新打开生图面板会清除临时值和旧预览，再回到本机默认值。并发请求按请求 ID 对应并串行渲染，结束后恢复默认值，不将临时配置写回存储；预览前出错也会回包和恢复设置。读取 IndexedDB 前等待待写值落盘，跨窗口新值会覆盖本地旧的待写值。旧设置缺少预设字段时按空列表兼容，非法或超过 5 条的预设会被清理。

同机不同浏览器、不同 Chrome 配置文件不是同一份存储。v0.4.0 的默认值保存在扩展 origin，不会由多个用户共享到 Cloudflare；旧云端 origin 设置会尝试一次性迁移。故障回退时当前本地设置会传给云端页面用于当次渲染，但不会形成服务端数据库或跨浏览器同步。

## 验证与剩余验收

- `pnpm test` 覆盖文章选择器、图文顺序、摘要/引用隔离、预览空态、页脚布局、渲染参数、八张配图、持久化恢复、跨域样式表和帖子身份。DOM 与 IndexedDB 测试替身不冒充安装环境验收。
- `pnpm typecheck`、Next.js 和 Chrome 扩展生产构建共同作为发布门禁。
- Cloudflare 发布后必须分别检查 Pages 默认域名与 `https://mcard.wlz.si/independent`；重新加载后的 Chrome 扩展还需单独检查本地渲染和断网/故障回退，不能以构建通过代替安装环境验收。
- 2026-10-25 实测发现 Chrome 当时加载的 manifest 仍为 0.4.13，且本地渲染器未就绪后云端回退超时；0.4.15 修正打包顺序并增加 ping 重试，但仍须重新加载新构建并刷新 X 页后复测。
- 加载 0.4.15 后，普通帖在本地渲染器生图成功；示例长文章仍出现并发回退失败。0.4.16 对同一 iframe 合并就绪检查和切换，尚待真实扩展复测。
