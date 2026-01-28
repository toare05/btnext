"use client";

import { useEffect, useState } from "react";
import TradingChart from "@/components/TradingChart";
import { runBacktest, BacktestResult as BacktestResultType } from "@/lib/backtest";
import { createRsiStrategy } from "@/lib/strategies/rsiStrategy";
import { createEmaStrategy } from "@/lib/strategies/emaStrategy";
import BacktestResult from "@/components/BacktestResult";

export default function BacktestPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Backtest State
  const [startDate, setStartDate] = useState("2010-02-11");
  const [stockRatio, setStockRatio] = useState<number | string>(80);
  const [buyPercent, setBuyPercent] = useState<number | string>(20);
  const [sellPercent, setSellPercent] = useState<number | string>(5);
  const [emaBuy60, setEmaBuy60] = useState<number | string>(0);
  const [emaBuy120, setEmaBuy120] = useState<number | string>(0);
  const [emaBuy200, setEmaBuy200] = useState<number | string>(0);
  const [btResult, setBtResult] = useState<BacktestResultType | null>(null);

  const fetchData = async (forceUpdate = false) => {
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/tqqq${forceUpdate ? "?update=true" : ""}`
      );
      const result = await res.json();

      if (result.prices) {
        setPrices(result.prices);
        setLastUpdated(result.lastUpdated);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunBacktest = () => {
    if (prices.length === 0) return;

    // 1. RSI Strategy
    const rsiStrategy = createRsiStrategy({
      buyThreshold: 25,
      buyAmount: Number(buyPercent) || 0,
      sellThreshold: 75,
      sellAmount: Number(sellPercent) || 0
    });

    // 2. EMA Strategy
    const emaStrategy = createEmaStrategy({
      buy60Percent: Number(emaBuy60) || 0,
      buy120Percent: Number(emaBuy120) || 0,
      buy200Percent: Number(emaBuy200) || 0
    });

    // 3. Combined Hybrid Strategy
    const hybridStrategy = (context: any) => {
      const rsi = rsiStrategy(context);
      const ema = emaStrategy(context);

      // Priority 1: SELL signal from RSI
      if (rsi.signal === 'SELL') return rsi;

      // Priority 2: Combine BUY signals
      if (rsi.signal === 'BUY' || ema.signal === 'BUY') {
        const totalBuy = (rsi.signal === 'BUY' ? rsi.amountPercent : 0) +
          (ema.signal === 'BUY' ? ema.amountPercent : 0);

        let mergedReason = '';
        if (rsi.signal === 'BUY' && ema.signal === 'BUY') mergedReason = 'rsi+ema buy';
        else if (rsi.signal === 'BUY') mergedReason = 'rsi buy';
        else if (ema.signal === 'BUY') mergedReason = 'ema buy';

        return { signal: 'BUY', amountPercent: totalBuy, reason: mergedReason };
      }

      return { signal: 'HOLD', amountPercent: 0 };
    };

    const result = runBacktest(prices, {
      startDate,
      stockRatio: Number(stockRatio) || 0,
      strategy: hybridStrategy as any
    });
    setBtResult(result);
  };

  return (
    <main
      style={{
        padding: "40px 20% 200px 40px",
        backgroundColor: "#f8fafc",
        minHeight: "150vh",
        color: "#1e293b",
      }}
    >
      {/* ================= 상단 헤더 ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            TQQQ{" "}
            <span style={{ color: "#64748b", fontWeight: 400 }}>
              / USD Strategy
            </span>
          </h1>

          <p
            style={{
              color: "#94a3b8",
              margin: "5px 0 0 0",
              fontSize: "0.9rem",
            }}
          >
            알고리즘 기반 백테스팅 시스템
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {lastUpdated && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                LAST UPDATE
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#64748b",
                }}
              >
                {lastUpdated}
              </div>
            </div>
          )}

          <button
            onClick={() => fetchData(true)}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: isLoading ? "#cbd5e1" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)",
            }}
          >
            {isLoading ? "동기화 중..." : "데이터 업데이트"}
          </button>
        </div>
      </div>

      {/* ================= 메인 차트 ================= */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #f1f5f9",
            fontWeight: 600,
          }}
        >
          Market Overview
        </div>

        {prices.length > 0 ? (
          <TradingChart data={prices} />
        ) : (
          <div
            style={{
              height: "600px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            {isLoading
              ? "데이터를 불러오는 중입니다..."
              : "데이터가 없습니다."}
          </div>
        )}
      </section>

      {/* ================= 백테스트 설정 ================= */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-2.5 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Strategy Tester</h2>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* General Settings Group */}
          <div className="flex-1 space-y-8 min-w-[300px]">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 px-2 uppercase tracking-widest">
              <span>⚙️</span> 기본 설정
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">시작 날짜</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-slate-700 shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">초기 주식 비중 (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={stockRatio}
                    onChange={(e) => setStockRatio(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-slate-700 shadow-inner"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RSI Strategy Settings Area (Boxed) */}
          <div className="flex-1 bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100/50 space-y-8 shadow-sm">
            <h3 className="text-sm font-bold text-blue-500 flex items-center gap-2 px-1">
              <span className="p-1.5 bg-blue-100/50 rounded-xl">📉</span> RSI 지표 매매 전략
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-2">매수 비중 (RSI≤25)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={buyPercent}
                    onChange={(e) => setBuyPercent(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-blue-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400 transition-all font-bold text-blue-900 shadow-md shadow-blue-500/5"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-200 font-black text-xs">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-2">매도 비중 (RSI≥75)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sellPercent}
                    onChange={(e) => setSellPercent(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-blue-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400 transition-all font-bold text-blue-900 shadow-sm"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-200 font-black text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* EMA Strategy Settings Area (Boxed) */}
          <div className="flex-1 bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100/50 space-y-8 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2 px-1">
              <span className="p-1.5 bg-emerald-100/50 rounded-xl">📊</span> EMA 정배열 눌림목 전략
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter pl-1">EMA 60 Dip</label>
                <div className="relative">
                  <input
                    type="number"
                    value={emaBuy60}
                    onChange={(e) => setEmaBuy60(e.target.value)}
                    className="w-full px-3 py-4 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-400 transition-all font-bold text-emerald-900 text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200 font-black text-[10px]">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter pl-1">EMA 120 Dip</label>
                <div className="relative">
                  <input
                    type="number"
                    value={emaBuy120}
                    onChange={(e) => setEmaBuy120(e.target.value)}
                    className="w-full px-3 py-4 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-400 transition-all font-bold text-emerald-900 text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200 font-black text-[10px]">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter pl-1">EMA 200 Dip</label>
                <div className="relative">
                  <input
                    type="number"
                    value={emaBuy200}
                    onChange={(e) => setEmaBuy200(e.target.value)}
                    className="w-full px-3 py-4 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-400 transition-all font-bold text-emerald-900 text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200 font-black text-[10px]">%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-emerald-500/60 text-center font-bold">* 정배열 상태 하회 시 매수</p>
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          className="w-full mt-10 py-5 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-slate-900/20"
        >
          <span>🚀</span> 백테스트 실행하기
        </button>

        {btResult && <BacktestResult result={btResult} />}
      </section>

      {/* ================= 전략 설명 ================= */}
      <section
        style={{
          marginTop: "40px",
          padding: "30px",
          backgroundColor: "#f8fafc",
          borderRadius: "16px",
          border: "1px dashed #cbd5e1",
        }}
      >
        <h3 className="text-lg font-bold mb-2">💡 현재 벡테스팅 전략</h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
          <li><strong>RSI 전략:</strong> RSI 25 이하 매수 / 75 이상 매도</li>
          <li><strong>EMA 전략:</strong> 정배열 상태에서 가격이 60, 120, 200일선 하회 시 설정된 비중만큼 분할 매수</li>
          <li><strong>하이브리드:</strong> 두 조건이 겹칠 경우 매수 비중이 합산되어 적용됩니다.</li>
          <li><strong>거래 가격:</strong> 당일 종가 기준 / 수수료 없음</li>
        </ul>
      </section>
    </main>
  );
}
