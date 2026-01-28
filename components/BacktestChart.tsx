"use client";

import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface Props {
    prices: any[];
    dailyValues: any[];
    tradeHistory: any[];
}

export default function BacktestChart({ prices, dailyValues, tradeHistory }: Props) {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || prices.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#334155' },
            grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                borderColor: '#e2e8f0',
                barSpacing: 10,
                fixRightEdge: true,
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
                autoScale: true,
            },
        });

        // 1. Candlestick Series (TQQQ Price)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#cbd5e1', // Dimmed Up
            downColor: '#e2e8f0', // Dimmed Down
            borderVisible: false,
            wickVisible: true,
            wickUpColor: '#cbd5e1',
            wickDownColor: '#e2e8f0',
            priceLineVisible: false,
            lastValueVisible: false,
        });

        // 2. Strategy Equity Curve (Portfolio Value)
        const strategySeries = chart.addSeries(LineSeries, {
            color: '#3b82f6', // Bright Blue (Total)
            lineWidth: 3,
            priceLineVisible: true,
            lastValueVisible: true,
            title: 'Strategy ROI (%)',
        });

        const stockSeries = chart.addSeries(LineSeries, {
            color: '#94a3b8', // Light Slate (Stock Component)
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: 'Stock (%)',
        });

        const cashSeries = chart.addSeries(LineSeries, {
            color: '#10b981', // Emerald (Cash Component)
            lineWidth: 1,
            lineStyle: 2, // Dashed
            priceLineVisible: false,
            lastValueVisible: true,
            title: 'Cash (%)',
        });

        // 3. Normalization Logic (Sync start at 100%)
        const firstPrice = prices[0];
        const firstValue = dailyValues[0];

        if (!firstPrice || !firstValue) return;

        const basePrice = firstPrice.close;
        const baseValue = firstValue.value;

        const normalizePrice = (val: number) => (val / basePrice) * 100;
        const normalizeValue = (val: number) => (val / baseValue) * 100;

        const timeField = (d: any) => d.time || d.date;
        const sortedPrices = [...prices].sort((a, b) => a.time.localeCompare(b.time));
        const sortedEquity = [...dailyValues].sort((a, b) => a.time.localeCompare(b.time));

        candleSeries.setData(sortedPrices.map(d => ({
            time: timeField(d),
            open: normalizePrice(d.open),
            high: normalizePrice(d.high),
            low: normalizePrice(d.low),
            close: normalizePrice(d.close),
        })));

        strategySeries.setData(sortedEquity.map(d => ({
            time: d.time,
            value: normalizeValue(d.value),
        })));

        stockSeries.setData(sortedEquity.map(d => ({
            time: d.time,
            value: normalizeValue(d.stock),
        })));

        cashSeries.setData(sortedEquity.map(d => ({
            time: d.time,
            value: normalizeValue(d.cash),
        })));

        // 4. Trade Markers (Normalizing Marker positions)
        const buyMarkerSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#ef4444',
            borderVisible: false,
            wickVisible: true,
            wickUpColor: '#ef4444',
            wickDownColor: '#ef4444',
            priceLineVisible: false,
            lastValueVisible: false,
        });

        const sellMarkerSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#a855f7',
            downColor: '#a855f7',
            borderVisible: false,
            wickVisible: true,
            wickUpColor: '#a855f7',
            wickDownColor: '#a855f7',
            priceLineVisible: false,
            lastValueVisible: false,
        });

        const buyData = tradeHistory
            .filter(t => t.type.includes('buy'))
            .map(t => ({
                time: t.date,
                open: normalizePrice(t.price * 0.98),
                high: normalizePrice(t.price * 0.99),
                low: normalizePrice(t.price * 0.97),
                close: normalizePrice(t.price * 0.98),
            }));

        const sellData = tradeHistory
            .filter(t => t.type.includes('sell'))
            .map(t => ({
                time: t.date,
                open: normalizePrice(t.price * 1.02),
                high: normalizePrice(t.price * 1.03),
                low: normalizePrice(t.price * 1.01),
                close: normalizePrice(t.price * 1.02),
            }));

        buyMarkerSeries.setData(buyData);
        sellMarkerSeries.setData(sellData);

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [prices, dailyValues, tradeHistory]);

    return (
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div ref={chartContainerRef} style={{ width: '100%' }} />
        </div>
    );
}
