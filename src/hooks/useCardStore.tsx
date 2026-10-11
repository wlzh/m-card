import type { TweetControlState } from '@src/components/extension/use-tweet-collection';
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'


type Frame = 'none' | 'macos' | 'windows'

type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'whatsapp' | 'youtube' | 'common'

type PostType = 'landscape' | 'square' | 'portrait' | 'post' | 'story' | 'thumbnail';

type AspectRatio = '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16' | '3:1'


interface ImageDimensions {
    width: number;
    height: number;

}

// 各大社交平台的卡片比例
type ImageLayoutProps = {
    social: SocialPlatform;
    layoutOptions: LayoutOption[];

}


export interface LayoutOption {
    ratio: AspectRatio;
    dimensions: ImageDimensions;
    name: string;
    scale?: number;
}


const instagramLayouts: ImageLayoutProps = {
    social: 'instagram',
    layoutOptions: [
        { ratio: '1:1', name: '', dimensions: { width: 1080, height: 1080 } },
        { ratio: '4:5', name: '', dimensions: { width: 1080, height: 1350 } },
    ]
};

const twitterLayouts: ImageLayoutProps = {
    social: 'facebook',
    layoutOptions: [
        { ratio: '16:9', name: '', dimensions: { width: 1080, height: 1920 } },
        { ratio: '3:1', name: '', dimensions: { width: 1500, height: 500 } },
    ]
};

const YoutubeLayouts: ImageLayoutProps = {
    social: 'youtube',
    layoutOptions: [
        { ratio: '16:9', name: 'Banner', dimensions: { width: 2560, height: 1440 } },
        { ratio: '16:9', name: 'Thumbnail', dimensions: { width: 1280, height: 720 } },
        { ratio: '16:9', name: 'video', dimensions: { width: 1280, height: 720 } },
    ]
};

export const CommonLayouts: ImageLayoutProps = {
    social: 'common',
    layoutOptions: [
        { ratio: '16:9', name: '', dimensions: { width: 1920, height: 1080, } },
        { ratio: '3:2', name: '', dimensions: { width: 1920, height: 1280 } },
        { ratio: '4:3', name: '', dimensions: { width: 1920, height: 1440 } },
        { ratio: '5:4', name: '', dimensions: { width: 1920, height: 1536 } },
        { ratio: '1:1', name: '', dimensions: { width: 1920, height: 1920 } },
        { ratio: '4:5', name: '', dimensions: { width: 1080, height: 1350 } },
        { ratio: '3:4', name: '', dimensions: { width: 1080, height: 1440 } },
        { ratio: '2:3', name: '', dimensions: { width: 1080, height: 1620 } },
        { ratio: '9:16', name: '', dimensions: { width: 1080, height: 1920 } },
    ]
};


export const CardWidths = {
    sm: 440,
    md: 582.547,
    lg: 768,
    xl: 1024
};

export interface XConfig {
    //发帖账号URL
    authorUrl: string,
    url: string;
    avatar: string,
    username: string,
    text: string,
    links?: {
        href: string,
        text: string,
        src?: string,
    }[],
    video?: {
        src: string,
        poster: string,
    },
    tags?: string[],
    images: string[],
    replies: number,
    likes: number,
    shares: number,
    time: number,
}

