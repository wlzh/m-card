import { domToPng, domToJpeg, domToSvg, type Options, createContext, destroyContext } from 'modern-screenshot'



// const waitForImages = () => {
//   const images = cardEle.querySelectorAll('img');
//   const imagePromises = Array.from(images).map(img => {
//     if (img.complete) {
//       return Promise.resolve();
//     } else {
//       return new Promise((resolve, reject) => {
//         img.onload = resolve;
//         img.onerror = reject;
//       });
//     }
//   });
//   return Promise.all(imagePromises);
// };
// await waitForImages();

export const generateImage = async (options: {
    // data?: XConfig[],
    format: string
    width?: number,
    height?: number,
    scale?: number
    fontFamily: false | string
}) => {

    const cardEle = document.querySelector('#card') as HTMLElement;
    const { format, width, height, scale = 2, fontFamily = false } = options;
    // console.log('format', format, width, height, quality);
    // 存储原始尺寸
    const originalWidth = cardEle.style.width;
    const originalHeight = cardEle.style.height;
    console.log('fontFamily', fontFamily);

    try {
        await document.fonts.ready;
        await Promise.all(Array.from(cardEle.querySelectorAll('img')).map(img => {
            if (!img.getAttribute('src')) return Promise.resolve();
            return new Promise<void>((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('图片加载超时，请稍后重试')), 15000);
                img.decode().then(resolve, () => reject(new Error('部分图片加载失败，请稍后重试')))
                    .finally(() => clearTimeout(timer));
            });
        }));
        const bounds = cardEle.getBoundingClientRect();
        if (format !== 'svg' && (bounds.height * scale > 32767 || bounds.width * scale > 32767)) {
            throw new Error('图片过长，请降低导出倍率或改用 SVG');
        }
        // 如果提供了新的尺寸，则应用它们
        let dataUrl: string;
        const exportOptions: Options = {
            quality: 0.95,
            scale: scale,
            features: {
                // Without this, render fails on certain images
                removeControlCharacter: false,
            },
            font: !fontFamily ? false : {
                preferredFormat: 'woff2',
            },
            fetchFn: async (url) => {
                try {
                    // Use Capacitor's HTTP plugin for native fetch
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error, status = ${response.status}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();

                    // Convert ArrayBuffer to base64
                    const base64Data = btoa(
                        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                    );


                    // Construct the data URL
                    const mimeType = response.headers.get('content-type') || 'image/png'; // Default to PNG if no type is specified
                    const dataUrl = `data:${mimeType};base64,${base64Data}`;

                    return dataUrl;
                } catch (error) {
                    console.error('Error fetching image:', error);
                    return false; // Fall back to normal fetch if there's an error
                }
            },
            // Avoid a runtime dependency on an unversioned third-party worker.
            workerNumber: 0,
        };

        switch (format) {
            case 'png':
                dataUrl = await domToPng(cardEle, {
                    ...exportOptions,
                });
                break;
            case 'jpeg':
                dataUrl = await domToJpeg(cardEle, exportOptions);
                break;
            case 'svg':
                dataUrl = await domToSvg(cardEle, exportOptions);
                break;
            default:
                throw new Error('Unsupported format');
        }
        return dataUrl;
    } catch (err) {
        console.error('Error exporting image:', err);
        throw err;
    } finally {
    }
}

export const exportImage = async (format: string, options?: {
    scale?: number,
    fontFamily?: string | false,
}) => {
    try {
        const dataUrl = await generateImage({
            format: format,
            scale: options?.scale ?? 2,
            fontFamily: options?.fontFamily ?? false,
        });
        const link = document.createElement('a');
        link.download = `export.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Error exporting image:', err);
    }
};
