type MessageCallback = (value: any) => void;

interface MessageEvent {
  origin: string;
  source: MessageEventSource | null;
  data: {
    action: string;
    value: any;
    requestId?: string;
  };
}

class IFrameMessageSystem {
  private subscribers: Map<string, Set<MessageCallback>>;
  private trustedOrigins = new Set<string>();

  constructor() {
    this.subscribers = new Map();
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener('message', this.handleMessage as unknown as EventListener);
  }

  subscribe(action: string, callback: MessageCallback): () => void {
    if (!this.subscribers.has(action)) {
      this.subscribers.set(action, new Set());
    }
    this.subscribers.get(action)!.add(callback);
    return () => this.unsubscribe(action, callback);
  }

  unsubscribe(action: string, callback: MessageCallback): void {
    if (this.subscribers.has(action)) {
      this.subscribers.get(action)!.delete(callback);
    }
  }

  publish(iframe: HTMLIFrameElement, action: string, data: any, timeout: number = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const targetOrigin = new URL(iframe.src).origin;
      this.trustedOrigins.add(targetOrigin);
      let waitingForLoad = false;
      let settled = false;
      const responseAction = `${action}:${requestId}`;
      const cleanup = () => {
        clearTimeout(timeoutId);
        iframe.removeEventListener('load', send);
        unsubscribe();
      };
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };
      const timeoutId = setTimeout(() => {
        fail(new Error('Iframe message timeout'));
      }, timeout);

      const responseHandler = (response: any) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      };

      const unsubscribe = this.subscribe(responseAction, responseHandler);
      const send = () => {
        if (settled) return;
        try {
          if (new URL(iframe.src).origin !== targetOrigin) {
            throw new Error('Iframe navigated before the message was sent');
          }
          if (!iframe.contentWindow) throw new Error('Iframe is unavailable');
          iframe.contentWindow.postMessage({ action, requestId, body: data }, targetOrigin);
        } catch (error) {
          // A new iframe initially inherits x.com's origin until its own page loads.
          if (!waitingForLoad && /target origin|recipient window.s origin/i.test(String((error as Error)?.message))) {
            waitingForLoad = true;
            iframe.addEventListener('load', send, { once: true });
            return;
          }
          fail(error);
        }
      };
      send();
    });
  }

  private handleMessage(event: MessageEvent): void {
    if (!event.source || !this.trustedOrigins.has(event.origin)) {
      return;
    }
    const { action, value, requestId } = event.data;
    if (requestId) this.subscribers.get(`${action}:${requestId}`)?.forEach(callback => callback(value));
    if (this.subscribers.has(action)) {
      this.subscribers.get(action)!.forEach(callback => callback(value));
    }
  }
}

export const iframeMessageSystem = new IFrameMessageSystem();
