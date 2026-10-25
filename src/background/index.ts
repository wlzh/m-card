import { CLOUD_RENDERER_URL, CLOUD_SITE_URL } from "@src/config/renderer";

const PHOTOS_HOST = 'com.mcard.photos';
const MAX_BASE64_SIZE = 112 * 1024 * 1024;

const welcomeUrl = new URL("/welcome", CLOUD_RENDERER_URL).toString();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkInstallation") {
        // 直接回复 content script
        sendResponse({ isInstalled: true });
    }
});

chrome.runtime.onConnect.addListener((clientPort) => {
    if (clientPort.name !== 'mcard-photos-import') return;
    const senderUrl = clientPort.sender?.url;
    if (!senderUrl || !/^https:\/\/x\.com(?:\/|$)/.test(senderUrl)) {
        clientPort.disconnect();
        return;
    }

    let nativePort: chrome.runtime.Port;
    let started = false;
    let finished = false;
    let nextIndex = 0;
    let base64Size = 0;
    try {
        nativePort = chrome.runtime.connectNative(PHOTOS_HOST);
    } catch (error) {
        clientPort.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Photos helper is not installed' });
        clientPort.disconnect();
        return;
    }

    const fail = (message: string) => {
        try { clientPort.postMessage({ type: 'error', message }); } catch { /* Tab closed. */ }
        nativePort.disconnect();
    };
    clientPort.onMessage.addListener((message) => {
        if (!message || typeof message !== 'object') return fail('Invalid Photos request');
        if (message.type === 'start' && !started && (message.format === 'png' || message.format === 'jpeg')) {
            started = true;
        } else if (message.type === 'chunk' && started && !finished &&
            message.index === nextIndex && typeof message.data === 'string' &&
            message.data.length <= 256 * 1024 && /^[A-Za-z0-9+/=]+$/.test(message.data) &&
            base64Size + message.data.length <= MAX_BASE64_SIZE) {
            base64Size += message.data.length;
            nextIndex++;
        } else if (message.type === 'end' && started && !finished && nextIndex > 0) {
            finished = true;
        } else {
            return fail('Invalid or oversized Photos request');
        }
        try { nativePort.postMessage(message); } catch { fail('Cannot contact the Photos helper'); }
    });
    nativePort.onMessage.addListener((reply) => {
        try { clientPort.postMessage(reply); } catch { nativePort.disconnect(); }
    });
    nativePort.onDisconnect.addListener(() => {
        const reason = chrome.runtime.lastError?.message || 'Photos helper exited unexpectedly';
        try { clientPort.postMessage({ type: 'error', message: reason }); } catch { /* Tab closed. */ }
        clientPort.disconnect();
    });
    clientPort.onDisconnect.addListener(() => nativePort.disconnect());
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
