import { Box, Typography, Tooltip, LinearProgress, Avatar, Chip } from '@mui/material';
import { Lock as LockIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import type { UserBadge, BadgeDefinition } from '../types';

interface BadgeShelfProps {
  badges: UserBadge[];
  maxDisplay?: number;
  showProgress?: boolean;
}

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export default function BadgeShelf({
  badges,
  maxDisplay = 8,
  showProgress = true,
}: BadgeShelfProps) {
  // Sort: unlocked first (by unlock date), then locked by progress
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    if (a.isUnlocked && b.isUnlocked) {
      return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
    }
    return b.progressPercent - a.progressPercent;
  });

  const displayBadges = sortedBadges.slice(0, maxDisplay);
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrophyIcon color="warning" />
          <Typography variant="h6" fontWeight={700}>
            Badges
          </Typography>
        </Box>
        <Chip
          label={`${unlockedCount} / ${badges.length}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2}>
        {displayBadges.map((userBadge) => (
          <BadgeItem
            key={userBadge.id}
            userBadge={userBadge}
            showProgress={showProgress}
          />
        ))}
      </Box>

      {badges.length > maxDisplay && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          +{badges.length - maxDisplay} more badges
        </Typography>
      )}
    </Box>
  );
}

interface BadgeItemProps {
  userBadge: UserBadge;
  showProgress: boolean;
}

function BadgeItem({ userBadge, showProgress }: BadgeItemProps) {
  const { badge, isUnlocked, progress, progressPercent } = userBadge;
  const tierColor = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {badge.name}
          </Typography>
          <Typography variant="caption">{badge.description}</Typography>
          <Typography variant="caption" display="block" mt={0.5}>
            {isUnlocked
              ? `Unlocked! +${badge.xpReward} XP`
              : `${progress} / ${badge.requirementValue}`}
          </Typography>
        </Box>
      }
      placement="top"
    >
      <Box
        sx={{
          width: 64,
          textAlign: 'center',
          opacity: isUnlocked ? 1 : 0.5,
          filter: isUnlocked ? 'none' : 'grayscale(80%)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 0.5,
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: tierColor,
              border: `2px solid ${tierColor}`,
            }}
          >
            {badge.iconUrl ? (
              <img src={badge.iconUrl} alt={badge.name} style={{ width: 32, height: 32 }} />
            ) : (
              <TrophyIcon />
            )}
          </Avatar>
          {!isUnlocked && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                bgcolor: 'grey.600',
                borderRadius: '50%',
                p: 0.25,
              }}
            >
              <LockIcon sx={{ fontSize: 12, color: 'white' }} />
            </Box>
          )}
        </Box>

        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {badge.name}
        </Typography>

        {showProgress && !isUnlocked && (
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 3,
              borderRadius: 2,
              mt: 0.5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: tierColor,
              },
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

// Standalone badge card for full details
interface BadgeCardProps {
  badge: BadgeDefinition;
  userBadge?: UserBadge;
}

export function BadgeCard({ badge, userBadge }: BadgeCardProps) {
  const isUnlocked = userBadge?.isUnlocked ?? false;
  const progress = userBadge?.progress ?? 0;
  const progressPercent = userBadge?.progressPercent ?? 0;
  const tierColor = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isUnlocked ? tierColor : 'grey.200',
        opacity: isUnlocked ? 1 : 0.7,
      }}
    >
      <Box display="flex" gap={2}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: tierColor,
            filter: isUnlocked ? 'none' : 'grayscale(80%)',
          }}
        >
          <TrophyIcon />
        </Avatar>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              {badge.name}
            </Typography>
            <Chip
              label={badge.tier}
              size="small"
              sx={{
                bgcolor: tierColor,
                color: badge.tier === 'platinum' ? 'text.primary' : 'white',
                fontWeight: 600,
                fontSize: 10,
                height: 18,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {badge.description}
          </Typography>

          {!isUnlocked && (
            <Box mt={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {progress} / {badge.requirementValue}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: tierColor,
                  },
                }}
              />
            </Box>
          )}

          {isUnlocked && userBadge?.unlockedAt && (
            <Typography variant="caption" color="success.main" fontWeight={600} mt={1} display="block">
              Unlocked {new Date(userBadge.unlockedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
