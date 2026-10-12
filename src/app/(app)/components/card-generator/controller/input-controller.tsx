import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { useCardStore, type XConfig } from "@src/hooks/useCardStore";

export const InputController = () => {
    const xConfig = useCardStore(state => state.xConfig);
    // xConfig 是连帖数组，这里编辑第一条（预览/手动调整入口）
    const first: Partial<XConfig> = xConfig?.[0] ?? {};
    const updateFirst = (patch: Partial<XConfig>) => {
        useCardStore.setState({
            xConfig: [{ ...first, ...patch } as XConfig, ...(xConfig?.slice(1) ?? [])],
        });
    };

    return (
        <div>
            <AccordionItem value={'Input'}>
                <AccordionTrigger>Input</AccordionTrigger>
                <AccordionContent className="">
                    <label className="flex flex-col gap-y-2 py-1">
                        <span className="text-[13px]">title</span>
                        <Input value={first.title ?? ''} onChange={(e) => updateFirst({ title: e.target.value })} />
                    </label>
                    <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                        <span className=" text-[13px]">username</span>
                        <div className=" px-1.5">
                            <Input maxLength={200} minLength={2} value={first.username ?? ''} onChange={(e) => {
                                updateFirst({ username: e.target.value });
                            }}></Input>
                        </div>
                    </label>
                    <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                        <span className=" text-[13px]">text</span>
                        <div className=" px-1.5">
                            <Textarea rows={10} value={first.text ?? ''} onChange={(e) => {
                                updateFirst({ text: e.target.value });
                            }}></Textarea>
                        </div>
                    </label>

                    <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                        <span className=" text-[13px]">replies</span>
                        <div className=" px-1.5">
                            <Input type="number" value={first.replies ?? 0} onChange={(e) => {
                                updateFirst({ replies: Number(e.target.value) });
                            }}></Input>
                        </div>
                    </label>
                    <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                        <span className=" text-[13px]">shares</span>
                        <div className=" px-1.5">
                            <Input type="number" value={first.shares ?? 0} onChange={(e) => {
                                updateFirst({ shares: Number(e.target.value) });
                            }}></Input>
                        </div>
                    </label>
                    <label className="flex min-h-[40px] flex-col gap-y-2  justify-start transition-opacity duration-[0.15s] ease-[ease-in-out]  py-1">
                        <span className=" text-[13px]">likes</span>
                        <div className=" px-1.5">
                            <Input type="number" value={first.likes ?? 0} onChange={(e) => {
                                updateFirst({ likes: Number(e.target.value) });
                            }}></Input>
                        </div>
                    </label>
                </AccordionContent>
            </AccordionItem>
        </div>
    )
}
