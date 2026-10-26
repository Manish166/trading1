import { useEffect } from 'react';
import { useSignal, type Signal } from "@preact/signals-react";
import { useMarketStore } from '@store/useMarketStore';

interface PriceTickerTileProps {
    symbol: string;
}

interface RenderState {
    price: number | undefined;
    trend: 'up' | 'down' | '';
    tick: number;
}

/**
 * PURE JAVASCRIPT LAYER (Completely outside React)
 * 2. FIX: Explicitly type 'uiSignal' as a strict Signal wrapper holding RenderState.
 * This completely satisfies the compiler, eliminating the "possibly undefined" error.
 */
function createTickerListener(symbol: string, uiSignal: Signal<RenderState>) {
    let previousPrice: number | null = null;

    return (tick: { price: number } | undefined) => {
        if (!tick) return;
        const currentPrice = tick.price;

        const nextTrend = previousPrice !== null && currentPrice !== previousPrice
            ? (currentPrice > previousPrice ? 'up' : 'down')
            : uiSignal.value.trend;

        const nextTick = previousPrice !== null && currentPrice !== previousPrice
            ? uiSignal.value.tick + 1
            : uiSignal.value.tick;

        // TypeScript now perfectly understands that '.value' is fully defined and safe
        uiSignal.value = {
            price: currentPrice,
            trend: nextTrend,
            tick: nextTick
        };

        previousPrice = currentPrice;
    };
}

/**
 * REACT UI DECLARATIVE LAYER
 */
export function PriceTickerTile({ symbol }: PriceTickerTileProps): React.JSX.Element {
    const ui = useSignal<RenderState>({
        price: undefined,
        trend: '',
        tick: 0
    });

    useEffect(() => {
        const handleTick = createTickerListener(symbol, ui);

        const unsubscribe = useMarketStore.subscribe(
            (state) => state.latestTicks[symbol],
            handleTick
        );

        return () => unsubscribe();
    }, [symbol]);

    const currentPrice = ui.value.price;

    return (
        <div
            data-trend={ui.value.trend}
            style={{ '--tick': ui.value.tick } as React.CSSProperties}
            className="p-5 bg-gray-900 border border-gray-800 rounded-xl shadow-lg transition-colors duration-500 
                       data-[trend=up]:animate-flash-up 
                       data-[trend=down]:animate-flash-down"
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 font-mono">{symbol}</h3>
                <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentPrice !== undefined ? 'bg-green-400 animate-pulse' : 'bg-amber-500/50'}`} />
            </div>

            <p className="text-2xl font-bold font-mono text-gray-100 tracking-tight">
                {currentPrice !== undefined ? (
                    `$${currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`
                ) : (
                    <span className="text-gray-600 tracking-widest text-lg animate-pulse">CONNECTING...</span>
                )}
            </p>
        </div>
    );
}
