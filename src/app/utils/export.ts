import type {XConfig} from "@src/hooks/useCardStore";

import JSZip from 'jszip';
import {saveAs} from 'file-saver';

const articleBlocksToMarkdown = (tweet: XConfig) => tweet.articleBlocks?.map((block) => {
    if (block.type === 'image') return `![${block.alt || 'Article image'}](${block.src})`;
    if (block.type === 'heading') return `## ${block.text}`;
    if (block.type === 'quote') return block.text.split('\n').map((line) => `> ${line}`).join('\n');
    if (block.type === 'list') return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item}`).join('\n');
    if (block.type === 'divider') return '---';
    return block.text;
}).join('\n\n');


export const tweet2Markdown = (tweetData: XConfig[]) => {
    const mdArray = tweetData.map((tweet) => {
        const {
            authorUrl,
            username,
            time,
            text,
            url,
            likes,
            shares,
            replies,
            video,
            images
        } = tweet;

        const formattedDate = new Date(time * 1000).toLocaleString();

        let markdownContent = `# Tweet by ${username}\n\n`;
        markdownContent += `*Posted on ${formattedDate}*\n\n`;
        markdownContent += `${articleBlocksToMarkdown(tweet) || text}\n\n`;

        if (video && video.poster) {
            markdownContent += `![Video Thumbnail](${video.poster})\n\n`;
            markdownContent += `*This tweet contains a video*\n\n`;
        }

        if (!tweet.articleBlocks?.length && images && images.length > 0) {
            images.forEach((img, index) => {
                markdownContent += `![Image ${index + 1}](${img})\n\n`;
            });
        }

        if (tweet.quotedTweet) {
            const quote = tweet.quotedTweet;
            markdownContent += `> Quoted post by ${quote.username}${quote.handle ? ` (${quote.handle})` : ''}\n>\n`;
            if (quote.title) markdownContent += `> **${quote.title}**\n>\n`;
            markdownContent += `${quote.text.split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
            quote.images.forEach((image, index) => {
                markdownContent += `![Quoted image ${index + 1}](${image})\n\n`;
            });
        }

        //账号URL
        markdownContent += `[${username}](${authorUrl})\n\n`;

        //帖子URL
        const displayText = text.replace(/\n/g, '').length > 100
            ? `${text.replace(/\n/g, '').substring(0, 100)}...`
            : text.replace(/\n/g, '');
        markdownContent += `[${displayText}](${url})\n\n`;

        markdownContent += `--- \n\n`;
        markdownContent += `**Stats**\n\n`;
        markdownContent += `Likes: ${likes}\n`;
        markdownContent += `Shares: ${shares}\n`;
        markdownContent += `Replies: ${replies}\n\n`;

        // 创建并下载 Markdown 文件

        return markdownContent;
    });
    return mdArray.join('\n\n');
};


const safeFileName = (value: string) => value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || 'tweet';

const fetchAsset = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response;
};

export const exportAsAsset = async (tweetData: XConfig | XConfig[]) => {
    const tweets = Array.isArray(tweetData) ? tweetData : [tweetData];
    const zip = new JSZip();

    // 辅助函数：获取高清图片URL
    const getHighQualityImageUrl = (url) => {
        // 移除已有的尺寸参数
        let baseUrl = url.split('?')[0];
        // 添加 'large' 参数来获取高质量版本
        return `${baseUrl}?format=jpg&name=large`;
    };

    try {
        for (let tweetIndex = 0; tweetIndex < tweets.length; tweetIndex++) {
            const { username, images = [], video, text, articleBlocks = [], quotedTweet } = tweets[tweetIndex];
            const folder = zip.folder(`${String(tweetIndex + 1).padStart(2, '0')}-${safeFileName(username || 'tweet')}`)!;
            folder.file("tweet.json", JSON.stringify(tweets[tweetIndex], null, 2));
            folder.file("tweet.md", tweet2Markdown([tweets[tweetIndex]]));
            folder.file("tweet_text.txt", text || '');

            const assetImages = [...new Set([
                ...images,
                ...articleBlocks.flatMap((block) => block.type === 'image' ? [block.src] : []),
                ...(quotedTweet?.images || []),
            ])];
            for (let imageIndex = 0; imageIndex < assetImages.length; imageIndex++) {
                const highQualityUrl = getHighQualityImageUrl(assetImages[imageIndex]);
                let response: Response;
                try {
                    response = await fetchAsset(highQualityUrl);
                } catch {
                    response = await fetchAsset(assetImages[imageIndex]);
                }
                const blob = await response.blob();
                const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
                folder.file(`image_${imageIndex + 1}.${extension}`, blob);
            }

            if (video?.src) {
                const response = await fetchAsset(video.src);
                const blob = await response.blob();
                const isPlaylist = blob.type.includes('mpegurl') || video.src.includes('.m3u8');
                folder.file(isPlaylist ? "video.m3u8" : "video.mp4", blob);
            }
        }

        // 生成 zip 文件
        const content = await zip.generateAsync({type: "blob"});

        const firstTweet = tweets[0];
        const zipName = safeFileName(`tweet_assets_${firstTweet?.username || 'unknown'}_${firstTweet?.text?.slice(0, 24) || ''}`);
        saveAs(content, `${zipName}.zip`);
    } catch (error) {
        console.error('Export failed', error);
        throw error; // 重新抛出错误，允许调用者处理它
    }
};


export const exportAsJSON = async (data: object) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tweetInfo.json'; // 设置下载的文件名
    document.body.appendChild(a); // 必须将a元素添加到文档中才能触发点击
    a.click();
    document.body.removeChild(a); // 下载后从文档中移除a元素
    URL.revokeObjectURL(url); // 清理创建的URL对象
}
