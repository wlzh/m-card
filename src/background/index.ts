import { CLOUD_RENDERER_URL, CLOUD_SITE_URL } from "@src/config/renderer";

const welcomeUrl = new URL("/welcome", CLOUD_RENDERER_URL).toString();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkInstallation") {
        // 直接回复 content script
        sendResponse({ isInstalled: true });
    }
});


chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.tabs.create({ url: welcomeUrl });
    }
});

// 工具栏图标用于进入官网；本地默认设置从 X 生图面板打开。
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.query({}, function (tabs) {
        const websiteTab = tabs.find((t) => {
            if (!t.url) return false;
            try {
                const url = new URL(t.url);
                const website = new URL(CLOUD_SITE_URL);
                return url.origin === website.origin && url.pathname === website.pathname;
            } catch {
                return false;
            }
        });
        if (websiteTab && websiteTab.id) {
            chrome.tabs.update(websiteTab.id, { active: true });
            if (websiteTab.windowId) {
                chrome.windows.update(websiteTab.windowId, { focused: true });
            }
        } else {
            chrome.tabs.create({ url: CLOUD_SITE_URL });
        }
    });
});
