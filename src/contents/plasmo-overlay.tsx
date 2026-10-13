import React, { useEffect, useRef } from 'react'
import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoRender } from "plasmo"
// import 'tippy.js/dist/tippy.css';
import cssText from "data-text:@src/contents/plasmo-overlay.css"
import { Toaster } from 'react-hot-toast';
import { iframeMessageSystem } from '@src/app/utils/IFrameMessageSystem';
import { useTweetsStore } from '@src/components/extension/use-tweet-collection';
import { createRoot } from 'react-dom/client';
import { CLOUD_RENDERER_URL, getLocalRendererUrl } from '@src/config/renderer';
export const config: PlasmoCSConfig = {
    matches: ["https://x.com/*"],
}


export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

export const getShadowHostId = () => "x-cards-overlay"



const AnchorOverlay: React.FC<PlasmoCSUIProps> = ({ anchor }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const migrationHostRef = useRef<HTMLDivElement>(null)
    const localRendererURL = getLocalRendererUrl();


    useEffect(() => {
        const unsubscribe = iframeMessageSystem.subscribe('generate-card-local', (value: any) => {
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const migrationKey = 'mcard-cloud-settings-migrated-v1';

        const waitForRenderer = async (iframe: HTMLIFrameElement, attempts = 5) => {
            let lastError: unknown;
            for (let attempt = 0; attempt < attempts; attempt += 1) {
                try {
                    return await iframeMessageSystem.publish(iframe, 'renderer-ping', {}, 1200);
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError;
        };

        const migrateCloudSettings = async () => {
            const migrated = await chrome.storage.local.get(migrationKey);
            if (migrated[migrationKey] || cancelled || !iframeRef.current || !migrationHostRef.current) return;

            const cloudFrame = document.createElement('iframe');
            cloudFrame.src = CLOUD_RENDERER_URL;
            cloudFrame.title = 'M.Card cloud settings migration';
            cloudFrame.style.cssText = 'width:0;height:0;border:0;opacity:0;position:absolute;';
            migrationHostRef.current.appendChild(cloudFrame);

            try {
                await waitForRenderer(cloudFrame);
                const settings = await iframeMessageSystem.publish(cloudFrame, 'export-card-settings', {}, 5000);
                await waitForRenderer(iframeRef.current);
                await iframeMessageSystem.publish(iframeRef.current, 'import-card-settings', settings, 5000);
                await chrome.storage.local.set({ [migrationKey]: true });
            } catch (error) {
                console.warn('[m-card] Cloud settings migration deferred:', error);
            } finally {
                cloudFrame.remove();
            }
        };

        void migrateCloudSettings();
        return () => {
            cancelled = true;
        };
    }, [localRendererURL]);


    return (
        <div>
            {/* <PreviewToast tweetInfo={{}} tweetInfos={[]} /> */}
            <iframe
                ref={iframeRef}
                id="x-card-ai"
                src={localRendererURL}
                data-renderer-mode="local"
                data-fallback-src={CLOUD_RENDERER_URL}
                style={{
                    width: '100vw',
                    height: '0px',
                    border: 'none',
                    opacity: 0,
                }}
            />
            <div ref={migrationHostRef} />
        </div >
    )
}


export const render: PlasmoRender<Element> = async ({
    anchor,
    createRootContainer
}) => {
    if (!anchor || !createRootContainer) return

    const rootContainer = await createRootContainer(anchor)

    const variantStyle = document.createElement("style")
    variantStyle.textContent = `
    :host {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
}
    `

    const style = document.createElement("style")

    const wrapper = document.createElement('xcards-ui')


    // Attach the wrapper to the document body
    document.body.appendChild(wrapper)

    // Create a shadow root
    const shadowRoot = wrapper.attachShadow({ mode: 'open' })

    style.textContent = cssText;
    shadowRoot.appendChild(style)
    shadowRoot.appendChild(variantStyle)

    // Append the rootContainer to the shadow root
    shadowRoot.appendChild(rootContainer)

    const root = createRoot(rootContainer)
    root.render(
        <div>
            <Toaster
                toastOptions={{
                    className: '',
                    style: {
                        display: "flex",
                        alignItems: "center",
                        background: "#333",
                        color: "#fff",
                        lineHeight: 1.3,
                        willChange: "transform",
                        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)",
                        maxWidth: "350px",
                        pointerEvents: "auto",
                        padding: "8px 10px",
                        borderRadius: "10px"
                    },
                }}
            />
            <AnchorOverlay></AnchorOverlay>
        </div>
    )
}
