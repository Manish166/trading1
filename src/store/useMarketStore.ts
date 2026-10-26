import { createStoreFactory } from './utils'; // Points to your custom DevTools factory wrapper

export interface TradeTick {
    id: number;        // Unique Trade ID from Binance (rawData.t)
    price: number;     // Trade Price (rawData.p)
    quantity: number;  // Trade Quantity (rawData.q)
    isSell: boolean;   // Buyer is market maker (rawData.m)
    timestamp: number; // Trade time (rawData.T)
}

interface MarketState {
    // 1. Array of tracking tokens currently active in the user session
    watchedSymbols: string[];

    // 2. The multiplex memory dictionary map (keyed by asset uppercase token, e.g. "BTCUSDT")
    latestTicks: Record<string, TradeTick | undefined>;

    // 3. High-velocity multiplex routing action 
    setRawTick: (symbol: string, tick: TradeTick) => void;

    // 4. Watchlist modification actions
    addWatchedSymbol: (symbol: string) => void;
    removeWatchedSymbol: (symbol: string) => void;
}

// Create the typed Zustand store instance using your production utility wrapper
export const useMarketStore = createStoreFactory<MarketState>((set) => ({
    // Initial starting baseline portfolio metrics
    watchedSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    latestTicks: {},

    // Route incoming trades straight to their corresponding dictionary slots
    setRawTick: (symbol, tick): void =>
        set((state) => ({
            latestTicks: {
                ...state.latestTicks,
                [symbol.toUpperCase()]: tick
            }
        })),

    // Push new symbols safely into the tracking collection array without duplicates
    addWatchedSymbol: (symbol): void =>
        set((state) => {
            const upperSymbol = symbol.toUpperCase();
            if (state.watchedSymbols.includes(upperSymbol)) return {}; // Prevent array duplicate pollution
            return {
                watchedSymbols: [...state.watchedSymbols, upperSymbol]
            };
        }),

    // Evict symbol parameters and clear the corresponding price cache data
    removeWatchedSymbol: (symbol): void =>
        set((state) => {
            const upperSymbol = symbol.toUpperCase();
            // Wipe the entry from memory to let the Garbage Collector reclaim RAM space
            // const { [upperSymbol]: _, ...remainingTicks } = state.latestTicks;
            state.latestTicks[upperSymbol] = undefined;
            return {
                watchedSymbols: state.watchedSymbols.filter((sym) => sym !== upperSymbol),
                latestTicks: state.latestTicks
            };
        }),
}));
