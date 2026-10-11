"use client"
import { useEffect, useRef } from "react";
import { useCardStore, setPersistencePaused, persistSettingsNow, type XConfig } from "@src/hooks/useCardStore";
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

            // 生成面板（toast）首次打开时拉取本机默认值，用于按钮高亮等 UI 显示
            if (event.data?.action === 'get-card-defaults') {
                try {
                    await useCardStore.persist.rehydrate();
                } catch (rehydrateError) {
                    console.warn('rehydrate for get-card-defaults failed', rehydrateError);
                }
                const { colorIndex, backgroundStyles, cardStyles } = useCardStore.getState();
                (event.source as Window)?.postMessage({
                    action: 'get-card-defaults',
                    value: {
                        colorIndex,
                        width: cardStyles.width,
                        padding: backgroundStyles.padding,
                        fontSize: cardStyles.fontSize,
                        fontFamily: cardStyles.fontFamily,
                        format: cardStyles.exportFormat || 'png',
                        scale: cardStyles.exportScale || 2,
                        controls: cardStyles.controls,
                    },
                }, event.origin);
                return;
            }

            const actionName = 'generate-card-local'
            if (event.data?.action === actionName && event.data?.body) {

                const body = event.data.body as {
                    tweetInfo: XConfig[],
                    cardConfig: CardConfig,
                }
                const { tweetInfo, cardConfig } = body;

                // 关键：生成前强制从 IndexedDB 重新读取本机默认值。
                // 这个 iframe 是常驻的，store 只在页面加载时 rehydrate 一次；
                // 用户随后在面板（另一个标签页）里改的水印/宽度等默认值，
                // 不会自动同步到这里的内存 store，必须显式重读。
                try {
                    await useCardStore.persist.rehydrate();
                } catch (rehydrateError) {
                    console.warn('rehydrate before generation failed, using in-memory settings', rehydrateError);
                }

                useCardStore.getState().setXConfig(tweetInfo)

                // 快照面板设置：生成时临时套用扩展传来的参数（padding/fontSize 等），
                // 生成完成后恢复，避免这些临时值写回 IndexedDB 冲掉用户保存的默认值。
                // 想改默认值请在面板里改并 Save as Default —— 那是唯一的事实来源。
                // 快照挂在模块级：并发生成时复用第一份（用户默认值），防止把覆盖值快照进去。
                // 同时暂停持久化（计数式）：临时值即使触发 set 也不会经防抖落盘
                if (!pendingGenerationSnapshot) {
                    const storeBeforeGeneration = useCardStore.getState();
                    pendingGenerationSnapshot = JSON.parse(JSON.stringify({
                        colorIndex: storeBeforeGeneration.colorIndex,
                        backgroundStyles: storeBeforeGeneration.backgroundStyles,
                        cardStyles: storeBeforeGeneration.cardStyles,
                        tabConfig: storeBeforeGeneration.tabConfig,
                    }));
                }
                setPersistencePaused(true);

                // 以下参数只在扩展生成面板里实际调整过才会出现（cardConfig 初始为空），
                // 未调整的字段保持面板（本机默认值）的设置
                if (cardConfig?.colorIndex != null) {
                    // 与配置面板同语义：选预设即退出渐变/自定义纯色，预设立即生效
                    useCardStore.getState().setColorIndex(cardConfig.colorIndex);
                    useCardStore.getState().updateBackgroundStyles({ useGradient: false });
                    useCardStore.getState().setTabConfig({ openCustomColor: false });
                }

                if (cardConfig?.padding >= 0) {
                    useCardStore.getState().updateBackgroundStyles({
                        padding: cardConfig.padding
                    });
                }

                if (cardConfig?.fontSize != null) {
                    const fontSizePatch: {
                        fontSize: number,
                        fontFamily?: string,
                    } = {
                        fontSize: cardConfig.fontSize,
                    };
                    // 只在明确选择了字体时才覆盖，否则保留面板默认字体
                    if (cardConfig.fontFamily) {
                        fontSizePatch.fontFamily = cardConfig.fontFamily;
                    }
                    useCardStore.getState().updateCardStyles(fontSizePatch);
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

                // 双 rAF + 短延时：确保 React 已把刚写入的状态（帖子内容/水印/临时参数）
                // commit 到 DOM 再截图，避免截到旧画面（水印缺失的一大来源）
                requestAnimationFrame(() => {
                    requestAnimationFrame(async () => {
                        await new Promise((r) => setTimeout(r, 120));
                        try {
                            // 导出格式/倍率：优先用生成面板里选的，否则用面板保存的默认值
                            const currentStore = useCardStore.getState();
                            const dataUrl = await generateImage({
                                format: cardConfig?.format || currentStore.cardStyles.exportFormat || 'png',
                                scale: cardConfig?.scale || currentStore.cardStyles.exportScale || 2,
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
                            // 图片已生成完毕（DOM 截图结束），恢复面板默认设置并解除持久化暂停
                            if (pendingGenerationSnapshot) {
                                useCardStore.setState(pendingGenerationSnapshot);
                                pendingGenerationSnapshot = null;
                            }
                            setPersistencePaused(false);
                            // 解除暂停后强制落盘一次快照值，兜底保证存储 == 内存（防抖期间可能有一次被暂停丢弃）
                            await persistSettingsNow();
                        }
                    });
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
