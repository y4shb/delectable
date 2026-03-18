import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import AppShell from '../../../layouts/AppShell';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import {
  useVenueDetail,
  useVenueTimeline,
  useVenueUserTimeline,
} from '../../../hooks/useApi';
import RatingTimeline from '../../../components/RatingTimeline';
import TrendIndicator from '../../../components/TrendIndicator';
import type { Dish, UserVisit } from '../../../types';

type Period = 'month' | 'week';
type Timeframe = '6M' | '1Y' | 'All';

function timeframeToMonths(tf: Timeframe): number | undefined {
  if (tf === '6M') return 6;
  if (tf === '1Y') return 12;
  return undefined;
}

/** Tiny sparkline SVG for dish cards */
function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Format a date string into a readable label */
function formatVisitDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VenueTimelinePage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;

  const [period, setPeriod] = useState<Period>('month');
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');

  const months = timeframeToMonths(timeframe);

  const { data: venue, isLoading: venueLoading } = useVenueDetail(
    id as string,
  );
  const { data: timeline, isLoading: timelineLoading } = useVenueTimeline(
    id as string,
    period,
    months,
  );
  const { data: userTimeline } = useVenueUserTimeline(id as string);

  if (!router.isReady || venueLoading) {
    return (
      <AppShell>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={32} />
        </Box>
      </AppShell>
    );
  }

  if (!venue) {
    return (
      <AppShell>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            Venue not found
          </Typography>
        </Box>
      </AppShell>
    );
  }

  const pillSx = (active: boolean) => ({
    borderRadius: '48px',
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: 13,
    px: 2,
    py: 0.5,
    minWidth: 0,
    bgcolor: active ? theme.palette.primary.main : 'transparent',
    color: active
      ? theme.palette.primary.contrastText
      : theme.palette.text.secondary,
    border: active
      ? 'none'
      : `1px solid ${theme.palette.divider}`,
    '&:hover': {
      bgcolor: active
        ? theme.palette.primary.dark
        : theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
    },
  });

  // Dish sparkline data from snapshots
  const topDishes: Dish[] = venue.dishes
    ? [...venue.dishes]
        .sort((a, b) => {
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, 6)
    : [];

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
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
            Time Machine
          </Typography>
        </Box>

        {/* Venue info */}
        <Box sx={{ px: 0.5, mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            {venue.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon
                sx={{ fontSize: 18, color: theme.palette.primary.main }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: theme.palette.primary.main,
                }}
              >
                {Number(venue.rating).toFixed(1)}
              </Typography>
            </Box>
            {timeline && (
              <TrendIndicator
                trend={timeline.trend}
                trendScore={timeline.trendScore}
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Period toggle */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, px: 0.5 }}>
          <Button
            size="small"
            onClick={() => setPeriod('month')}
            sx={pillSx(period === 'month')}
            aria-label="Show monthly data"
          >
            Monthly
          </Button>
          <Button
            size="small"
            onClick={() => setPeriod('week')}
            sx={pillSx(period === 'week')}
            aria-label="Show weekly data"
          >
            Weekly
          </Button>
        </Stack>

        {/* Timeframe toggle */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, px: 0.5 }}>
          {(['6M', '1Y', 'All'] as Timeframe[]).map((tf) => (
            <Button
              key={tf}
              size="small"
              onClick={() => setTimeframe(tf)}
              sx={pillSx(timeframe === tf)}
              aria-label={`Show ${tf === '6M' ? '6 months' : tf === '1Y' ? '1 year' : 'all time'} data`}
            >
              {tf}
            </Button>
          ))}
        </Stack>

        {/* Rating chart */}
        {timelineLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : timeline ? (
          <RatingTimeline
            snapshots={timeline.snapshots}
            trend={timeline.trend}
            trendScore={timeline.trendScore}
          />
        ) : null}

        {/* Your Visits section */}
        {userTimeline && userTimeline.visits.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
              Your Visits
            </Typography>
            <Box sx={{ position: 'relative', pl: 3 }}>
              {/* Vertical connector line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 10,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  bgcolor: theme.palette.divider,
                  borderRadius: 1,
                }}
              />

              <Stack spacing={2}>
                {userTimeline.visits.map((visit: UserVisit, index: number) => (
                  <Box key={visit.reviewId} sx={{ position: 'relative' }}>
                    {/* Timeline node dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -23,
                        top: 8,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        border: `2px solid ${theme.palette.background.paper}`,
                        zIndex: 1,
                      }}
                    />

                    {/* Visit card */}
                    <Box
                      sx={{
                        borderRadius: '16px',
                        p: 2,
                        bgcolor: theme.palette.background.paper,
                        boxShadow:
                          theme.palette.mode === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.2)'
                            : '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.75,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                          }}
                        >
                          {formatVisitDate(visit.createdAt)}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <StarIcon
                            sx={{
                              fontSize: 16,
                              color: theme.palette.primary.main,
                            }}
                          />
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {Number(visit.rating).toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        {visit.photoUrl && (
                          <Box
                            component="img"
                            src={visit.photoUrl}
                            alt={visit.dishName}
                            loading="lazy"
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '12px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {visit.dishName && (
                            <Typography
                              sx={{ fontWeight: 600, fontSize: 14, mb: 0.25 }}
                            >
                              {visit.dishName}
                            </Typography>
                          )}
                          {visit.text && (
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: theme.palette.text.secondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {visit.text}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {visit.tags.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            mt: 1,
                            flexWrap: 'wrap',
                            gap: 0.5,
                          }}
                        >
                          {visit.tags.slice(0, 3).map((tag) => (
                            <Box
                              key={tag}
                              sx={{
                                fontSize: 11,
                                fontWeight: 500,
                                px: 1,
                                py: 0.25,
                                borderRadius: '8px',
                                bgcolor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.05)',
                                color: theme.palette.text.secondary,
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Best Dishes with sparklines */}
        {topDishes.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
              Best Dishes
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 0.5,
              }}
            >
              {topDishes.map((dish) => (
                <Link
                  key={dish.id}
                  href={`/dish/${dish.id}`}
                  legacyBehavior
                  passHref
                >
                  <Box
                    component="a"
                    sx={{
                      width: 160,
                      flexShrink: 0,
                      borderRadius: '16px',
                      p: 1.5,
                      bgcolor: theme.palette.background.paper,
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? '0 2px 8px rgba(0,0,0,0.2)'
                          : '0 2px 12px rgba(0,0,0,0.06)',
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dish.name}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <StarIcon
                        sx={{
                          fontSize: 14,
                          color: theme.palette.primary.main,
                        }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: theme.palette.primary.main,
                        }}
                      >
                        {Number(dish.avgRating).toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 12, mt: 0.25 }}
                    >
                      {dish.reviewCount}{' '}
                      {dish.reviewCount === 1 ? 'review' : 'reviews'}
                    </Typography>
                    {/* Mini sparkline placeholder using avg rating */}
                    <Box sx={{ mt: 1 }}>
                      <MiniSparkline
                        data={[
                          dish.avgRating * 0.9,
                          dish.avgRating * 0.95,
                          dish.avgRating,
                        ]}
                        color={theme.palette.primary.main}
                      />
                    </Box>
                  </Box>
                </Link>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
