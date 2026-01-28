export const calculateEMA = (data: number[], period: number) => {
	const k = 2 / (period + 1);
	const ema: number[] = [];
	data.forEach((price, i) => {
		if (i === 0) {
			ema.push(price);
		} else {
			ema.push(price * k + ema[i - 1] * (1 - k));
		}
	});
	return ema;
};

export const calculateRSI = (data: number[], period: number = 14) => {
	const rsi = new Array(data.length).fill(0);
	const gains = [];
	const losses = [];

	for (let i = 1; i < data.length; i++) {
		const diff = data[i] - data[i - 1];
		gains.push(diff > 0 ? diff : 0);
		losses.push(diff < 0 ? -diff : 0);
	}

	let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
	let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

	for (let i = period; i < data.length; i++) {
		const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
		rsi[i] = 100 - 100 / (1 + rs);

		if (i < data.length - 1) {
			avgGain = (avgGain * (period - 1) + gains[i]) / period;
			avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
		}
	}
	return rsi;
};