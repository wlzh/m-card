import React from 'react';
import { useTweetsStore } from '../use-tweet-collection';
import LabelWithIcon from '../label-with-icon';

const WatermarkControl: React.FC<{ onManage: () => void }> = ({ onManage }) => {
    const cardConfig = useTweetsStore((state) => state.cardConfig);
    const uiDefaults = useTweetsStore((state) => state.uiDefaults);
    const setCardConfig = useTweetsStore((state) => state.setCardConfig);
    const presets = uiDefaults.watermarkPresets ?? [];
    const override = cardConfig.watermark;
    const selectedPreset = presets.find((preset) => preset.text === override?.text);
    const selectedValue = !override ? 'default'
        : !override.enabled ? 'none'
        : selectedPreset ? `preset:${selectedPreset.id}` : 'custom';
    const defaultLabel = !uiDefaults.watermark ? '默认水印'
        : uiDefaults.watermark.enabled && uiDefaults.watermark.text
            ? `默认水印 · ${uiDefaults.watermark.text}` : '默认水印（已关闭）';

    return (
        <div className="min-w-0">
            <LabelWithIcon label="WATERMARK" isActivated className="mb-2" />
            {/* A native select stays inside the extension shadow root, without a portal. */}
            <select
                aria-label="本次水印"
                value={selectedValue}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value === 'default') {
                        setCardConfig({ watermark: undefined });
                    } else if (value === 'none') {
                        setCardConfig({ watermark: { enabled: false, text: '' } });
                    } else {
                        const preset = presets.find((item) => `preset:${item.id}` === value);
                        if (preset) setCardConfig({ watermark: { enabled: true, text: preset.text } });
                    }
                }}
                className={`h-9 w-full min-w-0 rounded-md border bg-[#262626] px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${override ? 'border-blue-500' : 'border-white/20'}`}
                style={{ colorScheme: 'dark' }}
            >
                <option value="default">{defaultLabel}</option>
                <option value="none">本次无水印</option>
                {presets.map((preset) => (
                    <option key={preset.id} value={`preset:${preset.id}`}>本次：{preset.name} · {preset.text}</option>
                ))}
                {selectedValue === 'custom' && <option value="custom">本次自定义 · {override?.text}</option>}
            </select>
            <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                <span className="text-neutral-300">仅本次会话，不改默认</span>
                <button type="button" className="shrink-0 text-blue-300 underline underline-offset-2 focus-visible:outline focus-visible:outline-2" onClick={onManage}>管理预设</button>
            </div>
        </div>
    );
};

export default WatermarkControl;
