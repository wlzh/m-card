import { Button } from "@components/ui/button";
import { useCallback, useMemo, useState } from "react";
import { useTweetsStore } from "../use-tweet-collection";
import { Input } from "@components/ui/input";

// 字号统一使用 px 数值，与配置面板 cardStyles.fontSize 的数值体系一致，
// 两边默认值才能互相反查（如面板默认 16 → toast 首次加载高亮 md）
export const fontSizeMap = {
    'xs': 12,
    'sm': 14,
    'md': 16,
    'lg': 18,
    'xl': 20,
    '2xl': 24,
    '3xl': 30,
};

const googleFonts = [
    { name: 'Default', value: 'sans-serif' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Noto Sans SC', value: 'Noto Sans SC' },
    { name: 'Playfair Display', value: 'Playfair Display' },
    { name: 'Merriweather', value: 'Merriweather' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro' },
    { name: 'PT Sans', value: 'PT Sans' },
    { name: 'Raleway', value: 'Raleway' },
    { name: 'Oswald', value: 'Oswald' },
    { name: 'Nunito', value: 'Nunito' },
    { name: 'Ubuntu', value: 'Ubuntu' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Quicksand', value: 'Quicksand' },
    { name: 'Rubik', value: 'Rubik' },
    { name: 'Work Sans', value: 'Work Sans' },
    { name: 'Fira Sans', value: 'Fira Sans' },
    { name: 'Noto Serif', value: 'Noto Serif' },
    // 中文字体
    { name: 'Noto Sans SC', value: 'Noto Sans SC' },
    { name: 'Noto Serif SC', value: 'Noto Serif SC' },
    { name: 'ZCOOL XiaoWei', value: 'ZCOOL XiaoWei' },
    { name: 'ZCOOL QingKe HuangYou', value: 'ZCOOL QingKe HuangYou' },
    { name: 'Ma Shan Zheng', value: 'Ma Shan Zheng' },
];

const FontControl = () => {
    // 初始高亮从本机默认值反查（如默认 16px → md），拉取完成前不高亮
    const defaultFontSize = useTweetsStore(state => state.uiDefaults.fontSize);
    const [selectedFontSize, setSelectedFontSize] = useState<string | null>(null);
    const [selectedFontFamily, setSelectedFontFamily] = useState<string | null>(null);
    const setCardConfig = useTweetsStore(state => state.setCardConfig);
    const [customFontSize, setCustomFontSize] = useState('');
    const [customFontFamily, setCustomFontFamily] = useState('');

    // 默认值拉取完成后反查档位；不在档位内（面板自定义值）保持不高亮
    const activeSizeKey = selectedFontSize
        ?? (defaultFontSize != null
            ? Object.keys(fontSizeMap).find(k => fontSizeMap[k] === defaultFontSize) ?? ''
            : '');

    const handleSelectFontSize = useCallback((sizeKey) => {
        setSelectedFontSize(sizeKey);
        setCardConfig({
            fontSize: fontSizeMap[sizeKey]
        });
        setCustomFontSize('');
    }, []);

    const handleSelectFontFamily = useCallback((familyKey) => {
        setSelectedFontFamily(familyKey);
        setCardConfig({
            fontFamily: familyKey
        });
        setCustomFontFamily('');
    }, []);

    const renderFontSizeControl = useMemo(() => {
        return (
            <div className="grid grid-cols-4 gap-1">
                {Object.keys(fontSizeMap).map(sizeKey => (
                    <Button
                        key={sizeKey}
                        size="sm"
                        className={activeSizeKey === sizeKey ? 'bg-primary' : 'bg-[#262626]'}
                        onClick={() => handleSelectFontSize(sizeKey)}
                    >
                        {sizeKey}
                    </Button>
                ))}
            </div>
        );
    }, [activeSizeKey, customFontSize]);

    // const renderFontFamilyControl = useMemo(() => {
    //     return (
    //         <div className="grid grid-cols-3 gap-1">
    //             {googleFonts.map(item => (
    //                 <Button
    //                     key={item.value}
    //                     size="sm"
    //                     className={selectedFontFamily === item.value ? 'bg-primary' : 'bg-[#262626]'}
    //                     onClick={() => handleSelectFontFamily(item.value)}
    //                 >
    //                     {item.name}
    //                 </Button>
    //             ))}
    //         </div>
    //     );
    // }, [selectedFontFamily, customFontFamily]);

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2">FONT SIZE</h3>
            {renderFontSizeControl}
            {/* <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">FONT FAMILY</h3>
                {renderFontFamilyControl}
            </div> */}
        </div>
    );
};

export default FontControl;