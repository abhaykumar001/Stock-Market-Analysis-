import { timeFormat } from "d3-time-format";
import { format } from "d3-format";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  ChartCanvas,
  Chart,
  CandlestickSeries,
  BarSeries,
  XAxis,
  YAxis,
  MouseCoordinateX,
  MouseCoordinateY,
  CrossHairCursor,
  OHLCTooltip,
  discontinuousTimeScaleProvider,
} from "react-financial-charts";

function StockChart({ symbol }) {
  const [data, setData] = useState([]);
  const chartRef = useRef();
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const updateSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
        if (!res.data || !Array.isArray(res.data)) {
          alert("No data received or incorrect format.");
          return;
        }

        const parsed = res.data.map((row) => ({
          date: new Date(row.Date),
          open: +row.Open,
          high: +row.High,
          low: +row.Low,
          close: +row.Close,
          volume: +row.Volume,
        }));

        setData(parsed);
      } catch (err) {
        console.error("API error:", err);
        alert("Failed to load data.");
      }
    };

    fetchData();
  }, [symbol]);

  if (!data.length) return <p className="text-center mt-10">📉 Loading chart...</p>;

  const scaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d) => d.date);
  const { data: chartData, xScale, xAccessor, displayXAccessor } = scaleProvider(data);
  const start = xAccessor(chartData[chartData.length - 30]);
  const end = xAccessor(chartData[chartData.length - 1]);
  const xExtents = [start, end];

  return (
    <div ref={chartRef}>
      <ChartCanvas
        height={500}
        width={width}
        ratio={3}
        margin={{ left: 60, right: 60, top: 20, bottom: 30 }}
        seriesName="Stock"
        data={chartData}
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        xExtents={xExtents}
      >
        {/* Candlestick */}
        <Chart id={1} yExtents={(d) => [d.high, d.low]}>
          <XAxis />
          <YAxis />
          <CandlestickSeries />
          <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />
          <MouseCoordinateY displayFormat={format(".2f")} />
          <OHLCTooltip origin={[-40, 0]} />
        </Chart>


        {/* Volume */}
        <Chart id={2} yExtents={(d) => d.volume} height={100} origin={(w, h) => [0, h - 100]}>
          <YAxis ticks={3} />
          <BarSeries yAccessor={(d) => d.volume} />
        </Chart>

        <CrossHairCursor />
      </ChartCanvas>
    </div>
  );
}

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [stockList, setStockList] = useState([]);

  useEffect(() => {
    const fetchStockList = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/stocks");
        setStockList(res.data);
      } catch (err) {
        console.error("Failed to fetch stock list:", err);
        alert("Could not load stock dropdown.");
      }
    };

    fetchStockList();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">📈 Stock Dashboard (Local API)</h1>

      <div className="flex justify-center mb-6">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border px-4 py-2 rounded shadow w-64"
        >
          <option value="">Select a stock</option>
          {stockList.map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>
      </div>

      {symbol && <StockChart symbol={symbol} />}
    </div>
  );
}
