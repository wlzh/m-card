import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { ColorPicker } from "@components/ui/color-picker";
import { Slider } from "@components/ui/slider";
import { Switch } from "@components/ui/switch";
import { useCardStore } from "@src/hooks/useCardStore";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import LayoutOptions from "@src/components/extension/layout-options";

// 卡片显示元素开关，与扩展生成面板（toast）的 CONTROLS 一一对应
const controlToggles: { key: string, label: string }[] = [
    { key: 'showUser', label: '用户信息' },
    { key: 'showActions', label: '互动数据' },
    { key: 'showTime', label: '时间' },
    { key: 'showFooter', label: '脚注' },
    { key: 'showLogo', label: 'Logo' },
];
export const CardController = () => {
    const cardStyles = useCardStore((state) => state.cardStyles);
    const updateCardStyles = useCardStore((state) => state.updateCardStyles);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);


    const handleImageUpload = (event) => {
        // const file = event.target.files[0];
        // if (file) {
        //     const reader = new FileReader();
        //     reader.onload = (e) => updateBackgroundStyles({
        //         backgroundImage: e.target.result as string,
        //     })
        //     reader.readAsDataURL(file);
        // }
    };

    const handleLayoutChange = () => {

    }

    return (
        <AccordionItem value={'card'}>
            <AccordionTrigger>Card</AccordionTrigger>
            <AccordionContent className="">

                <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className=" text-[13px]">Width</span>
                    <div className=" w-full">
                        <Slider step={1}
                            value={[cardStyles.width]}
                            max={1080}
                            min={379}
                            onValueChange={(v) => {
                                updateCardStyles({
                                    width: v[0],
                                });
                            }}

                        ></Slider>
                    </div>
                </label>

                <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className=" text-[13px]"> Scale</span>
                    <div className=" w-full">
                        <Slider step={1}
                            value={[cardStyles.scale]}
                            max={150}
                            min={1}
                            onValueChange={(v) => {
                                console.log('v', v);
                                updateCardStyles({
                                    scale: v[0],
                                });
                            }}

                        ></Slider>
                    </div>
                </label>


                <label className="flex min-h-[40px] flex-row items-center justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="grow-[2] text-[13px]">Border Width</span>
                    <div className=" w-full">
                        <Slider step={1}
                            value={[cardStyles.borderWidth]}
                            max={10}
                            min={0}
                            onValueChange={(v) => {
                                updateCardStyles({
                                    borderWidth: v[0],
                                });
                            }}

                        ></Slider>
                    </div>
                </label>
                <label className="flex min-h-[40px] flex-row items-center justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="grow-[2] text-[13px]">Border Color</span>
                    <ColorPicker className=" w-[20px] h-[20px]" value={cardStyles.borderColor}
                        onChange={(v) => {
                            updateCardStyles({
                                borderColor: v,
                            });
                        }}
                    ></ColorPicker>
                </label>

                {/* Style（posts/article）单选暂无渲染差异，隐藏待后续实现后再放开 */}

                <label className="flex min-h-[40px] flex-row items-center justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="grow-[2] text-[13px]">Border Radius</span>
                    <Slider step={1}
                        value={[cardStyles.borderRadius]}
                        min={0}
                        onValueChange={(v) => {
                            updateCardStyles({
                                borderRadius: v[0],
                            });
                        }}

                    ></Slider>
                </label>

                {/* <label className="flex flex-col min-h-[40px] justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="grow-[2] text-[13px]">Resize</span>
                    <LayoutOptions onSelect={(option) => {
                        updateCardStyles({
                            width: option.dimensions.width,
                            height: option.dimensions.height,
                        })
                    }}></LayoutOptions>
                </label> */}



                {selectedFiles.length > 0 && (
                    <div className="mt-2">
                        <p className="text-sm mb-1">Selected files:</p>
                        <ul className="list-disc list-inside">
                            {selectedFiles.map((file, index) => (
                                <li key={index} className="text-sm">{file.name}</li>
                            ))}
                        </ul>
                    </div>
                )}


                <label className="flex min-h-[40px] flex-col gap-y-2 justify-start transition-opacity duration-[0.15s] ease-[ease-in-out] py-1">
                    <span className="text-[13px]">Image Layout</span>
                    <div className="w-full">
                        <RadioGroup value={cardStyles.imageLayout || 'auto'} onValueChange={(v) => {
                            updateCardStyles({
                                imageLayout: v === 'auto' ? undefined : v,
                            })
                        }}>
                            {[
                                'auto',
                                'vertical',
                                'grid2',
                                'grid4',
                            ].map((layout) => (
                                <div key={layout} className="flex items-center space-x-2">
                                    <RadioGroupItem value={layout} id={layout} />
                                    <span>{layout}</span>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </label>

                {/* 显示元素开关：与扩展生成面板的 CONTROLS 对应，作为其默认值 */}
                <div className="flex flex-col gap-y-1 py-1">
                    <span className="text-[13px]">Controls（显示元素，扩展生成默认值）</span>
                    {controlToggles.map(({ key, label }) => (
                        <label
                            key={key}
                            className="flex min-h-[32px] flex-row items-center justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]"
                        >
                            <span className="grow-[2] text-[13px]">{label}</span>
                            <div className="inline-flex">
                                <Switch
                                    checked={cardStyles.controls?.[key] ?? true}
                                    onCheckedChange={(v) => {
                                        updateCardStyles({
                                            controls: {
                                                ...cardStyles.controls,
                                                [key]: v,
                                            },
                                        });
                                    }}
                                />
                            </div>
                        </label>
                    ))}
                </div>

            </AccordionContent>
        </AccordionItem>
    )

}
