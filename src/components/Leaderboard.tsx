import { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard, fetchFriendsLeaderboard } from '../api/api';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  initialType?: 'global' | 'friends';
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard({ initialType = 'friends' }: LeaderboardProps) {
  const [boardType, setBoardType] = useState<'global' | 'friends'>(initialType);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');

  const { data: globalData, isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard', 'global', period],
    queryFn: () => fetchLeaderboard('global', period),
    enabled: boardType === 'global',
  });

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard', 'friends', period],
    queryFn: () => fetchFriendsLeaderboard(period),
    enabled: boardType === 'friends',
  });

  const isLoading = boardType === 'global' ? globalLoading : friendsLoading;
  const entries = boardType === 'global' ? globalData?.data : friendsData;
  const userRank = boardType === 'global' ? globalData?.userRank : null;

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrophyIcon />
          <Typography variant="h6" fontWeight={700}>
            Leaderboard
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={boardType}
          onChange={(_, val) => setBoardType(val)}
          variant="fullWidth"
        >
          <Tab label="Friends" value="friends" />
          <Tab label="Global" value="global" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
        {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
          <Chip
            key={p}
            label={p.replace('_', ' ')}
            size="small"
            variant={period === p ? 'filled' : 'outlined'}
            color={period === p ? 'primary' : 'default'}
            onClick={() => setPeriod(p)}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
      </Box>

      {isLoading ? (
        <Box p={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <List disablePadding>
          {entries?.map((entry, index) => (
            <LeaderboardRow key={entry.userId || `rank-${entry.rank}`} entry={entry} />
          ))}
        </List>
      )}

      {userRank && !entries?.some((e) => e.isSelf) && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Your rank
          </Typography>
          <LeaderboardRow entry={userRank} />
        </Box>
      )}
    </Box>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const isTopThree = entry.rank >= 1 && entry.rank <= 3;
  const rankColor = isTopThree ? RANK_COLORS[entry.rank - 1] : undefined;

  return (
    <ListItem
      sx={{
        bgcolor: entry.isSelf ? 'primary.50' : 'transparent',
        borderLeft: entry.isSelf ? '3px solid' : 'none',
        borderColor: 'primary.main',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1,
        }}
      >
        {isTopThree ? (
          <TrophyIcon sx={{ color: rankColor, fontSize: 24 }} />
        ) : (
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            #{entry.rank}
          </Typography>
        )}
      </Box>

      <ListItemAvatar>
        <Avatar src={entry.userAvatar} sx={{ width: 40, height: 40 }}>
          {entry.userName.charAt(0)}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2" fontWeight={entry.isSelf ? 700 : 500}>
              {entry.userName}
              {entry.isSelf && ' (You)'}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.25}>
              <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary">
                {entry.userLevel}
              </Typography>
            </Box>
          </Box>
        }
        secondary={`${entry.score.toLocaleString()} XP`}
      />
    </ListItem>
  );
}
