"use client";

import { useEffect, useState } from "react";
import TradingChart from "@/components/TradingChart";
import { runBacktest, BacktestResult as BacktestResultType } from "@/lib/backtest";
import { createRsiStrategy } from "@/lib/strategies/rsiStrategy";
import BacktestResult from "@/components/BacktestResult";

export default function BacktestPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Backtest State
  const [startDate, setStartDate] = useState("2010-02-11");
  const [stockRatio, setStockRatio] = useState(80);
  const [buyPercent, setBuyPercent] = useState(20);
  const [sellPercent, setSellPercent] = useState(5);
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

    // Configure the modular strategy
    const rsiStrategy = createRsiStrategy({
      buyThreshold: 25,
      buyAmount: buyPercent,
      sellThreshold: 75,
      sellAmount: sellPercent
    });

    const result = runBacktest(prices, {
      startDate,
      stockRatio: stockRatio,
      strategy: rsiStrategy
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
      <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Strategy Tester</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">초기 주식 비중 (%)</label>
            <input
              type="number"
              value={stockRatio}
              onChange={(e) => setStockRatio(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">매수 비중 (RSI≤25, %)</label>
            <input
              type="number"
              value={buyPercent}
              onChange={(e) => setBuyPercent(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">매도 비중 (RSI≥75, %)</label>
            <input
              type="number"
              value={sellPercent}
              onChange={(e) => setSellPercent(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            />
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          className="mt-8 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          백테스트 실행하기
        </button>

        {btResult && <BacktestResult result={btResult} />}
      </section>


    </main>
  );
}
