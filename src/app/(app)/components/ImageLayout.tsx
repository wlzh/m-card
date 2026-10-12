import React from 'react';

const ImageLayout: React.FC<{
    images: string[],
    layout: 'vertical' | 'grid2' | 'grid4',
    onAllImagesLoaded?: () => void,
}> = ({ images, layout }) => {
    // Layout controls arrangement, never the number of images exported.
    const layouts = {
        vertical: 'flex flex-col space-y-2',
        grid2: 'grid grid-cols-2 gap-2',
        grid4: 'grid grid-cols-2 gap-2',
    };
    return images.length ? (
        <div className={`w-full ${layouts[layout]}`}>
            {images.map((src, index) => (
                <img key={`${index}-${src}`} src={src} alt={`Image ${index + 1}`}
                    className="w-full h-auto object-contain" loading="eager" />
            ))}
        </div>
    ) : null;
};

export default ImageLayout;
