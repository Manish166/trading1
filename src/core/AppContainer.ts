import { TradingStreamEngine } from '../ws/TradingStreamEngine';

export class AppContainer {
    private static instance: AppContainer | null = null;

    // Core services
    public streamEngine!: TradingStreamEngine;

    private constructor() { }

    /**
     * Initializes the core system dependencies sequentially.
     * This is triggered once at application launch.
     */
    public static initialize(config: { wsUrl: string }): AppContainer {
        if (this.instance) {
            console.warn('AppContainer already initialized. Returning existing instance.');
            return this.instance;
        }

        const container = new AppContainer();

        // 1. Spin up the trading stream engine with the supplied configuration
        container.streamEngine = new TradingStreamEngine({ streamUrl: config.wsUrl });

        this.instance = container;
        return container;
    }

    /**
     * Safely retrieves the active service instance across the system
     */
    public static get(): AppContainer {
        if (!this.instance) {
            throw new Error('AppContainer has not been initialized. Call initialize() first.');
        }
        return this.instance;
    }

    /**
     * Tears down active streams during shutdowns or user logout actions
     */
    public static teardown(): void {
        if (this.instance) {
            this.instance.streamEngine.shutdown();
            this.instance = null;
            console.log('AppContainer destroyed cleanly.');
        }
    }
}

// Reusable short-hand export macros for clean code ergonomics
export const getStreamEngine = () => AppContainer.get().streamEngine;
