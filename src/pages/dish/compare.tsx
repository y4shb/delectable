import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useDishComparison } from '../../hooks/useApi';
import { fetchDishDetail, searchAll } from '../../api/api';
import TrendIndicator from '../../components/TrendIndicator';
import type { Dish, DishComparisonSide, RatingSnapshot } from '../../types';

/** Dual-line SVG chart overlaying two rating histories */
function ComparisonChart({
  dataA,
  dataB,
  labelA,
  labelB,
}: {
  dataA: RatingSnapshot[];
  dataB: RatingSnapshot[];
  labelA: string;
  labelB: string;
}) {
  const theme = useTheme();
  // Empty state: no data for either dish
  if (dataA.length === 0 && dataB.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 14, textAlign: 'center', py: 2 }}>
        Not enough data to show rating history.
      </Typography>
    );
  }

  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const gridColor =
    theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.08)';
  const textColor = theme.palette.text.secondary;

  const padding = { top: 24, right: 16, bottom: 32, left: 36 };
  const viewBoxW = 500;
  const viewBoxH = 200;
  const chartW = viewBoxW - padding.left - padding.right;
  const chartH = viewBoxH - padding.top - padding.bottom;
  const maxRating = 10;

  function toPoints(snapshots: RatingSnapshot[]) {
    if (snapshots.length === 0) return [];
    return snapshots.map((s, i) => {
      const x =
        padding.left +
        (snapshots.length === 1
          ? chartW / 2
          : (i / (snapshots.length - 1)) * chartW);
      const y =
        padding.top + chartH - (s.avgRating / maxRating) * chartH;
      return { x, y };
    });
  }

  const pointsA = toPoints(dataA);
  const pointsB = toPoints(dataB);
  const lineA = pointsA.map((p) => `${p.x},${p.y}`).join(' ');
  const lineB = pointsB.map((p) => `${p.x},${p.y}`).join(' ');

  const yTicks = [0, 2, 4, 6, 8, 10];

  // X-axis labels from longest series
  const longestData = dataA.length >= dataB.length ? dataA : dataB;
  const longestPoints =
    dataA.length >= dataB.length ? pointsA : pointsB;

  return (
    <Box sx={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Dish comparison rating history chart"
      >
        {/* Y-axis grid */}
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

        {/* Line A */}
        {pointsA.length > 1 && (
          <polyline
            points={lineA}
            fill="none"
            stroke={primaryColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Line B */}
        {pointsB.length > 1 && (
          <polyline
            points={lineB}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots A */}
        {pointsA.map((p, i) => (
          <circle
            key={`a-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={primaryColor}
            stroke={theme.palette.background.paper}
            strokeWidth={1.5}
          />
        ))}

        {/* Dots B */}
        {pointsB.map((p, i) => (
          <circle
            key={`b-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={secondaryColor}
            stroke={theme.palette.background.paper}
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {longestPoints.map((p, i) => {
          const skip =
            longestPoints.length > 12
              ? i % 3 !== 0
              : longestPoints.length > 6
                ? i % 2 !== 0
                : false;
          if (skip && i !== longestPoints.length - 1) return null;
          const d = new Date(longestData[i].periodStart);
          const label = isNaN(d.getTime())
            ? ''
            : d.toLocaleDateString('en-US', { month: 'short' });
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
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: 'center', mt: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 3,
              borderRadius: 1,
              bgcolor: primaryColor,
            }}
          />
          <Typography sx={{ fontSize: 12, color: textColor }}>
            {labelA}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 3,
              borderRadius: 1,
              bgcolor: secondaryColor,
            }}
          />
          <Typography sx={{ fontSize: 12, color: textColor }}>
            {labelB}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/** Side card for one dish in the comparison */
function DishSideCard({
  side,
  isWinner,
}: {
  side: DishComparisonSide;
  isWinner: boolean;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        borderRadius: '20px',
        p: 2,
        bgcolor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 12px rgba(0,0,0,0.3)'
            : '0 2px 12px rgba(0,0,0,0.06)',
        position: 'relative',
        border: isWinner
          ? `2px solid ${theme.palette.success.main}`
          : `1px solid ${theme.palette.divider}`,
      }}
    >
      {isWinner && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: theme.palette.success.main,
            color: '#fff',
            px: 1.5,
            py: 0.25,
            borderRadius: '12px',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 14 }} />
          Winner
        </Box>
      )}

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mt: isWinner ? 0.5 : 0,
        }}
      >
        {side.name}
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          color: theme.palette.text.secondary,
          mt: 0.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        @ {side.venueName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
        <StarIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 18,
            color: theme.palette.primary.main,
          }}
        >
          {Number(side.avgRating).toFixed(1)}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: 12,
          color: theme.palette.text.secondary,
          mt: 0.25,
        }}
      >
        {side.reviewCount} {side.reviewCount === 1 ? 'review' : 'reviews'}
      </Typography>

      <Box sx={{ mt: 1 }}>
        <TrendIndicator trend={side.recentTrend} size="small" />
      </Box>

      {side.topTags.length > 0 && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}
        >
          {side.topTags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: 11,
                height: 22,
                fontWeight: 500,
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default function DishComparePage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();

  // Pre-populate dish A from query param if provided
  const queryDishId =
    typeof router.query.dishId === 'string' ? router.query.dishId : undefined;

  const [dishA, setDishA] = useState<Dish | null>(null);
  const [dishB, setDishB] = useState<Dish | null>(null);
  const [searchOptionsA, setSearchOptionsA] = useState<Dish[]>([]);
  const [searchOptionsB, setSearchOptionsB] = useState<Dish[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const { data: comparison, isLoading: comparisonLoading } =
    useDishComparison(dishA?.id, dishB?.id);

  // Pre-populate dish A from query param (e.g. from dish detail page)
  useEffect(() => {
    if (queryDishId && !dishA && router.isReady) {
      fetchDishDetail(queryDishId)
        .then((d) => setDishA(d))
        .catch(() => {
          // Ignore — user can select manually
        });
    }
  }, [queryDishId, router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    async (
      query: string,
      setter: (dishes: Dish[]) => void,
      setLoading: (v: boolean) => void,
    ) => {
      if (query.length < 2) {
        setter([]);
        return;
      }
      setLoading(true);
      try {
        const results = await searchAll(query, 'dish', 10);
        setter(results.dishes ?? []);
      } catch {
        setter([]);
      }
      setLoading(false);
    },
    [],
  );

  const handleReset = () => {
    setDishA(null);
    setDishB(null);
    setSearchOptionsA([]);
    setSearchOptionsB([]);
  };

  const bothSelected = !!dishA && !!dishB;

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 3,
          }}
        >
          <IconButton
            onClick={() => router.back()}
            aria-label="Go back"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            sx={{
              fontFamily: '"Classy Pen", cursive',
              fontWeight: 700,
              fontSize: 24,
              color: theme.palette.primary.main,
            }}
          >
            Compare Dishes
          </Typography>
        </Box>

        {/* Dish selectors */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {/* Dish A selector */}
          <Autocomplete
            options={searchOptionsA}
            getOptionLabel={(opt) => opt.venueDetail?.name ? `${opt.name} @ ${opt.venueDetail.name}` : opt.name}
            value={dishA}
            onChange={(_, val) => setDishA(val)}
            onInputChange={(_, val) =>
              handleSearch(val, setSearchOptionsA, setLoadingA)
            }
            loading={loadingA}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select first dish..."
                variant="outlined"
                size="small"
                inputProps={{ ...params.inputProps, 'aria-label': 'Search for first dish' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                  },
                }}
              />
            )}
            noOptionsText="Search for a dish..."
          />

          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: theme.palette.text.secondary,
            }}
          >
            vs
          </Typography>

          {/* Dish B selector */}
          <Autocomplete
            options={searchOptionsB}
            getOptionLabel={(opt) => opt.venueDetail?.name ? `${opt.name} @ ${opt.venueDetail.name}` : opt.name}
            value={dishB}
            onChange={(_, val) => setDishB(val)}
            onInputChange={(_, val) =>
              handleSearch(val, setSearchOptionsB, setLoadingB)
            }
            loading={loadingB}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select second dish..."
                variant="outlined"
                size="small"
                inputProps={{ ...params.inputProps, 'aria-label': 'Search for second dish' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                  },
                }}
              />
            )}
            noOptionsText="Search for a dish..."
          />
        </Stack>

        {/* Loading state */}
        {bothSelected && comparisonLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {/* Comparison results */}
        {bothSelected && comparison && (
          <Box>
            {/* Side-by-side cards */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
              <DishSideCard
                side={comparison.dishA}
                isWinner={comparison.comparison.winner === 'dish_a'}
              />
              <DishSideCard
                side={comparison.dishB}
                isWinner={comparison.comparison.winner === 'dish_b'}
              />
            </Stack>

            {/* Overlapping chart */}
            <Box
              sx={{
                borderRadius: '20px',
                bgcolor: theme.palette.background.paper,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 2px 12px rgba(0,0,0,0.3)'
                    : '0 2px 12px rgba(0,0,0,0.06)',
                p: 2,
                mb: 3,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 1.5 }}>
                Rating History
              </Typography>
              <ComparisonChart
                dataA={comparison.dishA.ratingHistory}
                dataB={comparison.dishB.ratingHistory}
                labelA={comparison.dishA.name}
                labelB={comparison.dishB.name}
              />
            </Box>

            {/* Winner announcement */}
            {comparison.comparison.winner !== 'tie' && (
              <Box
                sx={{
                  borderRadius: '20px',
                  p: 2.5,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(76,175,80,0.1)'
                      : 'rgba(76,175,80,0.06)',
                  border: `1px solid ${theme.palette.success.main}`,
                  mb: 3,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.success.main,
                    mb: 0.5,
                  }}
                />
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  {comparison.comparison.winner === 'dish_a'
                    ? comparison.dishA.name
                    : comparison.dishB.name}{' '}
                  wins!
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                  }}
                >
                  By {Math.abs(comparison.comparison.ratingDifference).toFixed(1)}{' '}
                  rating points
                </Typography>
              </Box>
            )}

            {comparison.comparison.winner === 'tie' && (
              <Box
                sx={{
                  borderRadius: '20px',
                  p: 2.5,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 3,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  It&apos;s a tie!
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                  }}
                >
                  Both dishes are equally rated
                </Typography>
              </Box>
            )}

            {/* Reset button */}
            <Button
              variant="outlined"
              fullWidth
              onClick={handleReset}
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  bgcolor: 'transparent',
                },
              }}
            >
              Compare Different Dishes
            </Button>
          </Box>
        )}

        {/* Empty state when nothing selected */}
        {!bothSelected && !comparisonLoading && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 48,
                mb: 1,
              }}
            >
              VS
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 16,
                color: theme.palette.text.secondary,
              }}
            >
              Select two dishes above to compare their ratings and trends
            </Typography>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
