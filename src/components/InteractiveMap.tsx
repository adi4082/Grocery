import React, { useState, useEffect, useRef } from "react";
import { 
  Navigation, MapPin, ZoomIn, ZoomOut, Play, Pause, 
  RotateCcw, Compass, CheckCircle, Flame, ShieldAlert, Layers
} from "lucide-react";

interface InteractiveMapProps {
  orderId: string;
}

interface MapTheme {
  bg: string;
  gridLine: string;
  roadBg: string;
  roadStroke: string;
  routeColor: string;
  textMuted: string;
  textBright: string;
}

const THEMES: Record<string, MapTheme> = {
  midnight: {
    bg: "bg-[#090D16]",
    gridLine: "stroke-[#141C2F]",
    roadBg: "stroke-[#18243E]",
    roadStroke: "#1A2E50",
    routeColor: "#3B82F6", // neon blue
    textMuted: "text-zinc-500",
    textBright: "text-blue-400"
  },
  emerald: {
    bg: "bg-[#0A1F16]",
    gridLine: "stroke-[#123023]",
    roadBg: "stroke-[#173F2E]",
    roadStroke: "#1D523C",
    routeColor: "#10B981", // vibrant emerald
    textMuted: "text-emerald-600/75",
    textBright: "text-emerald-400"
  },
  classic: {
    bg: "bg-zinc-100",
    gridLine: "stroke-zinc-200",
    roadBg: "stroke-white",
    roadStroke: "#E4E4E7",
    routeColor: "#EA580C", // safety orange
    textMuted: "text-zinc-400",
    textBright: "text-orange-600"
  }
};

const PATH_POINTS = [
  { x: 50, y: 240, name: "QuickNow Dispatch Dark Store" },
  { x: 120, y: 240, name: "Sector 15 Roundabout" },
  { x: 120, y: 150, name: "Main Flyover Intersection" },
  { x: 260, y: 150, name: "Sector 17 Commercial Corridor" },
  { x: 260, y: 60, name: "Residential Lane Entry" },
  { x: 350, y: 60, name: "Your Delivery Location (Doorstep)" }
];

