import { MarketContext, Strategy, StrategySignal } from "../backtest";

interface RsiStrategyParams {
    buyThreshold: number;
    buyAmount: number;
    sellThreshold: number;
    sellAmount: number;
}

export function createRsiStrategy(params: RsiStrategyParams): Strategy {
    return (context: MarketContext) => {
        const { day } = context;

        if (day.rsi !== undefined) {
            if (day.rsi <= params.buyThreshold) {
                return { signal: 'BUY', amountPercent: params.buyAmount, reason: 'rsi buy' };
            } else if (day.rsi >= params.sellThreshold) {
                return { signal: 'SELL', amountPercent: params.sellAmount, reason: 'rsi sell' };
            }
        }

        return { signal: 'HOLD', amountPercent: 0 };
    };
}
