import { create, type StateCreator } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// 1. Define the middleware mutators that will alter the store types
type MiddlewareMutators = [
  ['zustand/devtools', never],
  ['zustand/subscribeWithSelector', never],
];

/**
 * A reusable store factory that injects devtools and subscribeWithSelector.
 * 
 * @param initializer The core store state and actions creator function.
 * @param storeName Optional name used to identify this instance inside Redux DevTools.
 */
export const createStoreFactory = <T extends object>(
  initializer: StateCreator<T, MiddlewareMutators, []>,
  storeName?: string
): ReturnType<typeof create<T, MiddlewareMutators>> => {
  return create<T>()(
    devtools(
      subscribeWithSelector(initializer),
      {
        name: storeName,
        enabled: import.meta.env.MODE !== 'production',
      }
    )
  );
};
