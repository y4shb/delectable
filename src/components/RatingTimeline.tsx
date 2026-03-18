import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import TrendIndicator from './TrendIndicator';
import type { RatingSnapshot } from '../types';

interface RatingTimelineProps {
  snapshots: RatingSnapshot[];
  trend: 'improving' | 'declining' | 'stable';
  trendScore?: number;
  /** Max Y value (default 10) */
  maxRating?: number;
}

/** Format period start string into a short month label */
function formatMonthLabel(periodStart: string): string {
  const d = new Date(periodStart);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export default function RatingTimeline({
  snapshots,
  trend,
  trendScore,
  maxRating = 10,
}: RatingTimelineProps) {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    rating: number;
    reviewCount: number;
    label: string;
  } | null>(null);

  const primaryColor = theme.palette.primary.main;
  const gridColor =
    theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.08)';
  const textColor = theme.palette.text.secondary;

  // Chart dimensions
  const padding = { top: 20, right: 16, bottom: 32, left: 36 };
  const viewBoxW = 500;
  const viewBoxH = 200;
  const chartW = viewBoxW - padding.left - padding.right;
  const chartH = viewBoxH - padding.top - padding.bottom;

  // Y-axis scale labels
  const yTicks = [0, 2, 4, 6, 8, 10].filter((v) => v <= maxRating);

  // Compute points
  const points = useMemo(() => {
    if (snapshots.length === 0) return [];
    return snapshots.map((s, i) => {
      const x =
        padding.left +
        (snapshots.length === 1
          ? chartW / 2
          : (i / (snapshots.length - 1)) * chartW);
      const y =
        padding.top + chartH - (s.avgRating / maxRating) * chartH;
      return { x, y, snapshot: s };
    });
  }, [snapshots, chartW, chartH, maxRating, padding.left, padding.top]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Build the gradient fill polygon (area under line)
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + chartH;
    let d = `M ${points[0].x},${bottomY}`;
    for (const p of points) {
      d += ` L ${p.x},${p.y}`;
    }
    d += ` L ${points[points.length - 1].x},${bottomY} Z`;
    return d;
  }, [points, padding.top, chartH]);

  const gradientId = 'ratingTimelineGradient';

  // Handle hover/tap
  const handleInteraction = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0]?.clientX ?? 0;
      } else {
        clientX = e.clientX;
      }

      const relX = ((clientX - rect.left) / rect.width) * viewBoxW;

      // Find closest point
      let closest = points[0];
      let closestDist = Infinity;
      for (const p of points) {
        const dist = Math.abs(p.x - relX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = p;
        }
      }

      setTooltip({
        x: closest.x,
        y: closest.y,
        rating: closest.snapshot.avgRating,
        reviewCount: closest.snapshot.reviewCount,
        label: formatMonthLabel(closest.snapshot.periodStart),
      });
    },
    [points],
  );

  const handleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (snapshots.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: '20px',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
          Not enough data to show a timeline yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '20px',
        bgcolor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 12px rgba(0,0,0,0.3)'
            : '0 2px 12px rgba(0,0,0,0.06)',
        p: 2,
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          Rating Over Time
        </Typography>
        <TrendIndicator
          trend={trend}
          trendScore={trendScore}
          size="small"
        />
      </Box>

      {/* SVG Chart */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Rating timeline chart"
          onMouseMove={handleInteraction}
          onTouchMove={handleInteraction}
          onMouseLeave={handleLeave}
          onTouchEnd={handleLeave}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={primaryColor}
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor={primaryColor}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines and labels */}
          {yTicks.map((tick) => {
            const y =
              padding.top + chartH - (tick / maxRating) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={textColor}
                  fontSize={10}
                  fontFamily="Inter, sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill under line */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Line */}
          {points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={primaryColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data point dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={tooltip?.x === p.x ? 5 : 3.5}
              fill={primaryColor}
              stroke={theme.palette.background.paper}
              strokeWidth={2}
            />
          ))}

          {/* X-axis month labels */}
          {points.map((p, i) => {
            // Skip some labels if too many
            const skip =
              points.length > 12
                ? i % 3 !== 0
                : points.length > 6
                  ? i % 2 !== 0
                  : false;
            if (skip && i !== points.length - 1) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={padding.top + chartH + 18}
                textAnchor="middle"
                fill={textColor}
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {formatMonthLabel(p.snapshot.periodStart)}
              </text>
            );
          })}

          {/* Tooltip indicator line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={padding.top}
              x2={tooltip.x}
              y2={padding.top + chartH}
              stroke={primaryColor}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          )}
        </svg>

        {/* Tooltip overlay */}
        {tooltip && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: `${(tooltip.x / viewBoxW) * 100}%`,
              transform: 'translateX(-50%)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(30,30,30,0.95)'
                  : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              px: 1.5,
              py: 0.75,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: primaryColor,
              }}
            >
              {tooltip.rating.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: textColor,
              }}
            >
              {tooltip.reviewCount} {tooltip.reviewCount === 1 ? 'review' : 'reviews'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
