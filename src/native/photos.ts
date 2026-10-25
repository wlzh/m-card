const CHUNK_SIZE = 256 * 1024;
const TIMEOUT_MS = 90_000;

type NativeReply = {
    type: 'ready' | 'chunk' | 'result' | 'error';
    index?: number;
    message?: string;
};

export async function importImageToPhotos(dataUrl: string): Promise<string> {
    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) throw new Error('Only PNG and JPEG cards can be saved to Photos');

    const [, format, base64] = match;
    const port = chrome.runtime.connect({ name: 'mcard-photos-import' });
    let disconnected = false;
    let pending: {
        expected: NativeReply['type'];
        index?: number;
        resolve: (reply: NativeReply) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    } | null = null;

    port.onMessage.addListener((reply: NativeReply) => {
        if (!pending) return;
        const current = pending;
        pending = null;
        clearTimeout(current.timer);
        if (reply.type === 'error') {
            current.reject(new Error(reply.message || 'Photos import failed'));
        } else if (reply.type !== current.expected || (current.index !== undefined && reply.index !== current.index)) {
            current.reject(new Error('Unexpected Photos helper response'));
        } else {
            current.resolve(reply);
        }
    });
    port.onDisconnect.addListener(() => {
        disconnected = true;
        if (pending) {
            const current = pending;
            pending = null;
            clearTimeout(current.timer);
            current.reject(new Error(chrome.runtime.lastError?.message || 'Photos helper disconnected. Install it for this extension ID and try again.'));
        }
    });

    const send = (message: object, expected: NativeReply['type'], index?: number) => new Promise<NativeReply>((resolve, reject) => {
        if (disconnected) {
            reject(new Error('Photos helper disconnected'));
            return;
        }
        const timer = setTimeout(() => {
            pending = null;
            reject(new Error('Photos import timed out'));
            port.disconnect();
        }, TIMEOUT_MS);
        pending = { expected, index, resolve, reject, timer };
        try {
            port.postMessage(message);
        } catch (error) {
            clearTimeout(timer);
            pending = null;
            reject(error);
        }
    });

    try {
        await send({ type: 'start', format }, 'ready');
        for (let offset = 0, index = 0; offset < base64.length; offset += CHUNK_SIZE, index++) {
            await send({ type: 'chunk', index, data: base64.slice(offset, offset + CHUNK_SIZE) }, 'chunk', index);
        }
        const result = await send({ type: 'end' }, 'result');
        return result.message || 'Saved to the M.Card album in Photos';
    } finally {
        if (!disconnected) port.disconnect();
    }
}
