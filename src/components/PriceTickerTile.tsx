import { useEffect, useRef } from 'react';
import { useMarketStore } from '@store/useMarketStore';

interface PriceTickerTileProps {
    symbol: string;
}

export function PriceTickerTile({ symbol }: PriceTickerTileProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const priceTextRef = useRef<HTMLParagraphElement | null>(null);
    const previousPriceRef = useRef<number | null>(null);
    const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                    // Clear any active animation class timers
                    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);

                    containerRef.current.classList.remove('border-green-500', 'bg-green-950/20', 'border-red-500', 'bg-red-950/20');

                    if (currentPrice > previousPrice) {
                        containerRef.current.classList.add('border-green-500', 'bg-green-950/20');
                    } else {
                        containerRef.current.classList.add('border-red-500', 'bg-red-950/20');
                    }

                    // Fade out the flash border highlight after 200ms
                    animationTimerRef.current = setTimeout(() => {
                        if (containerRef.current) {
                            containerRef.current.classList.remove('border-green-500', 'bg-green-950/20', 'border-red-500', 'bg-red-950/20');
                        }
                    }, 200);
                }

                // Cache the current price token location for the next evaluation frame
                previousPriceRef.current = currentPrice;
            }
        );

        return () => {
            unsubscribe();
            if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        };
    }, [symbol]);

    return (
        <div
            ref={containerRef}
            className="p-5 bg-gray-900 border border-gray-800 rounded-xl shadow-lg transition-all duration-300"
        >
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
