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
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Iframe message timeout'));
      }, timeout);

      const responseAction = `${action}:${requestId}`;
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
      this.trustedOrigins.add(targetOrigin);
      iframe.contentWindow?.postMessage({
        action,
        requestId,
        body: data
      }, targetOrigin);
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
