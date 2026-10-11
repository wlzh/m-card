import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";

import { Button } from "@components/ui/button";
import { exportImage } from "@src/app/utils/image";
import { useCardStore } from "@src/hooks/useCardStore";

// 与扩展生成面板（toast）对应的导出默认值：未在生成面板里选择的格式/倍率
// 会回落到这里保存的本机默认值
const exportFormats = ['png', 'jpeg', 'svg'];
const exportScales = [1, 2, 3, 4];

export const ExportTab = () => {
    const exportFormat = useCardStore((state) => state.cardStyles.exportFormat);
    const exportScale = useCardStore((state) => state.cardStyles.exportScale);
    const cardStyles = useCardStore((state) => state.cardStyles);
    const updateCardStyles = useCardStore((state) => state.updateCardStyles);
    // 导出按钮同样遵循默认倍率与默认字体(与扩展生成侧语义一致)
    const exportOpts: { scale: number; fontFamily: string | false } = {
        scale: exportScale ?? 2,
        fontFamily: cardStyles.fontFamily && cardStyles.fontFamily !== 'sans-serif' ? cardStyles.fontFamily : false,
    };

    return (
        <AccordionItem value={'export'} className=" border  border-destructive ">
            <AccordionTrigger className="">Export </AccordionTrigger>
            <AccordionContent className=" ">
                <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className=" text-[13px]">image type</span>
                    <div className="mt-4 flex space-x-2">
                        <Button className="" size="sm" onClick={() => exportImage('png', exportOpts)}>As PNG</Button>
                        <Button size="sm" onClick={() => exportImage('jpeg', exportOpts)}>As JPEG</Button>
                        <Button size="sm" onClick={() => exportImage('svg', exportOpts)}>As SVG</Button>
                    </div>
                </label>

                <label className="flex min-h-[40px] flex-col gap-y-2 justify-start transition-opacity duration-[0.15s] ease-[ease-in-out] py-1">
                    <span className="text-[13px]">Default Format（扩展生成默认格式）</span>
                    <div className="flex space-x-2 py-1">
                        {exportFormats.map((format) => (
                            <Button
                                key={format}
                                size="sm"
                                variant={(exportFormat || 'png') === format ? 'default' : 'secondary'}
                                onClick={() => updateCardStyles({ exportFormat: format })}
                            >
                                {format.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </label>

                <label className="flex min-h-[40px] flex-col gap-y-2 justify-start transition-opacity duration-[0.15s] ease-[ease-in-out] py-1">
                    <span className="text-[13px]">Export Scale（导出倍率，默认 2x）</span>
                    <div className="flex space-x-2 py-1">
                        {exportScales.map((scale) => (
                            <Button
                                key={scale}
                                size="sm"
                                variant={(exportScale || 2) === scale ? 'default' : 'secondary'}
                                onClick={() => updateCardStyles({ exportScale: scale })}
                            >
                                {scale}x
                            </Button>
                        ))}
                    </div>
                </label>

            </AccordionContent>
        </AccordionItem>
    )
}