// Precompute cumulative distances for path interpolation
const SEGMENT_LENGTHS = [70, 90, 140, 90, 90];
const TOTAL_PATH_LENGTH = 480; // Sum of lengths

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ orderId }) => {
  const [currentTheme, setCurrentTheme] = useState<"midnight" | "emerald" | "classic">("midnight");
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [lockOnRider, setLockOnRider] = useState<boolean>(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [riderBattery, setRiderBattery] = useState<number>(94);
  const [hasSOSActive, setHasSOSActive] = useState<boolean>(false);

  // Auto-decrement rider battery simulation
  useEffect(() => {
    const batInterval = setInterval(() => {
      setRiderBattery(prev => Math.max(12, prev - 1));
    }, 15000);
    return () => clearInterval(batInterval);
  }, []);

  // Path interpolation algorithm
  const getCoordinatesAtDistance = (d: number) => {
    let currentD = d;
    if (currentD <= 0) return PATH_POINTS[0];
    if (currentD >= TOTAL_PATH_LENGTH) return PATH_POINTS[PATH_POINTS.length - 1];

    for (let i = 0; i < SEGMENT_LENGTHS.length; i++) {
      const segLen = SEGMENT_LENGTHS[i];
      if (currentD <= segLen) {
        // Interpolate along this segment
        const p1 = PATH_POINTS[i];
        const p2 = PATH_POINTS[i + 1];
        const ratio = currentD / segLen;
        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio
        };
      }
      currentD -= segLen;
    }
    return PATH_POINTS[PATH_POINTS.length - 1];
  };

  // Run the simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDistanceTraveled(prev => {
        const next = prev + 3 * simSpeed;
        if (next >= TOTAL_PATH_LENGTH) {
          // Loop back after a small wait, or stay at 100%
          return 0; 
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const riderPos = getCoordinatesAtDistance(distanceTraveled);
  const progressPercent = Math.min(100, Math.round((distanceTraveled / TOTAL_PATH_LENGTH) * 100));

  // Dynamic SVG ViewBox calculation for zoom & tracking centering
  let viewBoxX = 0;
  let viewBoxY = 0;
  let viewBoxW = 400;
  let viewBoxH = 300;

  if (lockOnRider) {
    // Zoom in and center on the rider's (x, y) coordinates
    viewBoxW = 400 / zoomLevel;
    viewBoxH = 300 / zoomLevel;
    viewBoxX = Math.max(0, Math.min(400 - viewBoxW, riderPos.x - viewBoxW / 2));
    viewBoxY = Math.max(0, Math.min(300 - viewBoxH, riderPos.y - viewBoxH / 2));
  } else {
    // Map view static but responds to zoom scaling relative to center
    viewBoxW = 400 / zoomLevel;
    viewBoxH = 300 / zoomLevel;
    viewBoxX = (400 - viewBoxW) / 2;
    viewBoxY = (300 - viewBoxH) / 2;
  }

  // Get current street log based on coordinates / progress
  const getSimulatedLocationLog = () => {
    if (progressPercent <= 2) return "Captain checking items & loading thermal ice box at Dark Store Hub.";
    if (progressPercent < 25) return "Rider left Dispatch Hub. Speeding through Sector 15 Flyover.";
    if (progressPercent < 45) return "Negotiating Sector 15 Roundabout traffic. GPS locks: Strong.";
    if (progressPercent < 70) return "Entering Sector 17 High Street commercial zone. On time.";
    if (progressPercent < 90) return "Rider crossed security gate. Riding down quiet residential lanes.";
    if (progressPercent < 98) return "Arrived at building lane. Securing vehicle & carrying clean fresh grocery basket.";
    return "Rider has reached your doorstep! Handover OTP verification ready.";
  };

  const activeTheme = THEMES[currentTheme];

  // Manual positioning quick jumps
  const teleportRider = (index: number) => {
    let targetDist = 0;
    for (let i = 0; i < index; i++) {
      targetDist += SEGMENT_LENGTHS[i];
    }
    setDistanceTraveled(targetDist);
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 p-4 space-y-4 shadow-sm animate-in fade-in duration-300">
      
      {/* Map Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
          <p className="text-xs font-black text-zinc-900 uppercase tracking-wider font-mono">
            LIVE NAVIGATION FEED
          </p>
        </div>

        {/* Theme select & simulation control switches */}
        <div className="flex items-center gap-2">
          
          {/* Theme toggler buttons */}
          <div className="flex bg-zinc-50 border border-zinc-200 p-0.5 rounded-xl text-[10px] font-black">
            <button
              onClick={() => setCurrentTheme("midnight")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentTheme === "midnight" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Midnight
            </button>
            <button
              onClick={() => setCurrentTheme("emerald")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentTheme === "emerald" ? "bg-emerald-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Eco Green
            </button>
            <button
              onClick={() => setCurrentTheme("classic")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentTheme === "classic" ? "bg-white text-zinc-900 border border-zinc-200 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Atlas
            </button>
          </div>

          {/* SOS Simulation button */}
          <button
            onClick={() => {
              setHasSOSActive(!hasSOSActive);
              if (!hasSOSActive) {
                setIsSimulating(false); // Stop simulation during SOS event
              }
            }}
            className={`p-1.5 rounded-xl border transition ${
              hasSOSActive 
                ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse" 
                : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-500"
            }`}
            title="Simulate SOS Road Hazard"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Visual Canvas Box */}
      <div className={`relative ${activeTheme.bg} rounded-2xl h-64 sm:h-72 overflow-hidden border border-zinc-800 shadow-inner group transition-colors duration-300`}>
        
        {/* Render GPS Coordinate Grid Backdrop lines */}
        <svg
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
          className="w-full h-full transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)" }}
        >
          {/* Custom SVG Grid background patterns */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" className={activeTheme.gridLine} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* BACKGROUND ROAD NETWORK GEOMETRY (Fake styled streets) */}
          <g opacity="0.15">
            {/* Minor grid roads */}
            <line x1="20" y1="50" x2="380" y2="50" stroke="#94A3B8" strokeWidth="2" />
            <line x1="20" y1="120" x2="380" y2="120" stroke="#94A3B8" strokeWidth="2" />
            <line x1="20" y1="190" x2="380" y2="190" stroke="#94A3B8" strokeWidth="2" />
            <line x1="20" y1="260" x2="380" y2="260" stroke="#94A3B8" strokeWidth="2" />

            <line x1="80" y1="20" x2="80" y2="280" stroke="#94A3B8" strokeWidth="2" />
            <line x1="180" y1="20" x2="180" y2="280" stroke="#94A3B8" strokeWidth="2" />
            <line x1="280" y1="20" x2="280" y2="280" stroke="#94A3B8" strokeWidth="2" />
          </g>

          {/* MAIN MAJOR EXPRESS DELIVERY ARTERIAL ROADS */}
          <g strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path
              d="M 50 240 L 120 240 L 120 150 L 260 150 L 260 60 L 350 60"
              className={activeTheme.roadBg}
              strokeWidth="12"
              fill="none"
            />
            <path
              d="M 50 240 L 120 240 L 120 150 L 260 150 L 260 60 L 350 60"
              stroke={activeTheme.roadStroke}
              strokeWidth="10"
              fill="none"
            />
          </g>

          {/* ACTIVE DISPATCHED ROUTE DYNAMIC NEON HIGHLIGHT (Progressive line) */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* We can mask or draw up to the rider's coordinates! */}
            <path
              d={`M 50 240 
                  L ${riderPos.x >= 120 ? 120 : riderPos.x} ${riderPos.y >= 240 ? 240 : riderPos.y}
                  ${riderPos.x >= 120 ? `L 120 ${riderPos.y >= 150 ? riderPos.y : 150}` : ""}
                  ${riderPos.y <= 150 && riderPos.x >= 120 ? `L ${riderPos.x >= 260 ? 260 : riderPos.x} 150` : ""}
                  ${riderPos.x >= 260 ? `L 260 ${riderPos.y >= 60 ? riderPos.y : 60}` : ""}
                  ${riderPos.y <= 60 && riderPos.x >= 260 ? `L ${riderPos.x} 60` : ""}
              `}
              stroke={activeTheme.routeColor}
              strokeWidth="5"
              fill="none"
              className="transition-all duration-100 ease-out"
            />
          </g>

          {/* STARTING NODE: DISPATCH DARK STORE */}
          <g 
            transform="translate(50, 240)"
            className="cursor-pointer"
            onClick={() => setActiveTooltip("store")}
          >
            {/* Pulsing beacon glow ring */}
            <circle r="14" fill="#3B82F6" className="animate-[ping_2s_infinite]" opacity="0.2" />
            <circle r="8" fill="#1D4ED8" />
            <circle r="4" fill="#60A5FA" />
          </g>

          {/* END DESTINATION: CUSTOMER RESIDENCE */}
          <g 
            transform="translate(350, 60)"
            className="cursor-pointer"
            onClick={() => setActiveTooltip("home")}
          >
            <circle r="16" fill="#10B981" className="animate-[ping_2.5s_infinite]" opacity="0.15" />
            {/* Green glowing outer indicator */}
            <polygon points="0,-12 10,2 -10,2" fill="#047857" />
            <rect x="-8" y="0" width="16" height="12" rx="2" fill="#047857" />
            <rect x="-3" y="4" width="6" height="8" fill="white" />
          </g>

          {/* LIVE DRIVER PARTNER RIDER RGPS COORDINATE MARKER */}
          <g 
            transform={`translate(${riderPos.x}, ${riderPos.y})`}
            className="cursor-pointer transition-all duration-100 ease-out"
            onClick={() => setActiveTooltip("rider")}
          >
            {/* Radial radar ripple pulse */}
            <circle r="22" fill={hasSOSActive ? "#EF4444" : activeTheme.routeColor} className="animate-[ping_1.2s_infinite]" opacity="0.3" />
            <circle r="12" fill={hasSOSActive ? "#EF4444" : activeTheme.routeColor} opacity="0.25" />
            <circle r="8" fill={hasSOSActive ? "#DC2626" : "#2563EB"} />

            {/* Custom delivery vehicle SVG logo orientation */}
            <g transform="scale(0.6) translate(-10, -10)" fill="white">
              <path d="M19 10h-2.18l-1.3-3.9A1 1 0 0 0 14.58 5H10V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v7h1v4a3 3 0 0 0 6 0V11h3.18l1.34 4.02a1 1 0 0 0 .95.68H19a3 3 0 0 0 0-6zm-12 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm12 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
            </g>
          </g>
        </svg>

        {/* OVERLAYS */}

        {/* Top-left: Real-time telemetry indicators */}
        <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 text-[10px] space-y-1 w-32 font-mono text-white shadow-xl">
          <div className="flex justify-between">
            <span className="text-zinc-400">SPEED:</span>
            <span className="font-bold text-blue-400">
              {hasSOSActive ? "0 km/h" : `${24 + Math.round((distanceTraveled % 12) / 2)} km/h`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">DIST REM:</span>
            <span className="font-bold text-emerald-400">
              {Math.max(0, (TOTAL_PATH_LENGTH - distanceTraveled) * 3).toFixed(0)}m
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">GPS LCK:</span>
            <span className="font-bold text-amber-400">RTK High</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">BATTERY:</span>
            <span className={`font-bold ${riderBattery < 20 ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}>
              {riderBattery}%
            </span>
          </div>
        </div>

        {/* Top-right: Float map tools / Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 bg-zinc-950/85 backdrop-blur-sm border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="border-t border-zinc-800 my-1" />
          <button
            onClick={() => setLockOnRider(!lockOnRider)}
            className={`p-1.5 rounded-lg transition ${
              lockOnRider ? "bg-blue-600/30 text-blue-400" : "text-zinc-400 hover:text-white"
            }`}
            title="Lock map focus on Rider"
          >
            <Compass className={`w-3.5 h-3.5 ${lockOnRider ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Center alert for SOS active hazard */}
        {hasSOSActive && (
          <div className="absolute inset-x-4 top-1/3 -translate-y-1/2 bg-rose-950/90 border border-rose-800 rounded-2xl p-3 text-center space-y-1 shadow-2xl animate-bounce backdrop-blur-md z-20">
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <ShieldAlert className="w-4 h-4" /> ROAD ASSISTANCE REPORTED
            </p>
            <p className="text-[10px] text-zinc-300 leading-snug">
              Rider Captain requested backup dispatch due to waterlogging hazard. Support is rerouting a secondary vehicle.
            </p>
          </div>
        )}

        {/* Interactive Tooltips overlay */}
        {activeTooltip && (
          <div className="absolute bottom-12 inset-x-4 bg-zinc-950/95 border border-zinc-800 text-white p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xl z-20 font-sans">
            <div>
              {activeTooltip === "store" && (
                <>
                  <p className="font-extrabold text-blue-400 uppercase text-[9px] tracking-wider">Origin Station</p>
                  <p className="font-bold text-zinc-200">Sector-15 Hub Dispatch Center</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Washed, sanitized, packed under strict 3°C cold-chain standards.</p>
                </>
              )}
              {activeTooltip === "home" && (
                <>
                  <p className="font-extrabold text-emerald-400 uppercase text-[9px] tracking-wider">Your Residence</p>
                  <p className="font-bold text-zinc-200">Delivery Address Safe Drop-off</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Assigned contactless delivery instructions requested.</p>
                </>
              )}
              {activeTooltip === "rider" && (
                <>
                  <p className="font-extrabold text-blue-400 uppercase text-[9px] tracking-wider">Delivery Captain</p>
                  <p className="font-bold text-zinc-200">Ramesh Kumar (ID: DP-8854)</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Status: En-route • Vehicle: Eco EV Scooter • Thermal Bag Sealed</p>
                </>
              )}
            </div>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-[10px] font-black bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bottom Bar: Live street address name ticker */}
        <div className="absolute bottom-0 inset-x-0 bg-zinc-950/85 backdrop-blur-md border-t border-zinc-850 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-200">
          <span className="text-zinc-500 font-bold">STREET ADDRESS:</span>
          <span className="font-bold text-zinc-100 flex-1 ml-2 truncate">
            {hasSOSActive ? "SOS Hold Point: Outer Ring Overpass Bypass" : getSimulatedLocationLog()}
          </span>
        </div>
      </div>

      {/* Manual simulation sliders & triggers section for user convenience */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <h5 className="text-[11px] font-black text-zinc-800 uppercase tracking-wider">
              Simulation Controller
            </h5>
            <p className="text-[10px] text-zinc-400 font-bold">
              Adjust rider GPS tracking pace or step points to test UI responsiveness
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause/Resume button */}
            <button
              onClick={() => {
                setIsSimulating(!isSimulating);
                if (hasSOSActive) setHasSOSActive(false); // turn off SOS when play restarts
              }}
              className="p-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer flex items-center gap-1.5 text-[10px] font-black"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Pause Feed</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  <span>Resume Live</span>
                </>
              )}
            </button>

            {/* Reset simulation */}
            <button
              onClick={() => {
                setDistanceTraveled(0);
                setIsSimulating(true);
                setHasSOSActive(false);
              }}
              className="p-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              title="Reset rider back to Hub"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Step point quick jumps */}
        <div className="grid grid-cols-5 gap-1.5">
          {PATH_POINTS.slice(0, 5).map((point, idx) => {
            const isPassed = distanceTraveled >= SEGMENT_LENGTHS.slice(0, idx).reduce((a, b) => a + b, 0);
            return (
              <button
                key={idx}
                onClick={() => {
                  teleportRider(idx);
                  if (hasSOSActive) setHasSOSActive(false);
                }}
                className={`p-1.5 rounded-lg text-[9px] font-black uppercase text-center transition truncate cursor-pointer border ${
                  isPassed 
                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                    : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600"
                }`}
                title={point.name}
              >
                P{idx + 1}
              </button>
            );
          })}
          <button
            onClick={() => {
              setDistanceTraveled(TOTAL_PATH_LENGTH);
              if (hasSOSActive) setHasSOSActive(false);
            }}
            className={`p-1.5 rounded-lg text-[9px] font-black uppercase text-center transition truncate cursor-pointer border ${
              distanceTraveled >= TOTAL_PATH_LENGTH
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600"
            }`}
            title="Arrived!"
          >
            Arrived
          </button>
        </div>

        {/* Speed multiplier selection */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-[10px]">
          <span className="text-zinc-400 font-bold">RADAR TELEMETRY SPEED:</span>
          <div className="flex gap-1.5">
            {[1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded-md font-extrabold transition cursor-pointer ${
                  simSpeed === speed 
                    ? "bg-zinc-900 text-white" 
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
