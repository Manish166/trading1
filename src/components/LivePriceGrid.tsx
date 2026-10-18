import { useMarketStore } from '@store/useMarketStore';
import { PriceTickerTile } from './PriceTickerTile';

export function LivePriceGrid() {
    // Read the active watch list configuration array from your central store slice
    const watchedSymbols = useMarketStore((state) => state.watchedSymbols);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-200 tracking-wide">Multiplex Live Markets</h2>
                <span className="text-xs text-gray-400 font-mono">
                    Watching: {watchedSymbols.length} assets
                </span>
            </div>

            {watchedSymbols.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-800 rounded-xl text-gray-500">
                    No active tickers monitored. Add a symbol to open streaming.
                </div>
            ) : (
                /* The Responsive Grid Container layout structure */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {watchedSymbols.map((symbol) => (
                        <PriceTickerTile key={symbol} symbol={symbol} />
                    ))}
                </div>
            )}
        </div>
    );
}
