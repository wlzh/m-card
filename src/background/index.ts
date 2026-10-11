import { sendToContentScript } from "@plasmohq/messaging"

const rendererUrl = process.env.PLASMO_PUBLIC_RENDERER_URL || "http://localhost:1947/independent";
const welcomeUrl = new URL("/welcome", rendererUrl).toString();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkInstallation") {
        // 直接回复 content script
        sendResponse({ isInstalled: true });
    }
});


chrome.runtime.onInstalled.addListener(function (details) {
    console.log('onInstalled', details);
    if (details.reason == "install") {
        chrome.tabs.create({ url: welcomeUrl });
    }
});

// 点击工具栏图标：打开（或聚焦已存在的）卡片面板，水印/宽度/内边距等
// 默认值都在这里设置，Save as Default 后本机生效
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.query({}, function (tabs) {
        const panelTab = tabs.find((t) => (t.url || "").startsWith(rendererUrl));
        if (panelTab && panelTab.id) {
            chrome.tabs.update(panelTab.id, { active: true });
            if (panelTab.windowId) {
                chrome.windows.update(panelTab.windowId, { focused: true });
            }
        } else {
            chrome.tabs.create({ url: rendererUrl });
        }
    });
});
