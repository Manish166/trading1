import { Subject, Observable } from 'rxjs';
import { sampleTime, share, filter, map, bufferTime } from 'rxjs/operators';
import { MarketDataService, type WebSocketConfig } from './MarketDataService';
import { type TradeTick } from '@store/useMarketStore';
import { useMarketStore } from '@store/useMarketStore';

export interface SymbolTickMessage {
    symbol: string;
    tick: TradeTick;
}

// Enterprise extension to handle order book depth packets
export interface OrderBookLevel {
    price: number;
    quantity: number;
}
export interface OrderBookMessage {
    symbol: string;
    asks: OrderBookLevel[];
    bids: OrderBookLevel[];
    timestamp: number;
}

export class TradingStreamEngine {
    private service: MarketDataService;

    // Core ingestion pipelines
    private tickInbound$ = new Subject<SymbolTickMessage>();
    private orderBookInbound$ = new Subject<OrderBookMessage>();

    // Exposed Multi-cast streams (share() keeps a single reference pipeline)
    public rawTickStream$: Observable<SymbolTickMessage>;
    public throttledTickStream$: Observable<SymbolTickMessage>;
    public rawOrderBookStream$: Observable<OrderBookMessage>;
    private storeUnsubscribe: (() => void) | null = null;

    constructor(config: WebSocketConfig) {
        this.service = new MarketDataService(config);

        // 1. Initialise core streams with multi-casting
        this.rawTickStream$ = this.tickInbound$.pipe(share());
        this.rawOrderBookStream$ = this.orderBookInbound$.pipe(share());

        // 2. Build the pre-throttled view stream right at the engine level
        this.throttledTickStream$ = this.rawTickStream$.pipe(
            sampleTime(500), // Smooth 150ms window perfectly balanced for human eyes
            share()
        );

        // 3. Bridge your existing callback directly into the RxJS runtime
        this.service.onRawTick = (symbol, tick) => {
            this.tickInbound$.next({ symbol, tick });
        };

        // (Optional expansion): Bridge deep order book structures here if your ws handles them
        // this.service.onRawOrderBook = (symbol, bookData) => { ... }

        this.service.connect();

        this.storeUnsubscribe = useMarketStore.subscribe(
            (state) => state.watchedSymbols,
            (nextSymbols) => {
                console.log('[Engine] Watchlist changed, updating frames:', nextSymbols);
                this.service.updateWatchedSymbols(nextSymbols);
            },
            { fireImmediately: true } // Subscribes the default symbols right out of the gate
        );
    }

    /**
     * PIPELINE 1: For Real-Time Charts (Raw, high-frequency execution stream)
     */
    public getRawPriceStreamFor(symbol: string): Observable<TradeTick> {
        const normalized = symbol.toUpperCase();
        return this.rawTickStream$.pipe(
            filter(msg => msg.symbol === normalized),
            map(msg => msg.tick)
        );
    }

    /**
     * PIPELINE 2: For UI Ticker Cards (Throttled, smooth text updates)
     */
    public getThrottledPriceStreamFor(symbol: string): Observable<TradeTick> {
        const normalized = symbol.toUpperCase();
        return this.throttledTickStream$.pipe(
            filter(msg => msg.symbol === normalized),
            map(msg => msg.tick)
        );
    }

    /**
     * PIPELINE 3: For the Order Book Grid (Buffered micro-batches)
     * Groups high-density updates over a 50ms time window to prevent UI locks
     */
    public getBufferedOrderBookStreamFor(symbol: string, windowMs: number = 50): Observable<OrderBookMessage> {
        const normalized = symbol.toUpperCase();
        return this.rawOrderBookStream$.pipe(
            filter(msg => msg.symbol === normalized),
            // Buffer updates over time windows
            bufferTime(windowMs),
            // Discard empty emission windows when there are no transactions
            filter(buffers => buffers.length > 0),
            // Pluck only the most recent transaction slice from the batch window
            map(buffers => buffers[buffers.length - 1])
        );
    }

    /**
     * Clean up allocations and terminate socket threads
     */
    public shutdown(): void {
        this.service.disconnect();
        if (this.storeUnsubscribe) {
            this.storeUnsubscribe(); // Stop listening to store updates
        }
        this.tickInbound$.complete();
        this.orderBookInbound$.complete();
    }
}

// Export a single global instance for your app container to access
// export const streamEngine = new TradingStreamEngine({
//     streamUrl: 'wss://://binance.com'
// });
