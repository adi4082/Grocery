import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Order } from "../types";
import { Sparkles, TrendingUp, Calendar, Info, BarChart2 } from "lucide-react";

interface CustomerTrendsChartProps {
  userOrders: Order[];
}

interface DataPoint {
  label: string;
  spend: number;
  count: number;
  startDate: Date;
  endDate: Date;
}

export const CustomerTrendsChart: React.FC<CustomerTrendsChartProps> = ({ userOrders }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartMode, setChartMode] = useState<"both" | "spend" | "count">("both");
  const [dataType, setDataType] = useState<"actual" | "demo">(
    userOrders.length > 2 ? "actual" : "demo"
  );
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Parse actual orders into 12 weekly bins spanning past 3 months (90 days)
  const getProcessedData = (): DataPoint[] => {
    // Current simulated date is 2026-07-01
    const endDate = new Date("2026-07-01T23:59:59");
    const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    const binCount = 12;
    const binWidthMs = (endDate.getTime() - startDate.getTime()) / binCount;

    const bins: DataPoint[] = Array.from({ length: binCount }, (_, i) => {
      const bStart = new Date(startDate.getTime() + i * binWidthMs);
      const bEnd = new Date(startDate.getTime() + (i + 1) * binWidthMs);

      // Determine label format (e.g. "Apr W1")
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthStr = monthNames[bStart.getMonth()];
      const weekNum = Math.min(4, Math.floor(bStart.getDate() / 7) + 1);
      
      return {
        label: `${monthStr} W${weekNum}`,
        spend: 0,
        count: 0,
        startDate: bStart,
        endDate: bEnd,
      };
    });

    if (dataType === "demo") {
      // Return beautiful synthetic trend data for high fidelity presentation
      const demoSpends = [380, 0, 540, 220, 1250, 480, 0, 890, 610, 1620, 310, 1180];
      const demoCounts = [1, 0, 2, 1, 3, 1, 0, 2, 1, 4, 1, 2];
      return bins.map((bin, idx) => ({
        ...bin,
        spend: demoSpends[idx],
        count: demoCounts[idx],
      }));
    }

    // Process actual customer orders
    userOrders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      if (oDate >= startDate && oDate <= endDate) {
        const binIdx = Math.min(
          binCount - 1,
          Math.floor((oDate.getTime() - startDate.getTime()) / binWidthMs)
        );
        if (binIdx >= 0 && binIdx < binCount) {
          bins[binIdx].spend += Number(o.total || 0);
          bins[binIdx].count += 1;
        }
      }
    });

    return bins;
  };

  const chartData = getProcessedData();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll("*").remove();

    // Standard margins and viewport sizes
    const margin = { top: 30, right: 45, bottom: 40, left: 45 };
    const width = 600 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 600 280`)
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Create Scales
    const xScale = d3
      .scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, width]);

    const maxSpend = d3.max(chartData, (d) => d.spend) || 100;
    const yScaleSpend = d3
      .scaleLinear()
      .domain([0, Math.ceil((maxSpend * 1.15) / 100) * 100])
      .range([height, 0]);

    const maxCount = d3.max(chartData, (d) => d.count) || 4;
    const yScaleCount = d3
      .scaleLinear()
      .domain([0, Math.max(4, Math.ceil(maxCount * 1.2))])
      .range([height, 0]);

    // 2. Add Horizontal Gridlines (linked to spending scale)
    svg
      .append("g")
      .attr("class", "grid-lines opacity-10")
      .call(
        d3
          .axisLeft(yScaleSpend)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .style("stroke", "#18181b")
      .style("stroke-width", "1px");

    // 3. Render Spending Area & Line (Vibrant Blue/Emerald depending on selection)
    if (chartMode === "both" || chartMode === "spend") {
      // Gradient for Area Fill
      const gradId = "spend-area-gradient";
      const defs = d3.select(svgRef.current).append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", gradId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop").attr("offset", "0%").attr("stop-color", "#2563eb").attr("stop-opacity", 0.25);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", "#2563eb").attr("stop-opacity", 0.0);

      // Area generator
      const areaGen = d3
        .area<DataPoint>()
        .x((d) => xScale(d.label) || 0)
        .y0(height)
        .y1((d) => yScaleSpend(d.spend))
        .curve(d3.curveMonotoneX);

      // Draw Area
      svg
        .append("path")
        .datum(chartData)
        .attr("class", "spend-area")
        .attr("d", areaGen)
        .style("fill", `url(#${gradId})`);

      // Line generator
      const lineGen = d3
        .line<DataPoint>()
        .x((d) => xScale(d.label) || 0)
        .y((d) => yScaleSpend(d.spend))
        .curve(d3.curveMonotoneX);

      // Draw Line
      svg
        .append("path")
        .datum(chartData)
        .attr("class", "spend-line")
        .attr("d", lineGen)
        .style("fill", "none")
        .style("stroke", "#2563eb")
        .style("stroke-width", "2.5px")
        .style("stroke-linecap", "round");

      // Draw Spend Points
      svg
        .selectAll(".spend-circle")
        .data(chartData)
        .enter()
        .append("circle")
        .attr("class", "spend-circle")
        .attr("cx", (d) => xScale(d.label) || 0)
        .attr("cy", (d) => yScaleSpend(d.spend))
        .attr("r", 4)
        .style("fill", "#ffffff")
        .style("stroke", "#2563eb")
        .style("stroke-width", "2px")
        .style("cursor", "pointer");
    }

    // 4. Render Frequency (Bar chart or Point indicators)
    if (chartMode === "both" || chartMode === "count") {
      const isCountOnly = chartMode === "count";
      const barWidth = isCountOnly ? 24 : 12;

      // Draw subtle orange bars representing order frequency
      svg
        .selectAll(".count-bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "count-bar")
        .attr("x", (d) => (xScale(d.label) || 0) - barWidth / 2)
        .attr("y", (d) => yScaleCount(d.count))
        .attr("width", barWidth)
        .attr("height", (d) => height - yScaleCount(d.count))
        .style("fill", isCountOnly ? "#ea580c" : "#f97316")
        .style("opacity", isCountOnly ? 0.75 : 0.35)
        .style("rx", "3px")
        .style("cursor", "pointer")
        .style("transition", "all 150ms ease");
    }

    // 5. Draw X-Axis
    const xAxis = d3.axisBottom(xScale).tickSize(4);
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "9px")
      .style("font-weight", "700")
      .style("fill", "#71717a");

    svg.select(".x-axis").select(".domain").style("stroke", "#e4e4e7").style("stroke-width", "1.5px");
    svg.select(".x-axis").selectAll("line").style("stroke", "#e4e4e7");

    // 6. Draw Left Y-Axis (Spending - ₹)
    if (chartMode === "both" || chartMode === "spend") {
      const yAxisSpend = d3.axisLeft(yScaleSpend).ticks(5).tickFormat((d) => `₹${d}`);
      svg
        .append("g")
        .attr("class", "y-axis-spend")
        .call(yAxisSpend)
        .selectAll("text")
        .style("font-size", "9px")
        .style("font-weight", "700")
        .style("fill", "#2563eb");

      svg.select(".y-axis-spend").select(".domain").style("display", "none");
      svg.select(".y-axis-spend").selectAll("line").style("display", "none");
    }

    // 7. Draw Right Y-Axis (Order Frequency - Count)
    if (chartMode === "both" || chartMode === "count") {
      const yAxisCount = d3.axisRight(yScaleCount).ticks(4).tickFormat(d3.format("d"));
      svg
        .append("g")
        .attr("class", "y-axis-count")
        .attr("transform", `translate(${width}, 0)`)
        .call(yAxisCount)
        .selectAll("text")
        .style("font-size", "9px")
        .style("font-weight", "700")
        .style("fill", "#ea580c");

      svg.select(".y-axis-count").select(".domain").style("display", "none");
      svg.select(".y-axis-count").selectAll("line").style("display", "none");
    }

    // 8. Add Hover Interaction Overlay (invisible vertical segments)
    const segmentWidth = width / (chartData.length - 1 || 1);
    
    const interactionGroup = svg.append("g").attr("class", "interaction-overlays");

    interactionGroup
      .selectAll(".hover-segment")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "hover-segment")
      .attr("x", (_, i) => {
        if (i === 0) return 0;
        return (xScale(chartData[i].label) || 0) - segmentWidth / 2;
      })
      .attr("y", 0)
      .attr("width", (_, i) => {
        if (i === 0 || i === chartData.length - 1) return segmentWidth / 2;
        return segmentWidth;
      })
      .attr("height", height)
      .style("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mouseenter", function (event, d) {
        setHoveredPoint(d);
        const x = xScale(d.label) || 0;
        const y = chartMode === "count" ? yScaleCount(d.count) : yScaleSpend(d.spend);
        setTooltipPos({ x: x + margin.left, y: y + margin.top });

        // Add a vertical guide line
        svg
          .append("line")
          .attr("class", "hover-guide-line")
          .attr("x1", x)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", height)
          .style("stroke", "#a1a1aa")
          .style("stroke-width", "1px")
          .style("stroke-dasharray", "3,3");
      })
      .on("mousemove", function (event, d) {
        const x = xScale(d.label) || 0;
        const y = chartMode === "count" ? yScaleCount(d.count) : yScaleSpend(d.spend);
        setTooltipPos({ x: x + margin.left, y: y + margin.top });
      })
      .on("mouseleave", function () {
        setHoveredPoint(null);
        setTooltipPos(null);
        svg.selectAll(".hover-guide-line").remove();
      });

  }, [chartData, chartMode, dataType]);

  // Calculations for summarized metrics in past 3 months
  const totalSpend = chartData.reduce((sum, d) => sum + d.spend, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.count, 0);
  const averageTicket = totalOrders > 0 ? Math.round(totalSpend / totalOrders) : 0;

  return (
    <div ref={containerRef} className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/50 pb-3">
        <div>
          <h4 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
            <span>Spending & Order Frequency Trends</span>
          </h4>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>April, May, June 2026 (Last 90 Days)</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart mode selection */}
          <div className="flex bg-zinc-200/60 p-1 rounded-xl text-[9px] font-black">
            <button
              onClick={() => setChartMode("both")}
              className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                chartMode === "both" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Dual Trend
            </button>
            <button
              onClick={() => setChartMode("spend")}
              className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                chartMode === "spend" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Spending Only
            </button>
            <button
              onClick={() => setChartMode("count")}
              className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                chartMode === "count" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Frequency Only
            </button>
          </div>

          {/* Dataset selection */}
          {userOrders.length <= 2 && (
            <button
              onClick={() => setDataType(dataType === "actual" ? "demo" : "actual")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[9px] font-black cursor-pointer transition ${
                dataType === "demo"
                  ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/15"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
              title="Since you have sparse purchases, toggle Demo Data to see interactive D3 trends"
            >
              <Sparkles className="w-3 h-3" />
              <span>{dataType === "demo" ? "Viewing Demo" : "View Sparse Real"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dashboard KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/50 text-center space-y-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 block">Total Spend</span>
          <span className="text-sm font-black text-blue-600">₹{totalSpend}</span>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/50 text-center space-y-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 block">Total Orders</span>
          <span className="text-sm font-black text-orange-600">{totalOrders} orders</span>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/50 text-center space-y-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 block">Avg Order Value</span>
          <span className="text-sm font-black text-zinc-800">₹{averageTicket}</span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative bg-white border border-zinc-150 rounded-2xl p-2 h-[260px] flex items-center justify-center">
        {chartData.length === 0 || (dataType === "actual" && totalSpend === 0 && totalOrders === 0) ? (
          <div className="text-center p-6 space-y-2">
            <BarChart2 className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-xs font-black text-zinc-500">No trend data available for this time range.</p>
            <p className="text-[9px] text-zinc-400 font-medium">Place orders to begin tracking spending frequency.</p>
            {userOrders.length <= 2 && (
              <button
                onClick={() => setDataType("demo")}
                className="mt-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-[9px] rounded-lg cursor-pointer transition"
              >
                Toggle Interactive Demo
              </button>
            )}
          </div>
        ) : (
          <>
            <svg ref={svgRef} className="w-full h-full" />

            {/* Custom Interactive Floating Tooltip */}
            {hoveredPoint && tooltipPos && (
              <div
                className="absolute z-20 bg-zinc-950/95 text-white p-2.5 rounded-xl border border-zinc-800 shadow-xl text-[10px] space-y-1 select-none pointer-events-none"
                style={{
                  left: `${Math.min(460, Math.max(20, tooltipPos.x - 65))}px`,
                  top: `${Math.max(10, tooltipPos.y - 85)}px`,
                  transition: "left 100ms ease-out, top 100ms ease-out",
                }}
              >
                <div className="font-black text-zinc-300 border-b border-zinc-800 pb-1 flex justify-between gap-4">
                  <span>{hoveredPoint.label}</span>
                  <span className="text-[8px] font-normal text-zinc-500">
                    {hoveredPoint.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                {(chartMode === "both" || chartMode === "spend") && (
                  <div className="flex items-center justify-between gap-6 font-bold">
                    <span className="text-zinc-400">Spending:</span>
                    <span className="text-blue-400 font-black">₹{hoveredPoint.spend}</span>
                  </div>
                )}
                {(chartMode === "both" || chartMode === "count") && (
                  <div className="flex items-center justify-between gap-6 font-bold">
                    <span className="text-zinc-400">Orders:</span>
                    <span className="text-orange-400 font-black">{hoveredPoint.count} orders</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info / Legend */}
      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold px-1">
        <div className="flex items-center gap-3">
          {(chartMode === "both" || chartMode === "spend") && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
              <span>Spend (₹)</span>
            </div>
          )}
          {(chartMode === "both" || chartMode === "count") && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded" />
              <span>Order Frequency</span>
            </div>
          )}
        </div>
        
        {dataType === "demo" && (
          <p className="text-amber-600 font-black flex items-center gap-1 animate-pulse">
            <Info className="w-3 h-3" />
            <span>Interactive Trend Projection Enabled</span>
          </p>
        )}
      </div>
    </div>
  );
};
