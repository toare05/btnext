export interface BacktestParams {
    startDate: string;
    stockRatio: number; // 0 to 100
    buyPercent: number; // % of cash to use for buy
    sellPercent: number; // % of stock to sell
}

export interface TradeLog {
    date: string;
    type: 'INITIAL' | 'BUY' | 'SELL';
    price: number;
    amount: number; // Percentage or Index point
    shares: number;
    remainingCash: number; // Cash Index
    totalValue: number; // Total Index
    stockRatio: number; // Actual current stock ratio (%)
    benchmarkValue: number; // 100% Buy & Hold Index (%)
}

export interface BacktestResult {
    finalValue: number;
    roi: number;
    mdd: number;
    totalTrades: number;
    tradeHistory: TradeLog[];
    dailyValues: {
        time: string;
        value: number;
        benchmark: number;
    }[];
    prices: any[]; // Store filtered price data for candlestick chart
}

export function runBacktest(data: any[], params: BacktestParams): BacktestResult {
    const { startDate, stockRatio, buyPercent, sellPercent } = params;
    const initialTotalValue = 100; // Fixed Base for Percentage calculation

    // 1. Filter data starting from startDate
    const filteredData = data
        .filter(d => d.time >= startDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (filteredData.length === 0) {
        return { finalValue: 0, roi: 0, mdd: 0, totalTrades: 0, tradeHistory: [], dailyValues: [], prices: [] };
    }

    // 2. Initial state
    let currentCash = initialTotalValue * ((100 - stockRatio) / 100);
    let shares = (initialTotalValue * (stockRatio / 100)) / filteredData[0].close;

    const tradeHistory: TradeLog[] = [];
    const dailyValues: { time: string; value: number; benchmark: number }[] = [];
    let peakValue = initialTotalValue;
    let maxDrawdown = 0;

    // 3. Simulation Loop
    const initialBenchmarkShares = initialTotalValue / filteredData[0].close;

    // Record Initial State
    tradeHistory.push({
        date: filteredData[0].time,
        type: 'INITIAL',
        price: filteredData[0].close,
        amount: 0,
        shares: shares,
        remainingCash: currentCash,
        totalValue: initialTotalValue,
        stockRatio: stockRatio,
        benchmarkValue: initialTotalValue
    });

    filteredData.forEach((day) => {
        const currentPrice = day.close;
        const stockValue = shares * currentPrice;
        const totalValue = stockValue + currentCash;

        // RSI Check
        if (day.rsi !== undefined) {
            if (day.rsi <= 25) {
                // Buy: buyPercent of current cash
                const buyAmount = currentCash * (buyPercent / 100);
                const buyShares = buyAmount / currentPrice;
                shares += buyShares;
                currentCash -= buyAmount;

                tradeHistory.push({
                    date: day.time,
                    type: 'BUY',
                    price: currentPrice,
                    amount: buyAmount,
                    shares: shares,
                    remainingCash: currentCash,
                    totalValue: shares * currentPrice + currentCash,
                    stockRatio: ((shares * currentPrice) / (shares * currentPrice + currentCash)) * 100,
                    benchmarkValue: initialBenchmarkShares * currentPrice
                });
            } else if (day.rsi >= 75) {
                // Sell: sellPercent of stock holdings
                const sellShares = shares * (sellPercent / 100);
                const sellAmount = sellShares * currentPrice;
                shares -= sellShares;
                currentCash += sellAmount;

                tradeHistory.push({
                    date: day.time,
                    type: 'SELL',
                    price: currentPrice,
                    amount: sellAmount,
                    shares: shares,
                    remainingCash: currentCash,
                    totalValue: shares * currentPrice + currentCash,
                    stockRatio: ((shares * currentPrice) / (shares * currentPrice + currentCash)) * 100,
                    benchmarkValue: initialBenchmarkShares * currentPrice
                });
            }
        }

        // Daily Value Tracking & MDD
        const endOfDayValue = shares * currentPrice + currentCash;
        const benchmarkValue = initialBenchmarkShares * currentPrice;

        dailyValues.push({
            time: day.time,
            value: endOfDayValue,
            benchmark: benchmarkValue
        });

        if (endOfDayValue > peakValue) {
            peakValue = endOfDayValue;
        }
        const drawdown = (peakValue - endOfDayValue) / peakValue;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    const finalValue = shares * filteredData[filteredData.length - 1].close + currentCash;
    const roi = ((finalValue - initialTotalValue) / initialTotalValue) * 100;

    return {
        finalValue,
        roi,
        mdd: maxDrawdown * 100,
        totalTrades: tradeHistory.length,
        tradeHistory,
        dailyValues,
        prices: filteredData
    };
}