export interface CardStore {
    loadedImages: {
        [key: string]: 'success' | 'error'
    },
    setLoadedImages: (loadedImages: CardStore['loadedImages']) => void;
    addLoadedImage: (src: string, status: 'success' | 'error') => void;
    xConfig: XConfig[],
    setXConfig: (config: XConfig[]) => void;
    colorIndex: number;
    setColorIndex: (colorIndex: number) => void;
    frame: Frame;
    setFrame: (frame: Frame) => void;
    noise: number;
    setNoise: (noise: number) => void;
    backgroundStyles: {
        borderRadius: number,
        padding: number,
        backgroundWidth: number,
        backgroundImage?: string,
        backgroundOpacity?: number,
        backgroundBlur?: number,
        backgroundColor?: string,
        backgroundRepeat?: string,
        backgroundBlendMode?: string,
        backgroundGradient?: string,
        backgroundGradientAngle?: number,
        backgroundStartColor?: string,
        backgroundEndColor?: string,
        useGradient?: boolean,

        backgroundFilter: {
            brightness: number,
            contrast: number,
            saturate: number,
            hueRotate: number,
            invert: number,
        }
    },
    cardStyles: {
        style: 'posts' | 'article'
        width: number,
        height: number,
        aspectRatio?: AspectRatio,
        // imageLayout?: ImageLayoutProps['layout'],
        scale: number,
        fontSize: number,
        borderRadius: number,
        hasNoiseTexture: boolean,
        noiseTextureOpacity: number,
        texturePosition: string,
        texture: string,
        borderWidth: number,
        borderColor?: string,
        imageLayout?: string,
        controls: TweetControlState
        fontFamily: string,
        watermark: {
            enabled: boolean,
            text: string,
        },

    },
    tabConfig: {
        openCustomColor: boolean,
    }
    setTabConfig: (tab: {
        openCustomColor?: boolean,
    }) => void;
    updateCardStyles: (cardStyles: Partial<CardStore['cardStyles']>) => void;
    updateBackgroundStyles: (backgroundStyles: any) => void;
    resetAll: () => void;
    // 把当前面板设置保存为个人默认值（本机持久化，下次进入自动生效）
    saveAsDefault: () => Promise<void>;
    // 恢复为已保存的个人默认值；未保存过则回退到出厂默认值
    loadDefault: () => Promise<void>;

}

// 面板可持久化的设置项（不含帖子内容等临时数据）
type PersistedSettings = Pick<CardStore, 'colorIndex' | 'backgroundStyles' | 'cardStyles' | 'tabConfig'>;

// 出厂默认值：所有「重置」操作都回到这里
export const factorySettings: PersistedSettings = {
    colorIndex: 0,
    tabConfig: {
        openCustomColor: false
    },
    backgroundStyles: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: '',
        backgroundWidth: 100,
        backgroundImage: '',
        // 透明度和模糊
        backgroundOpacity: 1,
        backgroundBlur: 0,
        // 混合模式
        backgroundBlendMode: 'normal', // 'multiply', 'screen', 'overlay'等
        // 渐变
        backgroundGradient: '',
        backgroundGradientAngle: 0,
        backgroundStartColor: '#fff',
        backgroundEndColor: '#fff',
        backgroundRepeat: 'no-repeat',

        // 滤镜
        backgroundFilter: {
            brightness: 100,
            contrast: 100,
            saturate: 100,
            hueRotate: 0,
            invert: 0,
        },
    },
    cardStyles: {
        style: 'posts',
        width: 582.547,
        height: 1080,
        borderRadius: 20,
        fontSize: 16,
        scale: 100,
        texture: '',
        fontFamily: 'sans-serif',
        hasNoiseTexture: false,
        noiseTextureOpacity: 0.05,
        texturePosition: 'center',
        borderWidth: 0,
        controls: {
            showUser: true,
            showActions: true,
            showTime: true,
            showFooter: true,
            showLogo: true,
        },
        watermark: {
            enabled: true,
            text: '@wlzh',
        },
    },
};

// 本机持久化的「个人默认值」快照存放在这个 IndexedDB key 里
const DEFAULTS_STORAGE_KEY = 'card-defaults';

// IndexedDB 存储适配层，与 useTemplatesStore 使用同一套方案。
// 写入做了 300ms 尾沿防抖：拖动滑块这类高频 set 只落一次盘，省 CPU/IO；
// 卸载前 flush 保证不丢最后一次修改。
const PERSIST_DEBOUNCE_MS = 300;
let persistFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWrites = new Map<string, string>();

const flushPendingWrites = () => {
    persistFlushTimer = null;
    const writes = pendingWrites;
    pendingWrites = new Map();
    writes.forEach((value, key) => {
        void idbSet(key, value);
    });
};

const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        // 读取前先落盘未写完的数据，避免读到旧值
        flushPendingWrites();
        return (await idbGet(name)) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        pendingWrites.set(name, value);
        if (persistFlushTimer) {
            clearTimeout(persistFlushTimer);
        }
        persistFlushTimer = setTimeout(flushPendingWrites, PERSIST_DEBOUNCE_MS);
    },
    removeItem: async (name: string): Promise<void> => {
        pendingWrites.delete(name);
        await idbDel(name)
    },
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', flushPendingWrites);
    // 扩展面板 iframe 被关闭时 beforeunload 不一定触发，pagehide 再兜底一次
    window.addEventListener('pagehide', flushPendingWrites);
}

