import { useWebSocket } from '@hooks/useWebSocket';
import { LivePriceGrid } from '@components/LivePriceGrid';

export default function DashboardRoot(): React.JSX.Element {
  // 1. Fire up the hot, permanent multiplex data tunnel on component root mount
  const { isConnected, error } = useWebSocket();

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Crypto Terminal Pro</h1>
          <p className="text-sm text-gray-400">Real-time multiplexed asset analytical metrics.</p>
        </div>

        {/* Network Connection Health Status Banner Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-ping'}`} />
          <span className="font-mono text-gray-300">
            {isConnected ? 'TUNNEL ONLINE' : 'TUNNEL OFFLINE'}
          </span>
        </div>
      </header>

      {/* Global Error Context Warning Notifications Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-sm text-red-400 font-mono">
          ⚠️ {error}
        </div>
      )}

      <main>
        {/* 2. Render the high-efficiency isolated layout tile element matrix grid */}
        <LivePriceGrid />
      </main>
    </div>
  );
}
