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

chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.create({ url: welcomeUrl });
});
