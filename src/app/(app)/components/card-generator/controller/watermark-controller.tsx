import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Switch } from "@components/ui/switch";
import { Input } from "@components/ui/input";
import { useCardStore } from "@src/hooks/useCardStore";

export const WatermarkController = () => {
    const watermark = useCardStore((state) => state.cardStyles.watermark);
    const updateCardStyles = useCardStore((state) => state.updateCardStyles);

    return (
        <AccordionItem value={'watermark'}>
            <AccordionTrigger>Watermark</AccordionTrigger>
            <AccordionContent>
                <label className="flex min-h-[40px] flex-row items-center justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="grow-[2] text-[13px]">Show Watermark</span>
                    <div className="inline-flex">
                        <Switch
                            checked={watermark?.enabled ?? true}
                            onCheckedChange={(v) => {
                                updateCardStyles({
                                    watermark: {
                                        ...(watermark || { text: '@wlzh' }),
                                        enabled: v,
                                    },
                                });
                            }}
                        />
                    </div>
                </label>

                <label className="flex min-h-[40px] flex-col gap-y-2 justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                    <span className="text-[13px]">Watermark Text</span>
                    <Input
                        value={watermark?.text ?? ''}
                        placeholder="@wlzh"
                        onChange={(e) => {
                            updateCardStyles({
                                watermark: {
                                    ...(watermark || { enabled: true }),
                                    text: e.target.value,
                                },
                            });
                        }}
                    />
                </label>
            </AccordionContent>
        </AccordionItem>
    )
}
