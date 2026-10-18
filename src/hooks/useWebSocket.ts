import { useEffect, useRef, useState, useEffectEvent } from 'react';
import { useMarketStore, type TradeTick } from '@store/useMarketStore';

export function useWebSocket(): { isConnected: boolean, error: string | null } {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull the array collection and the keyed updating function
  const watchedSymbols = useMarketStore((state) => state.watchedSymbols);
  const setRawTick = useMarketStore((state) => state.setRawTick);

  // React 19 Event ensures we pass both the identifier name and the trade data safely
  const handleIncomingNetworkTick = useEffectEvent((symbol: string, tick: TradeTick) => {
    setRawTick(symbol, tick);
  });

  // 1. Initial Batch Subscriber
  const subscribeInitialStreams = useEffectEvent((socket: WebSocket) => {
    if (socket.readyState === WebSocket.OPEN && watchedSymbols.length > 0) {
      // Map out all active elements into individual channel subscription strings
      const streamParams = watchedSymbols.map(sym => `${sym.toLowerCase()}@aggTrade`);

      socket.send(JSON.stringify({
        method: "SUBSCRIBE",
        params: streamParams, // 👈 Pushes the complete array batch frame together
        id: 1
      }));
    }
  });

  useEffect(() => {
    let isCurrentEffect = true;
    const INITIAL_DELAY = 2000;
    const MAX_DELAY = 30000;
    let currentDelay = INITIAL_DELAY;

    const connect = (): void => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      // Clean Production Multi-Stream Gateway Endpoint Link
      const streamUrl = `wss://stream.binance.com:9443/stream`;
      const ws = new WebSocket(streamUrl);
      wsRef.current = ws;

      ws.onopen = (): void => {
        if (!isCurrentEffect) return;
        setIsConnected(true);
        setErrorStatus(null);
        currentDelay = INITIAL_DELAY;
        subscribeInitialStreams(ws);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const envelope = JSON.parse(event.data);
          if (envelope.code || envelope.error) {
            console.warn(`Binance Warning: Code ${envelope.code}`, envelope.msg);
            if (isCurrentEffect) setErrorStatus(`Server Warning: ${envelope.msg}`);
            return;
          }

          if (!envelope.data || !envelope.stream) return;

          // Identify the asset from the incoming envelope stream text name (e.g. "btcusdt@aggTrade")
          const incomingSymbol = envelope.stream.split('@')[0].toUpperCase();
          const raw = envelope.data;

          // Route data exactly to its dictionary key position
          handleIncomingNetworkTick(incomingSymbol, {
            id: raw.t,
            price: Number.parseFloat(raw.p),
            quantity: Number.parseFloat(raw.q),
            isSell: raw.m,
            timestamp: raw.T,
          });
        } catch (e) {
          console.error('Multi-stream pipeline parsing exception:', e);
        }
      };

      ws.onerror = (): void => {
        console.error('WebSocket transport layer error pipeline event detected.');
        if (isCurrentEffect) setErrorStatus('Network connection error.');
      };

      ws.onclose = (closeEvent: CloseEvent): void => {
        setIsConnected(false);
        if (isCurrentEffect) {
          setErrorStatus(`Disconnected. Retrying...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
            connect();
          }, currentDelay);
        }
      };
    };

    connect();

    return (): void => {
      isCurrentEffect = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Holds single connection permanent tunnel hot on mount

  // 2. The Dynamic Switch / Delta Aggregator Effect
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Enforce combined structural mode
    wsRef.current.send(JSON.stringify({
      method: "SET_PROPERTY",
      id: 2,
      params: ["combined", true]
    }));

    // Tell Binance to sync and subscribe to the entire list parameter array
    const targetStreams = watchedSymbols.map(sym => `${sym.toLowerCase()}@aggTrade`);

    wsRef.current.send(JSON.stringify({
      method: "SUBSCRIBE",
      params: targetStreams,
      id: 3
    }));
  }, [watchedSymbols]); // Fires seamlessly when items are pushed or removed from list arrays

  return { isConnected, error: errorStatus };
}
