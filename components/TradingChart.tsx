"use client";

import { createChart, ColorType, CandlestickSeries, LineSeries, LineStyle } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export default function TradingChart({ data }: { data: any[] }) {
	const mainContainerRef = useRef<HTMLDivElement>(null);
	const rsiContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mainContainerRef.current || !rsiContainerRef.current || data.length === 0) return;

		let isSyncing = false;

		const commonOptions = {
			layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#334155' },
			grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
			rightPriceScale: { width: 80, borderColor: '#e2e8f0' },
			timeScale: {
				borderColor: '#e2e8f0',
				barSpacing: 10,
				minBarSpacing: 0.5,
				maxBarSpacing: 30,
				rightOffset: 0,
				fixRightEdge: true,
				fixLeftEdge: true,
			},
		};

		const mainChart = createChart(mainContainerRef.current, {
			...commonOptions,
			width: mainContainerRef.current.clientWidth,
			height: 450,
			timeScale: { ...commonOptions.timeScale, visible: false },
			crosshair: { vertLine: { labelVisible: false } }
		});

		const rsiChart = createChart(rsiContainerRef.current, {
			...commonOptions,
			width: rsiContainerRef.current.clientWidth,
			height: 150,
			timeScale: { ...commonOptions.timeScale, visible: true }
		});

		const candleSeries = mainChart.addSeries(CandlestickSeries, {
			upColor: '#ef4444', downColor: '#3b82f6', borderVisible: false, wickUpColor: '#ef4444', wickDownColor: '#3b82f6'
		});

		const emaOpts = { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
		const ema20 = mainChart.addSeries(LineSeries, { ...emaOpts, color: '#bbf7d0', lineWidth: 1 }); // Green-200
		const ema60 = mainChart.addSeries(LineSeries, { ...emaOpts, color: '#4ade80', lineWidth: 2 }); // Green-400
		const ema120 = mainChart.addSeries(LineSeries, { ...emaOpts, color: '#22c55e', lineWidth: 3 }); // Green-500
		const ema200 = mainChart.addSeries(LineSeries, { ...emaOpts, color: '#15803d', lineWidth: 4 }); // Green-700

		const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 2, priceLineVisible: false }); // Green-500

		// --- RSI 75, 25 가로선 (Dark Green) ---
		rsiSeries.createPriceLine({
			price: 75,
			color: '#15803d', // Green-700
			lineWidth: 2,
			lineStyle: LineStyle.Dashed,
			axisLabelVisible: true,
			title: '75',
		});

		rsiSeries.createPriceLine({
			price: 25,
			color: '#15803d', // Green-700
			lineWidth: 2,
			lineStyle: LineStyle.Dashed,
			axisLabelVisible: true,
			title: '25',
		});

		const timeField = (d: any) => d.time || d.date;
		const sorted = [...data].sort((a, b) => new Date(timeField(a)).getTime() - new Date(timeField(b)).getTime());

		rsiSeries.setData(sorted.map(d => ({ time: timeField(d), value: d.rsi })).filter(d => d.value));

		candleSeries.setData(sorted.map(d => {
			const time = timeField(d);
			const isOversold = d.rsi !== undefined && d.rsi <= 25;
			const isOverbought = d.rsi !== undefined && d.rsi >= 75;

			let color;
			if (isOversold) color = '#fbbf24'; // Yellow
			else if (isOverbought) color = '#a855f7'; // Purple

			return {
				time,
				open: d.open,
				high: d.high,
				low: d.low,
				close: d.close,
				...(color ? {
					color,
					wickColor: color,
					borderColor: color,
				} : {})
			};
		}));
		ema20.setData(sorted.map(d => ({ time: timeField(d), value: d.ema20 })).filter(d => d.value));
		ema60.setData(sorted.map(d => ({ time: timeField(d), value: d.ema60 })).filter(d => d.value));
		ema120.setData(sorted.map(d => ({ time: timeField(d), value: d.ema120 })).filter(d => d.value));
		ema200.setData(sorted.map(d => ({ time: timeField(d), value: d.ema200 })).filter(d => d.value));


		const syncCharts = (source: any, target: any) => {
			source.timeScale().subscribeVisibleTimeRangeChange((range: any) => {
				if (isSyncing || !range) return;
				isSyncing = true;
				target.timeScale().setVisibleRange(range);
				isSyncing = false;
			});
		};
		syncCharts(mainChart, rsiChart);
		syncCharts(rsiChart, mainChart);

		mainChart.subscribeCrosshairMove(p => p.time && rsiChart.setCrosshairPosition(0, p.time as any, rsiSeries as any));
		rsiChart.subscribeCrosshairMove(p => p.time && mainChart.setCrosshairPosition(0, p.time as any, candleSeries as any));

		const handleResize = () => {
			if (mainContainerRef.current && rsiContainerRef.current) {
				mainChart.applyOptions({ width: mainContainerRef.current.clientWidth });
				rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
			}
		};
		window.addEventListener('resize', handleResize);
		return () => { window.removeEventListener('resize', handleResize); mainChart.remove(); rsiChart.remove(); };
	}, [data]);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
			<div ref={mainContainerRef} style={{ width: '100%' }} />
			<div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />
			<div ref={rsiContainerRef} style={{ width: '100%' }} />
		</div>
	);
}