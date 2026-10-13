export const CLOUD_RENDERER_URL = process.env.PLASMO_PUBLIC_RENDERER_URL || 'https://mcard.wlz.si/independent';

export const CLOUD_SITE_URL = new URL('/', CLOUD_RENDERER_URL).toString();

export const LOCAL_RENDERER_PATH = 'tabs/renderer.html';

export const isExtensionContextAvailable = () => {
    try {
        return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
    } catch {
        return false;
    }
};

export const isExtensionContextInvalidatedError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('Extension context invalidated');
};

export const getLocalRendererUrl = () => {
    if (!isExtensionContextAvailable()) return CLOUD_RENDERER_URL;
    try {
        return chrome.runtime.getURL(LOCAL_RENDERER_PATH);
    } catch {
        return CLOUD_RENDERER_URL;
    }
};
