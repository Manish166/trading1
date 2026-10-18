import { create } from 'zustand';
import type { StateCreator, StoreApi, UseBoundStore, Mutate } from 'zustand'; // 1. Import Mutate
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// 2. Build the output type definition using Zustand's native 'Mutate' tool
type StoreWithMiddleware<T> = UseBoundStore<
  Mutate<
    StoreApi<T>,
    [
      ["zustand/subscribeWithSelector", never],
      ["zustand/devtools", never]
    ]
  >
>;

export const createStore = <T extends object>(
  initializer: StateCreator<T, [], []>
): StoreWithMiddleware<T> => {
  const isDev = import.meta.env.DEV;

  // 3. Chain middlewares using standard typings
  const finalInitializer = subscribeWithSelector(
    isDev
      ? devtools(initializer as any, { name: 'MarketStore' })
      : (initializer as any)
  );

  return create<T>()(finalInitializer as any) as StoreWithMiddleware<T>;
};
