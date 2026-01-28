"use client";

import React from 'react';
import { BacktestResult as BacktestResultType } from '@/lib/backtest';
import BacktestChart from './BacktestChart';

interface Props {
    result: BacktestResultType;
}

export default function BacktestResult({ result }: Props) {
    return (
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Metrics Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <MetricCard label="최종 수익지수" value={`${result.finalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`} color="#1e293b" />
                <MetricCard label="수익률" value={`${result.roi.toFixed(2)}%`} color={result.roi >= 0 ? "#16a34a" : "#dc2626"} />
                <MetricCard label="MDD" value={`${result.mdd.toFixed(2)}%`} color="#dc2626" />
                <MetricCard label="총 거래 횟수" value={`${result.totalTrades}회`} color="#3b82f6" />
            </div>

            {/* Performance Comparison Candlestick Chart */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ fontWeight: 700, color: '#334155' }}>자산 성과 및 매매 포인트 (지수 기준)</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#3b82f6' }}></div>전략 수익지수
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#cbd5e1' }}></div>TQQQ 가격지수 (Dimmed)
                        </div>
                    </div>
                </div>

                <BacktestChart
                    prices={result.prices}
                    dailyValues={result.dailyValues}
                    tradeHistory={result.tradeHistory}
                />
            </div>

            {/* Trade History Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontWeight: 600, color: '#334155' }}>
                    거래 내역
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <tr>
                                <th style={{ padding: '12px 24px' }}>날짜</th>
                                <th style={{ padding: '12px 24px' }}>종류</th>
                                <th style={{ padding: '12px 24px' }}>가격</th>
                                <th style={{ padding: '12px 24px' }}>거래비중(%)</th>
                                <th style={{ padding: '12px 24px' }}>주식비중(%)</th>
                                <th style={{ padding: '12px 24px' }}>현금비중(%)</th>
                                <th style={{ padding: '12px 24px' }}>내 지수(%)</th>
                                <th style={{ padding: '12px 24px' }}>단순보유(%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.tradeHistory.length > 0 ? (
                                result.tradeHistory.map((trade, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: trade.type === 'INITIAL' ? '#f0f9ff' : 'transparent' }}>
                                        <td style={{ padding: '16px 24px', color: '#475569' }}>{trade.date}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                backgroundColor: trade.type === 'BUY' ? '#fef3c7' : trade.type === 'SELL' ? '#f3e8ff' : '#dbeafe',
                                                color: trade.type === 'BUY' ? '#92400e' : trade.type === 'SELL' ? '#7e22ce' : '#1e40af'
                                            }}>
                                                {trade.type === 'INITIAL' ? 'START' : trade.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontFamily: 'monospace' }}>{trade.price?.toFixed(2) ?? '-'}</td>
                                        <td style={{ padding: '16px 24px', color: '#475569' }}>{trade.type === 'INITIAL' ? '-' : `${trade.amount?.toFixed(1) ?? '0.0'}%`}</td>
                                        <td style={{ padding: '16px 24px', color: '#1e293b', fontWeight: 600 }}>{trade.stockRatio?.toFixed(1) ?? '-'}%</td>
                                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{trade.remainingCash?.toFixed(1) ?? '-'}%</td>
                                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>{trade.totalValue?.toFixed(1) ?? '-'}%</td>
                                        <td style={{ padding: '16px 24px', color: '#94a3b8' }}>{trade.benchmarkValue?.toFixed(1) ?? '-'}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>거래 내역이 없습니다. (RSI 조건이 충족되지 않음)</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.025em', color }}>{value}</div>
        </div>
    );
}
