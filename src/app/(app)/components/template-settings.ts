import type { CardStore } from '@src/hooks/useCardStore';
import type { Template } from '@src/hooks/useTemplatesStore';

type Settings = Pick<CardStore, 'colorIndex' | 'backgroundStyles' | 'cardStyles' | 'tabConfig'>;

export const isUsableTemplate = (value: unknown): value is Template => {
    if (!value || typeof value !== 'object') return false;
    const template = value as Partial<Template>;
    return Number.isFinite(template.colorIndex)
        && !!template.backgroundStyles && typeof template.backgroundStyles === 'object'
        && !!template.cardStyles && typeof template.cardStyles === 'object';
};

export const applyTemplateToSettings = (current: Settings, template: Template): Settings => ({
    colorIndex: template.colorIndex,
    backgroundStyles: {
        ...current.backgroundStyles,
        ...template.backgroundStyles,
        backgroundFilter: {
            ...current.backgroundStyles.backgroundFilter,
            ...template.backgroundStyles.backgroundFilter,
        },
    },
    cardStyles: {
        ...current.cardStyles,
        ...template.cardStyles,
        controls: { ...current.cardStyles.controls, ...template.cardStyles.controls },
        watermark: { ...current.cardStyles.watermark, ...template.cardStyles.watermark },
        watermarkPresets: current.cardStyles.watermarkPresets,
    },
    tabConfig: { ...current.tabConfig, ...template.tabConfig },
});
