# Mac「照片」一键导入

M.Card 的「Save to Mac Photos」按钮仅支持 PNG/JPEG，导入本机「照片」的 `M.Card` 相簿。扩展仍优先在本地生图，原有云端渲染回退不变；生成后的图片直接从扩展传给本机助手，不经过单独上传接口。本功能为 macOS 和 Google Chrome 专用，必须额外安装无界面的本机助手。

## 安装

1. 先运行 `pnpm build:extension:prod`，在 `chrome://extensions` 加载 `build/chrome-mv3-prod/`，打开“开发者模式”并复制 M.Card 的 32 位扩展程序 ID。
2. 在本仓库目录执行 `bash scripts/install-photos-helper.sh 这里填写扩展程序ID`。安装脚本使用系统 Swift 编译器；如果提示缺少编译器，先运行 `xcode-select --install`。
3. 在 `chrome://extensions` 重新加载 M.Card，并刷新已打开的 X 页面。
4. 在 X 生图面板选择 PNG 或 JPEG，点击「Save to Mac Photos」。首次导入时按 macOS 提示允许控制「照片」。如果权限被拒绝，可到“系统设置 → 隐私与安全性 → 自动化”检查。

扩展 ID 变化（例如换了加载目录或换了一台 Mac）时，重新运行安装脚本并传入新 ID。不要把官网域名、GitHub 用户名或 Cloudflare token 当作扩展 ID。

## 数据与故障

- 本机助手安装在 `~/Library/Application Support/M.Card/photos-helper/`；Chrome Native Messaging 配置位于 `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.mcard.photos.json`。
- 为兼容「照片」的“引用原文件”设置，导入原图保留在 `~/Pictures/M.Card Imports/`。如果「照片」设置为“将项目拷贝到照片图库”，导入后可自行清理该文件夹；若关闭了拷贝选项，不要删除这里的原图，否则「照片」会丢失引用。
- SVG、Markdown、JSON 和素材 ZIP 不能导入「照片」，面板按钮会禁用；下载、复制功能仍照常使用。
- 点击后会等待本机助手确认导入。若按钮报“未安装助手”或“禁止访问”，核对扩展 ID、重新加载扩展，并确认系统权限。导入失败时原图会保留在上述文件夹供手动恢复。
- 通过 `bash scripts/install-photos-helper.sh 新扩展程序ID` 可更新安装。卸载时删除上述助手目录与 Native Messaging JSON；不会删除已经导入的照片或 `M.Card Imports` 原图。
