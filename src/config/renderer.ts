export const CLOUD_RENDERER_URL = process.env.PLASMO_PUBLIC_RENDERER_URL || 'https://mcard.wlz.si/independent';

export const LOCAL_RENDERER_PATH = 'tabs/renderer.html';

export const getLocalRendererUrl = () => chrome.runtime.getURL(LOCAL_RENDERER_PATH);
