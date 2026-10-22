import { useEffect, useRef } from 'react';
import { useMarketStore } from '@store/useMarketStore';

interface PriceTickerTileProps {
    symbol: string;
}

export function PriceTickerTile({ symbol }: PriceTickerTileProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const priceTextRef = useRef<HTMLParagraphElement | null>(null);
    const previousPriceRef = useRef<number | null>(null);

    useEffect(() => {
        // 1. Subscribe directly to ONLY this symbol's tick changes bypassing React engine renders
        const unsubscribe = useMarketStore.subscribe(
            (state) => state.latestTicks[symbol],
            (tick) => {
                if (!tick || !priceTextRef.current || !containerRef.current) return;
                const currentPrice = tick.price;
                const previousPrice = previousPriceRef.current;
                // Update raw text via direct DOM injection for max speed
                priceTextRef.current.textContent = `$${currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
                // 2. Handle Green/Red Flashing Animations on price movement changes
                if (previousPrice !== null && currentPrice !== previousPrice) {
                    const trend = currentPrice > previousPrice ? 'up' : 'down';
                    // // Force the browser to reset the flash state if a new tick arrives immediately
                    // containerRef.current.dataset.trend = '';
                    // void containerRef.current.offsetWidth; // Triggers reflow so the reset registers
                    containerRef.current.dataset.trend = trend;
                }
                // Cache the current price token location for the next evaluation frame
                previousPriceRef.current = currentPrice;
            }
        );

        return () => {
            unsubscribe();
        };
    }, [symbol]);

    return (
        <div
            ref={containerRef}
            data-trend=""
            // Snaps color instantly when trend activates (duration-75 overrides duration-500)
            className="p-5 bg-gray-900 border border-gray-800 rounded-xl shadow-lg transition-all duration-300 ease-out
                   data-[trend=up]:border-green-500 data-[trend=up]:bg-green-950/20 data-[trend=up]:duration-75
                   data-[trend=down]:border-red-500 data-[trend=down]:bg-red-950/20 data-[trend=down]:duration-75">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 font-mono">{symbol}</h3>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p
                ref={priceTextRef}
                className="text-2xl font-bold font-mono text-gray-100 tracking-tight"
            >
                \$0.00
            </p>
        </div>
    );
}
