import type { CardStore, XConfig } from "@src/hooks/useCardStore";
import { create } from "zustand";

export interface TweetControlState {
    showUser: boolean;
    showActions: boolean;
    showTime: boolean;
    showFooter: boolean;
    showLogo: boolean;
}

export interface CardConfig {
    padding: number;
    format: string,
    controls: TweetControlState
    width: number;
    colorIndex: number;
    scale: number;
    fontSize: number;
    fontFamily: string;
}

// 生成面板（toast）首次加载时从渲染 iframe 拉取的本机默认值快照。
// 仅用于 UI 显示（按钮高亮/初始状态），不参与生成——生成侧未调整的参数
// 由 iframe 自行回落到 IndexedDB 里的同一份默认值。
export interface CardUIDefaults {
    colorIndex: number;
    width: number;
    padding: number;
    fontSize: number;
    fontFamily: string;
    format: string;
    scale: number;
    controls: TweetControlState;
}

export const getTweetIdentity = (tweet: XConfig) => {
    if (tweet.url) return tweet.url;
    if (tweet.authorUrl || tweet.time) return `${tweet.authorUrl}|${tweet.time}`;
    return tweet.text;
};

interface TweetCollection {

    cardConfig: Partial<CardConfig>;
    setCardConfig: (cardConfig: Partial<CardConfig>) => void;
    uiDefaults: Partial<CardUIDefaults>;
    setUIDefaults: (uiDefaults: Partial<CardUIDefaults>) => void;
    isActivated: boolean;
    setIsActivated: (isActivated: boolean) => void;
    imageSrc?: string;
    setImageSrc: (imageSrc: string) => void;
    activeTab: string,
    setActiveTab: (tabValue: string) => void;
    tweets: XConfig[];
    setTweets: (tweets: XConfig[]) => void;
    getTweets: () => XConfig[];
    addTweet: (tweet: XConfig | XConfig[]) => void;
    removeTweet: (tweet: XConfig) => void;
    updateTweet: (tweet: XConfig) => void;
    moveTweet: (from: number, to: number) => void;
    resetTweets: () => void;
    // const [showCodeDialog, setShowCodeDialog] = useState(false);
    showCodeDialog: boolean;
    setShowCodeDialog: (showCodeDialog: boolean) => void;


}

export const useTweetsStore = create<TweetCollection>(
    (set, get) => ({
        // 初始为空：只有用户在生成面板里实际调整过的参数才会写入。
        // 没动过的参数在渲染侧回落到卡片面板（/independent）保存的本机默认值，
        // 两边才能保持一致（面板 = 默认值的唯一事实来源）。
        cardConfig: {},
        setCardConfig: (cardConfig) => {
            const oldCardConfig = get().cardConfig;
            set({
                cardConfig: {
                    ...oldCardConfig,
                    ...cardConfig
                }
            })
        },
        uiDefaults: {},
        setUIDefaults: (uiDefaults) => {
            set({
                uiDefaults: {
                    ...get().uiDefaults,
                    ...uiDefaults,
                }
            })
        },
        showCodeDialog: false,
        setShowCodeDialog: (showCodeDialog: boolean) => {
            set({
                showCodeDialog
            })
        },
        isActivated: true,
        setIsActivated: (isActivated: boolean) => {
            set({
                isActivated
            })
        },
        imageSrc: '',
        setImageSrc: (imageSrc: string) => {
            set({
                imageSrc
            })
        },
        activeTab: 'single',
        setActiveTab: (tabValue: string) => {
            set({
                activeTab: tabValue
            })
        },
        tweets: [],
        setTweets: (tweets: XConfig[]) => {
            set({
                tweets
            })
        },
        getTweets: () => {
            return get().tweets;
        },
        addTweet: (tweet) => {
            set((state) => ({
                tweets: state.tweets.concat(tweet)
            }))
        },
        removeTweet: (tweet: XConfig) => {
            const identity = getTweetIdentity(tweet);
            set((state) => ({
                tweets: state.tweets.filter((item) => getTweetIdentity(item) !== identity)
            }))
        },
        updateTweet: (tweet: XConfig) => {
            const identity = getTweetIdentity(tweet);
            set((state) => ({
                tweets: state.tweets.map((item) => getTweetIdentity(item) === identity ? tweet : item)
            }))
        },
        moveTweet: (from: number, to: number) => {
            set((state) => {
                const tweets = [...state.tweets];
                const [removed] = tweets.splice(from, 1);
                tweets.splice(to, 0, removed);
                return {
                    tweets
                }
            })
        },
        resetTweets: () => {
            set((state) => ({
                tweets: []
            }))
        },
    })
);
