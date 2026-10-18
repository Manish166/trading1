# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


1. The Centralised Stream Broker Pattern

• The Problem: Opening separate WebSockets for different layout components duplicates network handshakes, wastes CPU cycles, and causes fast rate-limiting bans.
• The Solution: We opened a single, permanent multiplexed WebSocket tunnel to Binance (/stream). It handles all assets simultaneously over a single network link.
• Data Sorter (Demultiplexing): The raw onmessage handler reads incoming ticks at maximum velocity, inspects the stream tag header, and directs the data exactly to its corresponding slot in your store dictionary map without any rendering delays.

2. High-Performance State Architecture (Zustand Slices)

• The Problem: Modifying an object with the delete keyword alters its template shape in memory, forcing JavaScript engines (like V8) to drop it into slow "dictionary mode" property caches.
• The Solution: We transitioned your store to a Key-Value Dictionary Map (Record<string, TradeTick>) and used modern Object Destructuring (const { [symbol]: _, ...remaining } = state) to cleanly drop assets.
• Middleware Integration: By configuring subscribeWithSelector, we added specialized reactive tracking capabilities to your store instances.

3. Isolated Component Self-Rendering

• The Problem: Re-rendering a grid container 100 times a second under intense market volatility locks up the browser main thread and lags the UI.
• The Solution: Your grid wrapper tiles use direct, isolated store pointer subscriptions. When a new trade arrives for Bitcoin, only the Bitcoin tile updates its DOM properties, while the rest of the dashboard layout remains completely calm.

4. Defensive Async Programming

• The Problem: When users log out or switch pages, pending background connection steps can cause unmounted update crashes.
• The Solution: We embedded the local isCurrentEffect closure flag as a lifecycle kill switch, protecting against race conditions and phantom background reconnection loops.
• Exponential Backoff: The connection loop safely scales its retry pacing delays (e.g., 2s, 4s, 8s) if the client device completely loses network access.
