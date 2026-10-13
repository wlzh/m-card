import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import ImageLayout from '../ImageLayout';
import * as _ from "lodash-es"
import { formatTimestamp } from '@src/app/utils/format';
import type { CardStore, XConfig } from '@src/hooks/useCardStore';

interface TwitterCardProps {
    xConfig: XConfig[],
    backgroundStyles: CardStore['backgroundStyles'],
    cardStyles: CardStore['cardStyles'],
}

const NOISE_TEXTURE = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.45"/></svg>')}")`;

export const TwitterCard: React.FC<TwitterCardProps> = ({ xConfig, backgroundStyles, cardStyles }) => {
    const card = useMemo(() => {
        const controls = cardStyles.controls;
        return (
            <div className='flex flex-col gap-y-4 relative'>
                {
                    xConfig.map((config, index) => {
                        const watermarkText = index === xConfig.length - 1
                            && cardStyles.watermark?.enabled
                            && cardStyles.watermark?.text
                            ? cardStyles.watermark.text
                            : undefined;
                        return (
                        <div className="flex flex-col h-full" key={`xConfig-${index}`}>
                            <CardHeader xConfig={config} controls={controls} />
                            <CardBody xConfig={config} cardStyles={cardStyles} />
                            {(controls.showFooter || watermarkText) && (
                                <CardFooter xConfig={config} controls={controls} watermarkText={watermarkText} />
                            )}
                        </div>
                        );
                    })
                }
            </div>
        )
    }, [backgroundStyles, xConfig, cardStyles]);

    return (
        <div
            id="card"
            //  aspect-video
            className="flex h-fit"
            style={{
                boxShadow: 'rgba(245, 208, 254, 0.3) 0px 0px 200px',
                width: cardStyles.width,
            }}
        >
            <div className="relative w-full grid place-items-center mobile-scaling pointer-events-none">

                <div className=" overflow-hidden w-full h-full relative content-shadow">
                    <div
                        id="content"
                        className="grid place-items-center content-container transition-colors h-full w-full"
                        style={{
                            padding: backgroundStyles.padding || 0,
                            fontSize: 14,
                            perspective: 1000
                        }}
                    >
                        {/* Background layers */}
                        <BackgroundLayers backgroundStyles={backgroundStyles} cardStyles={cardStyles} />

                        {/* Card container */}
                        <div
                            className="relative z-20 transition-all w-full card-holder"
                            style={{
                                transform: `scale(${cardStyles.scale}%)`,
                                // 面板 Font → Select Font 选择的字体（默认 sans-serif 不加，走系统栈）
                                ...(cardStyles?.fontFamily && cardStyles.fontFamily !== 'sans-serif'
                                    ? { fontFamily: `'${cardStyles.fontFamily}', sans-serif` }
                                    : {}),
                            }}
                        >
                            {/* Card body */}
                            <div
                                className={cn(
                                    "select-none relative transition-all",
                                    "h-full w-full backdrop-blur-[18px] backdrop-saturate-[177%] pt-[2em] pb-[1.5em] px-[2em]",
                                    'card-background-light transition-colors  inset-0 rounded-[inherit]',
                                    // absolute
                                )}

                                style={{
                                    overflow: 'visible',
                                    zIndex: -1,
                                    background: `linear-gradient(150deg, rgba(255,255,255,0.5), rgba(255,255,255,0.95) 80%)`,
                                    // 面板 Card → Border Width / Border Color
                                    borderWidth: `${cardStyles.borderWidth || 0}px`,
                                    borderStyle: cardStyles.borderWidth ? 'solid' : 'none',
                                    borderColor: cardStyles.borderColor || 'transparent',
                                    borderRadius: `${cardStyles.borderRadius}px`,
                                }}
                            >
                                {card}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};


const BackgroundLayers = ({ backgroundStyles, cardStyles }) => (
    <>
        <div
            className="absolute inset-0"
            style={{
                backgroundColor: backgroundStyles.backgroundColor,
                backgroundImage: backgroundStyles.backgroundImage?.startsWith('data:')
                    ? `url(${backgroundStyles.backgroundImage})` : backgroundStyles.backgroundImage,
                backgroundRepeat: backgroundStyles.backgroundRepeat,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: Number(backgroundStyles.backgroundOpacity),
                filter: `blur(${Number(backgroundStyles.backgroundBlur)}px)`,
            }}
        />
        {cardStyles.hasNoiseTexture && (
            <div
                className="absolute inset-0 mix-blend-overlay"
                style={{
                    backgroundImage: NOISE_TEXTURE,
                    backgroundRepeat: "repeat",
                    opacity: cardStyles.noiseTextureOpacity,
                    backgroundPosition: cardStyles.texturePosition,
                    zIndex: 10,
                    borderRadius: `${cardStyles.borderRadius}px`,
                }}
            />
        )}
    </>
);

const CardHeader: React.FC<{
    xConfig: XConfig,
    controls: CardStore['cardStyles']['controls'],
}> = ({ xConfig, controls }) => {

    return (
        <div className='flex w-full'>
            {controls.showUser ? (<div className="flex  flex-grow items-center pb-3">
                <img
                    src={xConfig?.avatar || ''}
                    className="inline object-cover rounded-full transition-all duration-150"
                    alt="Profile image"
                    style={{
                        width: "3em",
                        height: "3em",
                        marginRight: "0.75em"
                    }}
                />
                <div>
                    <div className="flex text-secondary-foreground" style={{ fontWeight: 600, lineHeight: "1.2" }}>
                        <div className="whitespace-nowrap" style={{ paddingRight: "0.375em", fontSize: 18 }}>
                            {xConfig.username}
                        </div>
                    </div>
                    <div className="whitespace-nowrap text-secondary" style={{ fontSize: "1em", fontWeight: 400, lineHeight: "1.2" }} />
                </div>
            </div>) : <div className='flex w-full pb-3'></div>}
            {
                controls.showLogo ? <CardLogo xConfig={xConfig} /> : <></>
            }
        </div>
    );
}

const CardLogo = ({ xConfig }) => {
    return (<div className='flex justify-center'>
        <svg
            id="x-logo"
            viewBox="0 0 24 24"
            aria-label="X"
            className=" h-[20px] w-[20px] right-4 top-4 opacity-30 dark:invert saturate-0 cursor-alias active:scale-90 transition-all ease-in-out"
        >
            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
    </div>
    )
}

const Watermark = ({ text }: { text: string }) => {
    return (
        <div className="card-footer-watermark flex justify-end" style={{ marginLeft: 'auto', paddingRight: '0.25em', flexShrink: 0 }}>
            <span
                className="whitespace-nowrap text-secondary-foreground select-none"
                style={{ fontSize: '0.85em', fontWeight: 500, opacity: 0.55 }}
            >
                {text}
            </span>
        </div>
    )
}

const CardBody: React.FC<{
    xConfig: XConfig,
    cardStyles: CardStore['cardStyles'],
}> = ({ xConfig, cardStyles }) => {
    // 面板 Card → Image Layout 手动指定时优先生效，否则按图片数量自动
    const layout = (cardStyles.imageLayout as 'vertical' | 'grid2' | 'grid4')
        || (xConfig.images.length >= 2 ? 'grid4' : 'vertical');

    const images = _.uniq(_.compact(
        [
            ...xConfig.images,
            xConfig?.video?.poster,
            ...(xConfig?.links?.map((link) => link.src) || []),
        ]
    ))
    const articleImageSources = new Set(
        xConfig.articleBlocks?.flatMap((block) => block.type === 'image' ? [block.src] : []) || []
    );
    const coverImages = xConfig.articleMode === 'full'
        ? xConfig.images.filter((src) => !articleImageSources.has(src))
        : [];
    const hasStructuredArticle = xConfig.articleMode === 'full' && Boolean(xConfig.articleBlocks?.length);

    return (
        <div className="flex-grow flex flex-col justify-center">
            {/* 文章标题(X Articles):粗体大号,普通推文无此行 */}
            {xConfig.title ? (
                <div
                    className="select-none pointer-events-none"
                    style={{
                        fontWeight: 700,
                        fontSize: cardStyles.fontSize * 1.3,
                        lineHeight: 1.35,
                        marginBottom: '0.6em',
                        overflowWrap: 'anywhere',
                    }}
                    dir="auto"
                >
                    {xConfig.title}
                </div>
            ) : null}
            {coverImages.length > 0 && <div className="mb-[1em]"><ImageLayout images={coverImages} layout="vertical" /></div>}
            {hasStructuredArticle ? (
                <div className="tweet-content pointer-events-none" style={{ fontSize: cardStyles.fontSize, overflowWrap: 'anywhere' }} dir="auto">
                    {xConfig.articleBlocks!.map((block, index) => {
                        if (block.type === 'image') return (
                            <img key={`${index}-${block.src}`} src={block.src} alt={block.alt || `Article image ${index + 1}`}
                                className="w-full h-auto object-contain" style={{ margin: '0.9em 0 1.1em' }} loading="eager" />
                        );
                        if (block.type === 'divider') return <div key={index} style={{ borderTop: '1px solid currentColor', opacity: 0.18, margin: '1.25em 0' }} />;
                        if (block.type === 'heading') return <div key={index} style={{ fontSize: '1.18em', lineHeight: 1.35, fontWeight: 700, margin: '1.15em 0 0.55em' }}>{block.text}</div>;
                        if (block.type === 'quote') return <div key={index} style={{ borderLeft: '3px solid currentColor', paddingLeft: '0.85em', opacity: 0.82, margin: '0.75em 0 1em', whiteSpace: 'pre-wrap' }}>{block.text}</div>;
                        if (block.type === 'list') {
                            const List = block.ordered ? 'ol' : 'ul';
                            return <List key={index} style={{ listStyle: block.ordered ? 'decimal' : 'disc', paddingLeft: '1.5em', margin: '0.55em 0 1em' }}>
                                {block.items.map((item, itemIndex) => <li key={itemIndex} style={{ marginBottom: '0.35em' }}>{item}</li>)}
                            </List>;
                        }
                        return <div key={index} style={{ lineHeight: 1.55, marginBottom: '0.85em', whiteSpace: 'pre-wrap' }}>{block.text}</div>;
                    })}
                </div>
            ) : (
                <div className={cn("tweet-content text-lg leading-normal pointer-events-none mb-[1em]")} style={{ fontSize: cardStyles.fontSize, overflowWrap: 'anywhere' }}>
                    <div className="content whitespace-pre-wrap" dir="auto">{xConfig.text}</div>
                </div>
            )}
            {xConfig.articleMode === 'preview' && <p className="text-xs mb-3">文章摘要 · 打开文章后可生成全文</p>}
            {!hasStructuredArticle && images && images.length > 0 && (
                <ImageLayout
                    images={images}
                    layout={layout}
                />
            )}
        </div>
    )
}

const CardFooter = ({ xConfig, controls, watermarkText }: {
    xConfig: XConfig,
    controls: CardStore['cardStyles']['controls'],
    watermarkText?: string,
}) => {
    const time = _.isArray(xConfig) ? _.last(xConfig).time : xConfig.time;
    const showTime = controls.showFooter && controls.showTime && Number.isFinite(time);
    const showActions = controls.showFooter && controls.showActions;
    return (
        <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.55em', paddingTop: '0.75em', lineHeight: 1.35 }}>
            {showTime && <div className="card-footer-time text-secondary-foreground" style={{ whiteSpace: 'nowrap' }}>
                <span>{formatTimestamp(time)}</span>
            </div>}
            {(showActions || watermarkText) && <div className="card-footer-bottom" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75em' }}>
                {showActions && <div className="card-footer-actions text-secondary-foreground" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35em 1em', minWidth: 0 }}>
                    {['replies', 'shares', 'likes'].map((stat) => (
                        <div key={stat} className="whitespace-nowrap">
                            <span className="font-medium" style={{ color: "var(--textPrimary)" }}>
                                {xConfig[stat] ?? 0}
                            </span>{" "}
                            {stat}
                        </div>
                    ))}
                </div>}
                {watermarkText && <Watermark text={watermarkText} />}
            </div>}
        </div>
    );
}
