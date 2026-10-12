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
    // 文章推文(X Articles)的标题,普通推文为空
    title?: string,
    articleMode?: 'preview' | 'full',
    articleBlocks?: ArticleBlock[],
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

export type ArticleBlock =
    | { type: 'heading' | 'paragraph' | 'quote'; text: string }
    | { type: 'list'; items: string[]; ordered: boolean }
    | { type: 'image'; src: string; alt?: string }
    | { type: 'divider' };

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
        // 默认导出格式与倍率：扩展生成面板未指定时使用
        exportFormat?: string,
        exportScale?: number,
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
        exportFormat: 'png',
        exportScale: 2,
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

// 校验恢复出来的默认值快照形状，防止合法 JSON 但内容错误污染面板
const isValidSettings = (value: any): value is PersistedSettings => {
    return !!value
        && typeof value === 'object'
        && typeof value.colorIndex === 'number'
        && !!value.backgroundStyles && typeof value.backgroundStyles === 'object'
        && !!value.cardStyles && typeof value.cardStyles === 'object'
        && typeof value.cardStyles.width === 'number'
        && !!value.tabConfig && typeof value.tabConfig === 'object';
};

// IndexedDB 存储适配层，与 useTemplatesStore 使用同一套方案。
// 写入做了 300ms 尾沿防抖：拖动滑块这类高频 set 只落一次盘，省 CPU/IO；
// 卸载前 flush 保证不丢最后一次修改。
const PERSIST_DEBOUNCE_MS = 300;
let persistFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWrites = new Map<string, string>();
// 首次 getItem 成功前禁止写入：避免挂载期的任何 set()
// （如示例头像加载触发 addLoadedImage）把出厂默认值写进存储、覆盖用户已有设置
let hydratedFromStorage = false;
// 生成期间暂停落盘（计数式，支持并发生成）：iframe 渲染时临时套用的
// 参数（padding/width 等）不会经防抖写进 IndexedDB 污染默认值
let persistencePauseCount = 0;

export const setPersistencePaused = (paused: boolean) => {
    persistencePauseCount = Math.max(0, persistencePauseCount + (paused ? 1 : -1));
};

// 立即把当前面板设置完整落盘（绕过防抖），用于恢复后兜底
export const persistSettingsNow = async () => {
    const { colorIndex, backgroundStyles, cardStyles, tabConfig } = useCardStore.getState();
    const serialized = JSON.stringify({
        state: { colorIndex, backgroundStyles, cardStyles, tabConfig },
        version: 1,
    });
    await idbSet('card-settings', serialized);
};

const flushPendingWrites = () => {
    persistFlushTimer = null;
    const writes = pendingWrites;
    pendingWrites = new Map();
    writes.forEach((value, key) => {
        void idbSet(key, value);
    });
};

// 跨上下文实时同步：同源的面板标签页 / 生图窗口内嵌面板 / 隐藏渲染 iframe
// 通过 BroadcastChannel 互相同步设置变化。
// ⚠️ 广播必须携带完整新值：若只发「变了」通知、让对端去重读 IndexedDB，
// 对端会在写盘防抖(300ms)窗口内读到旧值，并把旧值回写覆盖新值——
// 用户表现为「改了默认值但没存住」。
let lastBroadcastValue = '';
let settingsChannel: BroadcastChannel | null = null;
const getSettingsChannel = (): BroadcastChannel | null => {
    if (settingsChannel || typeof BroadcastChannel === 'undefined') {
        return settingsChannel;
    }
    try {
        settingsChannel = new BroadcastChannel('mcard-settings');
        settingsChannel.onmessage = async (ev: MessageEvent) => {
            const msg = ev.data as { type?: string; value?: string } | null;
            if (msg?.type !== 'updated' || typeof msg.value !== 'string') return;
            if (persistencePauseCount > 0) return; // 生成中不打扰临时覆盖
            try {
                // 先把广播带来的最新值直接落盘（绕过防抖），再重读——
                // 重读必然读到新值，回写也不会产生旧值覆盖
                await idbSet('card-settings', msg.value);
                lastBroadcastValue = msg.value; // 对端应用不回播，防回环
                await useCardStore.persist.rehydrate();
            } catch {
                // 同步失败则维持内存值，下次生成前还有兜底 rehydrate
            }
        };
    } catch {
        settingsChannel = null;
    }
    return settingsChannel;
};

const broadcastUpdate = (value: string) => {
    if (value === lastBroadcastValue) return;
    lastBroadcastValue = value;
    getSettingsChannel()?.postMessage({ type: 'updated', value });
};

const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        // 读取前先落盘未写完的数据，避免读到旧值
        flushPendingWrites();
        const value = await idbGet<string>(name);
        hydratedFromStorage = true;
        return value || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (!hydratedFromStorage || persistencePauseCount > 0) {
            return;
        }
        pendingWrites.set(name, value);
        // 立即广播（落盘仍走防抖）：其它同源上下文马上重读新值
        if (name === 'card-settings') {
            broadcastUpdate(value);
        }
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
            // 恢复本机默认值；从未保存过或快照损坏/形状不对则回退出厂默认值
            loadDefault: async () => {
                let defaults: PersistedSettings = factorySettings;
                try {
                    const raw = await idbGet<string>(DEFAULTS_STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (isValidSettings(parsed)) {
                            defaults = parsed;
                        } else {
                            console.warn('loadDefault: saved defaults have invalid shape, falling back to factory settings');
                        }
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
            // 嵌套字段逐一合并：旧版本存储里缺的新增字段（如水印）补回默认值。
            // 注意 zustand persist 的签名是 merge(persistedState, currentState)，
            // 两个参数顺序不能反，否则默认值会覆盖恢复出来的设置。
            merge: (persistedState: unknown, currentState: CardStore) => {
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