export const useCardStore = create(
    persist<CardStore, [], [], PersistedSettings>(
        (set, get) => ({
            loadedImages: {},
            setLoadedImages: (loadedImages) => set({ loadedImages }),
            addLoadedImage: (src, status) => {
                set({
                    loadedImages: {
                        ...get().loadedImages,
                        [src]: status
                    }
                })
            },
            xConfig: [{
                authorUrl:'',
                username: '@FeigelC35583',
                images: [],
                // images: ['https://pbs.twimg.com/media/GTzQPUhbQAA0mwk?format=jpg&name=large', 'https://pbs.twimg.com/media/GUa0UwYaoAAYPCY?format=jpg'],
                // images: ['https://pbs.twimg.com/media/GUa0UwYaoAAYPCY?format=jpg'],
                url: '',
                avatar: 'https://pbs.twimg.com/media/GUa0UwYaoAAYPCY?format=jpg',
                text: `hello`,
                replies: 6,
                likes: 6,
                shares: 6,
                time: 1722090490
            },
            ],
            setXConfig: (config) => {
                set({
                    xConfig: [...config]
                })


            },
            colorIndex: factorySettings.colorIndex,
            setColorIndex: (colorIndex) => set({ colorIndex }),
            tabConfig: factorySettings.tabConfig,
            setTabConfig: (tab) => {
                set({
                    tabConfig: {
                        ...get().tabConfig,
                        ...tab
                    }
                })
            },
            frame: 'none',
            setFrame: (frame) => set({ frame }),
            noise: 0,
            setNoise: (noise) => set({ noise }),
            backgroundStyles: factorySettings.backgroundStyles,
            cardStyles: factorySettings.cardStyles,
            updateCardStyles: (partCardStyles) => {
                set({
                    cardStyles: {
                        ...get().cardStyles,
                        ...partCardStyles
                    }
                })
            },
            updateBackgroundStyles: (partBackgroundStyles) => {
                set({
                    backgroundStyles: {
                        ...get().backgroundStyles,
                        ...partBackgroundStyles
                    }
                })
            },
            // 重置到出厂默认值
            resetAll: () => set({ ...factorySettings }),
            // 把当前面板设置保存为本机默认值
            saveAsDefault: async () => {
                const { colorIndex, backgroundStyles, cardStyles, tabConfig } = get();
                const snapshot: PersistedSettings = { colorIndex, backgroundStyles, cardStyles, tabConfig };
                await idbSet(DEFAULTS_STORAGE_KEY, JSON.stringify(snapshot));
            },
            // 恢复本机默认值；从未保存过或快照损坏则回退出厂默认值
            loadDefault: async () => {
                let defaults: PersistedSettings = factorySettings;
                try {
                    const raw = await idbGet<string>(DEFAULTS_STORAGE_KEY);
                    if (raw) {
                        defaults = JSON.parse(raw);
                    }
                } catch (err) {
                    console.warn('loadDefault: saved defaults corrupted, falling back to factory settings', err);
                }
                set({ ...defaults });
            },
        }),
        {
            name: 'card-settings',
            version: 1,
            storage: createJSONStorage<PersistedSettings>(() => storage),
            // 只持久化面板设置；帖子内容、图片加载状态属于会话数据不保存
            partialize: (state): PersistedSettings => ({
                colorIndex: state.colorIndex,
                backgroundStyles: state.backgroundStyles,
                cardStyles: state.cardStyles,
                tabConfig: state.tabConfig,
            }),
            // 嵌套字段逐一合并：旧版本存储里缺的新增字段（如水印）补回默认值
            merge: (currentState: CardStore, persistedState: unknown) => {
                const persisted = (persistedState || {}) as Partial<PersistedSettings>;
                return {
                    ...currentState,
                    ...persisted,
                    backgroundStyles: {
                        ...currentState.backgroundStyles,
                        ...persisted.backgroundStyles,
                        backgroundFilter: {
                            ...currentState.backgroundStyles.backgroundFilter,
                            ...persisted.backgroundStyles?.backgroundFilter,
                        },
                    },
                    cardStyles: {
                        ...currentState.cardStyles,
                        ...persisted.cardStyles,
                        controls: {
                            ...currentState.cardStyles.controls,
                            ...persisted.cardStyles?.controls,
                        },
                        watermark: {
                            ...currentState.cardStyles.watermark,
                            ...persisted.cardStyles?.watermark,
                        },
                    },
                };
            },
        }
    )
)