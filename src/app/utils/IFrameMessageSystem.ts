type MessageCallback = (value: any) => void;

interface MessageEvent {
  origin: string;
  source: MessageEventSource | null;
  data: {
    action: string;
    value: any;
  };
}

class IFrameMessageSystem {
  private subscribers: Map<string, Set<MessageCallback>>;
  private trustedOrigins = new Set<string>();
  private trustedSources = new Set<MessageEventSource>();

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
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Iframe message timeout'));
      }, timeout);

      const responseAction = action; // 使用相同的 action 名称
      const responseHandler = (response: any) => {
        clearTimeout(timeoutId);
        unsubscribe();
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      };

      const unsubscribe = this.subscribe(responseAction, responseHandler);

      const targetOrigin = new URL(iframe.src).origin;
      if (iframe.contentWindow) {
        this.trustedOrigins.add(targetOrigin);
        this.trustedSources.add(iframe.contentWindow);
      }
      iframe.contentWindow?.postMessage({
        action,
        body: data
      }, targetOrigin);
    });
  }

  private handleMessage(event: MessageEvent): void {
    if (!event.source || !this.trustedSources.has(event.source) || !this.trustedOrigins.has(event.origin)) {
      return;
    }
    const { action, value } = event.data;
    if (this.subscribers.has(action)) {
      this.subscribers.get(action)!.forEach(callback => callback(value));
    }
  }
}

export const iframeMessageSystem = new IFrameMessageSystem();
