import { type TradeTick } from '@store/useMarketStore';

export interface WebSocketConfig {
    streamUrl: string;
}

export class MarketDataService {
    // Private connection management properties
    private ws: WebSocket | null = null;
    private config: WebSocketConfig;
    private activeStreams = new Set<string>();

    // Reconnection properties
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private readonly initialDelay = 2000;
    private readonly maxDelay = 30000;
    private currentDelay = 2000;

    // Simple temporary callback hook to inspect the raw data packets
    public onRawTick?: (symbol: string, tick: TradeTick) => void;

    constructor(config: WebSocketConfig) {
        this.config = config;
    }

    public connect(): void {
        if (this.ws) return;
        console.log(`🌐 Connecting to: ${this.config.streamUrl}`);
        this.ws = new WebSocket(this.config.streamUrl);

        // Bind event hooks to class methods (arrow functions preserve 'this' context)
        this.ws.onopen = () => this.handleOpen();
        this.ws.onmessage = (event) => this.handleMessage(event);
        this.ws.onerror = (error) => this.handleError(error);
        this.ws.onclose = () => this.handleClose();
    }

    private handleOpen(): void {
        console.log('⚡ WebSocket Transport Tunnel Established.');
        this.currentDelay = this.initialDelay; // Reset connection backoff delay
        this.resubscribeActiveChannels();
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const envelope = JSON.parse(event.data);
            // Filter out incoming server confirmations or warnings
            if (!envelope.data || !envelope.stream) return;

            const incomingSymbol = envelope.stream.split('@')[0].toUpperCase();
            const raw = envelope.data;

            const parsedTick: TradeTick = {
                id: raw.t,
                price: Number.parseFloat(raw.p),
                quantity: Number.parseFloat(raw.q),
                isSell: raw.m,
                timestamp: raw.T,
            };

            // Fire the testing callback if a subscriber is attached
            if (this.onRawTick) {
                this.onRawTick(incomingSymbol, parsedTick);
            }
        } catch (e) {
            console.error('Error parsing incoming network packet:', e);
        }
    }
    private handleError(error: Event): void {
        console.error('WebSocket transport layer error event detected:', error);
    }
    private handleClose(): void {
        this.ws = null;
        console.warn(`WebSocket disconnected. Retrying in ${this.currentDelay}ms...`);
        this.reconnectTimeout = setTimeout(() => {
            this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
            this.connect();
        }, this.currentDelay);
    }

    /**
   * Updates streaming subscriptions dynamically on the fly
   */
    public updateWatchedSymbols(symbols: string[]): void {
        const nextStreams = symbols.map(s => s.toLowerCase());

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Buffer them up if the connection isn't fully alive yet
            this.activeStreams = new Set(nextStreams);
            return;
        }

        const toSubscribe = nextStreams.filter(s => !this.activeStreams.has(s));
        const toUnsubscribe = Array.from(this.activeStreams).filter(s => !nextStreams.includes(s));

        if (toSubscribe.length > 0) {
            this.ws.send(JSON.stringify({
                method: 'SUBSCRIBE',
                params: toSubscribe.map(s => `${s}@aggTrade`),
                id: Date.now(),
            }));
        }

        if (toUnsubscribe.length > 0) {
            this.ws.send(JSON.stringify({
                method: 'UNSUBSCRIBE',
                params: toUnsubscribe.map(s => `${s}@aggTrade`),
                id: Date.now(),
            }));
        }

        this.activeStreams = new Set(nextStreams);

    }

    private resubscribeActiveChannels(): void {
        console.log('Resubscribing to active channels:', Array.from(this.activeStreams));
        if (this.activeStreams.size === 0 || !this.ws) return;

        // Turn combined property frame matching on
        this.ws.send(JSON.stringify({
            method: "SET_PROPERTY",
            id: 2,
            params: ["combined", true]
        }));

        const params = Array.from(this.activeStreams).map(s => `${s}@aggTrade`);
        this.ws.send(JSON.stringify({
            method: "SUBSCRIBE",
            params,
            id: 1
        }));
    }

    /**
   * Explicitly closes connections and tears down memory timeouts
   */
    public disconnect(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.ws) {
            this.ws.onclose = null; // Detach hook to prevent trigger reconnect loop loops
            this.ws.close();
            this.ws = null;
        }
        console.log('🛑 WebSocket connection terminated cleanly.');
    }
}