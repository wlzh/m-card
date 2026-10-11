import { Button } from "@components/ui/button";
import { useCallback, useMemo, useState } from "react";
import { useTweetsStore } from "../use-tweet-collection";

const paddingMap = {
    sm: 0,
    md: 10,
    lg: 25,
    xl: 50
};

const PaddingControl = () => {
    // 用户点过的档位；null = 未点过，高亮回落到本机默认 padding 反查
    const [selectedPadding, setSelectedPadding] = useState<string | null>(null);
    const defaultPadding = useTweetsStore(state => state.uiDefaults.padding);
    const setCardConfig = useTweetsStore(state => state.setCardConfig);
    const [customPadding, setCustomPadding] = useState('');

    // 面板默认 padding 不在档位内（自定义值）时四个按钮都不高亮
    const defaultPaddingKey = defaultPadding != null
        ? Object.keys(paddingMap).find(k => paddingMap[k] === defaultPadding) ?? ''
        : '';
    const activePaddingKey = selectedPadding ?? defaultPaddingKey;

    const handleSelectPadding = useCallback((paddingKey) => {
        setSelectedPadding(paddingKey);
        setCardConfig({
            padding: paddingMap[paddingKey]
        });
        setCustomPadding('');
    }, []);

    const renderPaddingControl = useMemo(() => {
        return (
            <div className="grid grid-cols-4 gap-1">
                {Object.keys(paddingMap).map(paddingKey => (
                    <Button
                        key={paddingKey}
                        size="sm"
                        className={activePaddingKey === paddingKey ? 'bg-primary' : 'bg-[#262626]'}
                        onClick={() => handleSelectPadding(paddingKey)}
                    >
                        {paddingKey}
                    </Button>
                ))}
            </div>
        );
    }, [activePaddingKey, customPadding]);

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2">PADDING{defaultPadding != null && !defaultPaddingKey ? `（自定义 ${defaultPadding}）` : ''}</h3>
            {renderPaddingControl}
        </div>
    );
};

export default PaddingControl;
