import { MarketContext, Strategy } from "../backtest";

interface EmaStrategyParams {
    buy60Percent: number;
    buy120Percent: number;
    buy200Percent: number;
}

export function createEmaStrategy(params: EmaStrategyParams): Strategy {
    return (context: MarketContext) => {
        const { day } = context;
        const currentPrice = day.close;
        const { ema20, ema60, ema120, ema200 } = day;

        // 1. Check Bullish Alignment (정배열: 20 > 60 > 120 > 200)
        const isBullish = ema20 && ema60 && ema120 && ema200 &&
            ema20 > ema60 && ema60 > ema120 && ema120 > ema200;

        if (isBullish) {
            let totalBuyPercent = 0;

            // 2. Pullback Check (종가가 이평선보다 낮을 때)
            if (currentPrice < ema60) totalBuyPercent += params.buy60Percent;
            if (currentPrice < ema120) totalBuyPercent += params.buy120Percent;
            if (currentPrice < ema200) totalBuyPercent += params.buy200Percent;

            if (totalBuyPercent > 0) {
                return { signal: 'BUY', amountPercent: totalBuyPercent, reason: 'ema buy' };
            }
        }

        return { signal: 'HOLD', amountPercent: 0 };
    };
}
