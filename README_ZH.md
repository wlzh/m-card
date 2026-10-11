<a name="readme-top"></a>

> 自托管与 Cloudflare Pages 部署说明见 [SELF_HOSTING_ZH.md](./SELF_HOSTING_ZH.md)，完整功能审计见 [PROJECT_AUDIT_ZH.md](./PROJECT_AUDIT_ZH.md)。

<div align="center">
<img src="assets/icon.png" width="32" >
<h1>M.Card</h1>

[English](README.md) | [中文](README_ZH.md)

[![x-cards intro](https://img.youtube.com/vi/v8iQV8ZoVBk/0.jpg)](https://www.youtube.com/watch?v=v8iQV8ZoVBk)

自托管的 X 帖子卡片与数据导出扩展，基于 X Cards 改造。

[![][vercel-shield]][vercel-link]

[![][share-x-shield]][share-x-link]
[![][share-whatsapp-shield]][share-whatsapp-link]
[![][share-reddit-shield]][share-reddit-link]
[![][share-weibo-shield]][share-weibo-link]

[![][share-linkedin-shield]][share-linkedin-link]

[github-issues-link]: https://github.com/wlzh/m-card/issues
[github-contributors-shield]: https://img.shields.io/github/contributors/hzeyuan/OpenGPTS?color=c4f042&labelColor=black&style=flat-square
[github-contributors-link]: https://github.com/hzeyuan/OpenGPTS/graphs/contributors
[vercel-link]: https://mcard.wlz.si
[vercel-shield]: https://img.shields.io/website?down_message=offline&label=website&labelColor=black&style=flat-square&up_message=online&url=https://mcard.wlz.si
[share-linkedin-link]: https://linkedin.com/feed
[share-linkedin-shield]: https://img.shields.io/badge/-share%20on%20linkedin-black?labelColor=black&logo=linkedin&logoColor=white&style=flat-square
[share-reddit-link]: https://www.reddit.com/submit?title=M.Card&url=https://github.com/wlzh/m-card
[share-reddit-shield]: https://img.shields.io/badge/-share%20on%20reddit-black?labelColor=black&logo=reddit&logoColor=white&style=flat-square
[share-telegram-link]: https://t.me/share/url?text=M.Card&url=https://github.com/wlzh/m-card
[share-telegram-shield]: https://img.shields.io/badge/-share%20on%20telegram-black?labelColor=black&logo=telegram&logoColor=white&style=flat-square
[share-weibo-link]: http://service.weibo.com/share/share.php?sharesource=weibo&title=M.Card
[share-weibo-shield]: https://img.shields.io/badge/-share%20on%20weibo-black?labelColor=black&logo=sinaweibo&logoColor=white&style=flat-square
[share-whatsapp-link]: https://api.whatsapp.com/send?text=M.Card
[share-whatsapp-shield]: https://img.shields.io/badge/-share%20on%20whatsapp-black?labelColor=black&logo=whatsapp&logoColor=white&style=flat-square
[share-x-link]: https://x.com/intent/tweet?url=https://github.com/wlzh/m-card
[share-x-shield]: https://img.shields.io/badge/-share%20on%20x-black?labelColor=black&logo=x&logoColor=white&style=flat-square

</div>

⚡ **M.Card** 将 X 帖子导出为图片、Markdown、JSON 和完整资源包。

## 项目背景

X是许多平台的信息来源，因此产生了这个项目。

## Changelog

<details>
<summary><strong>v0.2.0</strong></summary>

- 新增水印功能：面板可开关水印、自定义水印文字（默认 `@wlzh`），导出图片自带水印。
- 所有面板设置（宽度、内边距、背景、水印等）自动保存在本机，刷新后不再丢失。
- 新增「Save as Default / Load Default」：一键保存、恢复个人默认设置；Reset 恢复出厂默认。
- 性能优化：设置写入做防抖处理，拖动滑块不再频繁落盘。

</details>

<details>
<summary><strong>v0.1.0</strong></summary>

- 自托管化，品牌更名为 M.Card。
- 支持部署到 Cloudflare Pages 自定义域名（mcard.wlz.si）。
- 社区链接更新（X / Discord）。

</details>

<details>
<summary><strong>v0.0.3</strong></summary>

- 优化性能，使用web worker生成图片， 处理下拉后x.com空白问题。
- 增加padding设置，调整卡片内边距。
- 增加生成图片质量设置。
- 增加md格式导出。
- 支持调整字体大小。
- 交互优化，安装插件后或者，点击icon，跳转到welcome页面。

<details>
<summary><strong>v0.0.2</strong></summary>

- 新增实时预览功能，现在右上角有个toast可以观察到生成的卡片。
- 引入了自定义卡片背景颜色。
- 可自定义卡片宽度。
- 改进：现在点击默认复制图片，而不是下载图片。
- 修复了视频获取封面图的问题。
- 增加了连续帖子获取的支持。
- 实现了帖子的动态添加、删除、拖拽和管理。

</details>

<details>
<summary><strong>v0.0.1</strong></summary>

- 点击即可轻松访问。
- 获取视频、图片、文本、点赞等。
- 导出多种格式，包括JSON、Markdown、PNG、JPEG和SVG。

</details>

## features

- 简单易用，只需点击一下即生成卡片。
- 轻松获取视频、图片、文字、点赞和浏览历史。
- 支持多种格式导出，包括JSON、Markdown、PNG、JPEG和SVG。
- 模板功能，保存您经常使用的卡片样式。
- 水印功能，默认开启、文字可自定义，本机记住您的选择。
- 全部面板设置本机自动记忆，支持保存与恢复个人默认值。
- 生成面板（x.com 右上角）首次打开即显示并应用您的默认值，面板内调整为仅当次生效的临时值。

<br/>

## How to Use

1. 点击下载插件
   ![Download Extension](./assets/install_guide/1.download.png)

2. 浏览器输入 chrome://extensions/ 并打开开发者模式

3. 解压并，拖动整个文件夹到页面，如图：
   ![Drag the extension file to the page](./assets/install_guide/2.install.png)

4. 打开x.com并浏览帖子，您将在右下角找到您的卡片按钮，参考上方视频。

## 开发指南

本项目使用 Plasmo 框架进行快速 Chrome 扩展开发。
使用 Next.js 进行前端开发。
采用 Tailwind CSS 和 Shadcn 作为 CSS 框架。
使用 Langchain 开发智能代理。
部署在 Vercel 平台上。

Local development:

```bash
pnpm install

# Run frontend
npm run dev:next
# Run plugin
npm run dev:plasmo
```

## Starchart

[![Star History Chart](https://api.star-history.com/svg?repos=hzeyuan/x-cards&type=Date)](https://star-history.com/#hzeyuan/x-cards&Date)
