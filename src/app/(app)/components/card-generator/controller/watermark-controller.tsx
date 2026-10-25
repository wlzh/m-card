import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Switch } from "@components/ui/switch";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MAX_WATERMARK_PRESETS, createWatermarkPresetId, useCardStore, type WatermarkPreset } from "@src/hooks/useCardStore";

export const WatermarkController = () => {
    const cardStyles = useCardStore((state) => state.cardStyles);
    const updateCardStyles = useCardStore((state) => state.updateCardStyles);
    const [editor, setEditor] = useState<{ id?: string; name: string; text: string } | null>(null);
    const watermark = cardStyles.watermark;
    const presets = cardStyles.watermarkPresets ?? [];
    const duplicate = !!editor && presets.some((preset) =>
        preset.id !== editor.id && preset.text === editor.text.trim(),
    );
    const full = presets.length >= MAX_WATERMARK_PRESETS;

    const startEdit = (preset: WatermarkPreset) => {
        setEditor({ id: preset.id, name: preset.name, text: preset.text });
    };

    const savePreset = () => {
        if (!editor || !editor.name.trim() || !editor.text.trim() || duplicate) return;
        // Read the latest list so a concurrent settings update cannot resurrect a deleted preset.
        const current = useCardStore.getState().cardStyles.watermarkPresets;
        if (editor.id && !current.some((preset) => preset.id === editor.id)) return;
        if (!editor.id && current.length >= MAX_WATERMARK_PRESETS) return;
        if (current.some((preset) => preset.id !== editor.id && preset.text === editor.text.trim())) return;
        const saved = { id: editor.id ?? createWatermarkPresetId(), name: editor.name.trim(), text: editor.text.trim() };
        updateCardStyles({ watermarkPresets: editor.id
            ? current.map((preset) => preset.id === editor.id ? saved : preset)
            : [...current, saved],
        });
        setEditor(null);
    };

    return (
        <AccordionItem value="watermark">
            <AccordionTrigger>Watermark</AccordionTrigger>
            <AccordionContent>
                <label className="flex min-h-[40px] items-center justify-between py-1">
                    <span className="text-[13px]">Show Watermark</span>
                    <Switch checked={watermark?.enabled ?? true} onCheckedChange={(enabled) => {
                        updateCardStyles({ watermark: { ...(watermark || { text: '@wlzh' }), enabled } });
                    }} />
                </label>
                <label className="flex flex-col gap-2 py-1">
                    <span className="text-[13px]">Watermark Text</span>
                    <Input value={watermark?.text ?? ''} placeholder="@wlzh" onChange={(event) => {
                        updateCardStyles({ watermark: { ...(watermark || { enabled: true }), text: event.target.value } });
                    }} />
                </label>
                <div className="flex flex-col gap-2 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px]">水印预设</span>
                        <span className="text-xs text-muted-foreground">{presets.length}/{MAX_WATERMARK_PRESETS}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">自动保存在本机。管理预设不会改变默认水印。</p>
                    {presets.length === 0 && <p className="text-xs text-muted-foreground">还没有预设，添加后可在生图面板快速切换。</p>}
                    <div className="grid gap-2">
                        {presets.map((preset) => (
                            <div key={preset.id} className="flex min-w-0 items-center gap-1">
                                <div className="min-w-0 flex-1" title={preset.text}>
                                    <div className="truncate text-sm font-medium">{preset.name}</div>
                                    <div className="truncate text-xs text-muted-foreground">{preset.text}</div>
                                </div>
                                <Button type="button" size="icon" variant="ghost" aria-label={`编辑预设 ${preset.name}`} onClick={() => startEdit(preset)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button type="button" size="icon" variant="ghost" aria-label={`删除预设 ${preset.name}`} onClick={() => {
                                    const current = useCardStore.getState().cardStyles.watermarkPresets;
                                    updateCardStyles({ watermarkPresets: current.filter((item) => item.id !== preset.id) });
                                    if (editor?.id === preset.id) setEditor(null);
                                }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                    {!editor && <Button type="button" size="sm" variant="outline" disabled={full} onClick={() => setEditor({ name: '', text: '' })}>
                        {full ? '已达上限（5 个）' : '添加水印预设'}
                    </Button>}
                    {editor && (
                        <div className="flex flex-col gap-2 rounded-md border p-2">
                            <label className="flex flex-col gap-1 text-xs">
                                预设名称
                                <Input autoFocus value={editor.name} placeholder="如：工作账号" onChange={(event) => setEditor({ ...editor, name: event.target.value })} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs">
                                水印文字
                                <Input value={editor.text} placeholder="如：@company" onChange={(event) => setEditor({ ...editor, text: event.target.value })} />
                            </label>
                            {duplicate && <p role="alert" className="text-xs text-red-600">已有相同文字的水印预设。</p>}
                            <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={savePreset} disabled={!editor.name.trim() || !editor.text.trim() || duplicate}>保存预设</Button>
                                <Button type="button" size="sm" variant="secondary" onClick={() => setEditor(null)}>取消</Button>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
