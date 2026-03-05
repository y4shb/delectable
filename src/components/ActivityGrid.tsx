import { Box, Tooltip, Typography } from '@mui/material';
import type { ActivityDay } from '../types';

interface ActivityGridProps {
  data: ActivityDay[];
  weeks?: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const DAYS_PER_WEEK = 7;

const LEVEL_COLORS = [
  '#ebedf0', // 0 - no activity
  '#9be9a8', // 1 - low
  '#40c463', // 2 - medium
  '#30a14e', // 3 - high
  '#216e39', // 4 - very high
];

export default function ActivityGrid({ data, weeks = 52 }: ActivityGridProps) {
  // Group data by week
  const cellsPerWeek: ActivityDay[][] = [];
  let currentWeek: ActivityDay[] = [];

  // Fill in missing days and align to weeks
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  const startDayOfWeek = startDate.getDay(); // 0 = Sunday

  // Add empty cells for start alignment
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push({ date: '', level: -1 }); // -1 = empty cell
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === DAYS_PER_WEEK) {
      cellsPerWeek.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add remaining partial week
  if (currentWeek.length > 0) {
    while (currentWeek.length < DAYS_PER_WEEK) {
      currentWeek.push({ date: '', level: -1 });
    }
    cellsPerWeek.push(currentWeek);
  }

  const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];
  const monthLabels = getMonthLabels(cellsPerWeek);

  return (
    <Box sx={{ overflowX: 'auto', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Activity
      </Typography>

      {/* Month labels */}
      <Box display="flex" pl="28px" mb={0.5}>
        {monthLabels.map((label, i) => (
          <Typography
            key={i}
            variant="caption"
            color="text.secondary"
            sx={{ minWidth: CELL_SIZE + CELL_GAP, fontSize: 10 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box display="flex">
        {/* Day labels */}
        <Box display="flex" flexDirection="column" gap={`${CELL_GAP}px`} mr={0.5}>
          {dayLabels.map((label, i) => (
            <Typography
              key={i}
              variant="caption"
              color="text.secondary"
              sx={{
                height: CELL_SIZE,
                lineHeight: `${CELL_SIZE}px`,
                fontSize: 10,
                width: 24,
                textAlign: 'right',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        {/* Grid */}
        <Box display="flex" gap={`${CELL_GAP}px`}>
          {cellsPerWeek.map((week, weekIndex) => (
            <Box key={weekIndex} display="flex" flexDirection="column" gap={`${CELL_GAP}px`}>
              {week.map((day, dayIndex) => (
                <Tooltip
                  key={dayIndex}
                  title={
                    day.level >= 0 && day.date
                      ? `${day.date}: ${day.level === 0 ? 'No activity' : `Level ${day.level}`}`
                      : ''
                  }
                  placement="top"
                >
                  <Box
                    sx={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: '2px',
                      bgcolor: day.level >= 0 ? LEVEL_COLORS[day.level] : 'transparent',
                      cursor: day.level >= 0 ? 'pointer' : 'default',
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legend */}
      <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1} gap={0.5}>
        <Typography variant="caption" color="text.secondary" mr={0.5}>
          Less
        </Typography>
        {LEVEL_COLORS.map((color, i) => (
          <Box
            key={i}
            sx={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: '2px',
              bgcolor: color,
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary" ml={0.5}>
          More
        </Typography>
      </Box>
    </Box>
  );
}

function getMonthLabels(weeks: ActivityDay[][]): string[] {
  const labels: string[] = [];
  let lastMonth = -1;

  weeks.forEach((week) => {
    const firstValidDay = week.find((d) => d.date);
    if (firstValidDay?.date) {
      const date = new Date(firstValidDay.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        lastMonth = month;
      } else {
        labels.push('');
      }
    } else {
      labels.push('');
    }
  });

  return labels;
}
