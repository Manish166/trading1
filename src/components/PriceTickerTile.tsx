import React, { useEffect, useRef } from 'react';
import { getStreamEngine } from '../core/AppContainer';

export function PriceTickerTile({ symbol }: { symbol: string }): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const overlayARef = useRef<HTMLDivElement>(null);
    const overlayBRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const engine = getStreamEngine();
        let previousPrice: number | null = null;
        let flashLayer: 'a' | 'b' = 'a';
        const subscription = engine.getThrottledPriceStreamFor(symbol).subscribe(tick => {
            const currentPrice = tick.price;

            // 1. Text node modification (Pure write)
            if (textRef.current) {
                textRef.current.textContent = `$${currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            }

            const tile = containerRef.current;

            if (tile && previousPrice !== null && currentPrice !== previousPrice) {
                const previousLayer = flashLayer;
                flashLayer = flashLayer === 'a' ? 'b' : 'a';

                const previousOverlay =
                    previousLayer === 'a'
                        ? overlayARef.current
                        : overlayBRef.current;

                const activeOverlay =
                    flashLayer === 'a'
                        ? overlayARef.current
                        : overlayBRef.current;

                previousOverlay?.classList.remove('active');

                activeOverlay?.setAttribute(
                    'data-trend',
                    currentPrice > previousPrice ? 'up' : 'down'
                );

                activeOverlay?.classList.add('active');
            }
            previousPrice = currentPrice;
        });

        return () => subscription.unsubscribe();
    }, [symbol]);

    return (
        <div
            ref={containerRef}
            className="ticker-tile p-5 border rounded-xl shadow-lg border-gray-800"
        >
            <div ref={overlayARef} className="flash-overlay-a rounded-xl " />
            <div ref={overlayBRef} className="flash-overlay-b rounded-xl " />
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 font-mono">{symbol}</h3>
                <span className="w-2 h-2 rounded-full bg-amber-500/50" />
            </div>

            <p ref={textRef} className="text-2xl font-bold font-mono text-gray-100 tracking-tight">
                <span className="text-gray-600 tracking-widest text-lg animate-pulse">CONNECTING...</span>
            </p>
        </div>
    );
}
