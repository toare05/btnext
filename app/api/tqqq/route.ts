import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { calculateEMA, calculateRSI } from '@/lib/indicators';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const shouldUpdate = searchParams.get('update') === 'true';
	const filePath = path.join(process.cwd(), 'data', 'tqqq.json');

	if (!shouldUpdate && fs.existsSync(filePath)) {
		const localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		return NextResponse.json(localData);
	}

	const start = Math.floor(new Date('2010-02-11').getTime() / 1000);
	const end = Math.floor(new Date().getTime() / 1000);
	const url = `https://query1.finance.yahoo.com/v8/finance/chart/TQQQ?period1=${start}&period2=${end}&interval=1d`;

	try {
		const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
		const raw = await res.json();
		const result = raw.chart.result[0];
		const quote = result.indicators.quote[0];
		const adjclose = result.indicators.adjclose[0].adjclose;

		const baseData = result.timestamp.map((ts: number, i: number) => {
			const adjFactor = adjclose[i] / quote.close[i];
			return {
				time: new Date(ts * 1000).toISOString().split('T')[0],
				open: quote.open[i] * adjFactor,
				high: quote.high[i] * adjFactor,
				low: quote.low[i] * adjFactor,
				close: adjclose[i],
			};
		}).filter((d: any) => d.close !== null && d.open !== null);

		const closes = baseData.map((d: any) => d.close);
		
		// [수정됨] 모든 이동평균선 계산
		const ema20 = calculateEMA(closes, 20);
		const ema60 = calculateEMA(closes, 60);
		const ema120 = calculateEMA(closes, 120);
		const ema200 = calculateEMA(closes, 200);
		const rsi = calculateRSI(closes, 14);

		const enrichedData = baseData.map((d: any, i: number) => ({
			...d,
			ema20: ema20[i],
			ema60: ema60[i],
			ema120: ema120[i],
			ema200: ema200[i],
			rsi: rsi[i]
		}));

		const responseData = {
			lastUpdated: new Date().toLocaleString('ko-KR'),
			prices: enrichedData
		};

		if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
			fs.mkdirSync(path.join(process.cwd(), 'data'));
		}
		fs.writeFileSync(filePath, JSON.stringify(responseData));

		return NextResponse.json(responseData);
	} catch (error) {
		return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 });
	}
}