"use client"
import { useEffect, useRef } from "react";
import { useCardStore, type XConfig } from "@src/hooks/useCardStore";
import { CardGenerator } from "../../../(app)/components/card-generator";
import * as _ from "lodash-es"
import { generateImage } from "@src/app/utils/image";
import type { CardConfig } from "@src/components/extension/use-tweet-collection";



export async function generateStaticParams() {
    return [{ slug: 'independent' }]
}

// 生成期间的设置快照（模块级：并发生成时复用第一份，见消息处理逻辑）
let pendingGenerationSnapshot: {
    colorIndex: number,
    backgroundStyles: any,
    cardStyles: any,
    tabConfig: any,
} | null = null;

const Index = () => {

    useEffect(() => {
        const fn = async (event: MessageEvent) => {
            if (event.origin !== 'https://x.com' || event.source !== window.parent) return;
            const actionName = 'generate-card-local'
            if (event.data?.action === actionName && event.data?.body) {

                const body = event.data.body as {
                    tweetInfo: XConfig[],
                    cardConfig: CardConfig,
                }
                const { tweetInfo, cardConfig } = body;
                useCardStore.getState().setXConfig(tweetInfo)

                // 快照面板设置：生成时临时套用扩展传来的参数（padding/fontSize 等），
                // 生成完成后恢复，避免这些临时值写回 IndexedDB 冲掉用户保存的默认值。
                // 想改默认值请在面板里改并 Save as Default —— 那是唯一的事实来源。
                // 快照挂在模块级：并发生成时复用第一份（用户默认值），防止把覆盖值快照进去
                if (!pendingGenerationSnapshot) {
                    const storeBeforeGeneration = useCardStore.getState();
                    pendingGenerationSnapshot = JSON.parse(JSON.stringify({
                        colorIndex: storeBeforeGeneration.colorIndex,
                        backgroundStyles: storeBeforeGeneration.backgroundStyles,
                        cardStyles: storeBeforeGeneration.cardStyles,
                        tabConfig: storeBeforeGeneration.tabConfig,
                    }));
                }

                if (cardConfig?.colorIndex) {
                    useCardStore.getState().setColorIndex(cardConfig.colorIndex);
                }

                if (cardConfig.padding >= 0) {
                    useCardStore.getState().updateBackgroundStyles({
                        padding: cardConfig.padding
                    });
                }

                if (cardConfig.fontSize
                ) {
                    useCardStore.getState().updateCardStyles({
                            fontSize: cardConfig.fontSize as unknown as number,
                        fontFamily: cardConfig.fontFamily || 'Inter'
                    });
                }

                // if (cardConfig.fontFamily) {
                //     loadFont(cardConfig.fontFamily);
                // }

                if (cardConfig?.controls) {
                    useCardStore.getState().updateCardStyles({
                        controls: cardConfig.controls
                    });
                }

                if (cardConfig?.width) {
                    useCardStore.getState().updateCardStyles({
                        width: cardConfig.width,
                        // height: cardConfig.height
                    });
                }

                // const loadedImages = useCardStore.getState().loadedImages;
                // const images = _.flatten(tweetInfo.map((tweet) => tweet.images));
                // let allImagesLoaded = _.every(images, (src) => loadedImages[src] === 'success' || loadedImages[src] === 'error');
                // // console.log('本次等待加载的图片', images);
                // while (!allImagesLoaded) {
                //     // console.log('等待图片加载完成', loadedImages);
                //     allImagesLoaded = _.every(images, (src) => loadedImages[src] === 'success' || loadedImages[src] === 'error');
                //     await new Promise((resolve) => setTimeout(resolve, 1000));
                // }

                requestAnimationFrame(async () => {
                    try {
                        const dataUrl = await generateImage({
                            format: cardConfig?.format || 'png',
                            scale: cardConfig?.scale || 2,
                            fontFamily: cardConfig.fontFamily || false,
                        });
                        (event.source as Window)?.postMessage({
                            action: actionName,
                            value: { dataUrl }
                        }, event.origin);
                    } catch (error) {
                        (event.source as Window)?.postMessage({
                            action: actionName,
                            value: { error: error instanceof Error ? error.message : 'Card generation failed' }
                        }, event.origin);
                    } finally {
                        // 图片已生成完毕（DOM 截图结束），恢复面板默认设置
                        if (pendingGenerationSnapshot) {
                            useCardStore.setState(pendingGenerationSnapshot);
                            pendingGenerationSnapshot = null;
                        }
                    }
                });
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('message', fn);

            return () => {
                window.removeEventListener('message', fn);
            }
        }
    }, [])





    return (
        <CardGenerator></CardGenerator>
    );
}

export default Index;
