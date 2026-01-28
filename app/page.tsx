"use client";

import { useEffect, useState } from "react";
import TradingChart from "@/components/TradingChart";

export default function BacktestPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <main
      style={{
        padding: "40px 20% 200px 40px", // 우측 20%, 하단 200px 여백
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

      {/* ================= 하단 분석 ================= */}
      <section
        style={{
          marginTop: "60px",
          padding: "30px",
          backgroundColor: "#f1f5f9",
          borderRadius: "16px",
          border: "1px dashed #cbd5e1",
        }}
      >
        <h3 style={{ marginTop: 0 }}>📊 전략 분석 리포트</h3>
        <p style={{ color: "#64748b", lineHeight: "1.6" }}>
          차트 아래에 스크롤 공간을 확보했습니다. 이곳에 향후 백테스팅
          결과(수익률, MDD, 승률 등)를 요약하는 테이블이나 Obsidian 스타일의
          노트 정리함을 배치할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
