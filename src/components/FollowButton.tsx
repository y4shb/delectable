import { useState, useEffect } from 'react';
import { Button, useTheme } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '../api/api';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  size = 'small',
  fullWidth = false,
}: FollowButtonProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);

  // Only sync if the prop actually changed from the current local state
  useEffect(() => {
    if (initialIsFollowing !== isFollowing) {
      setIsFollowing(initialIsFollowing);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIsFollowing]);

  const followMutation = useMutation({
    mutationFn: () => followUser(userId),
    onMutate: () => setIsFollowing(true),
    onError: () => setIsFollowing(false),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userId),
    onMutate: () => setIsFollowing(false),
    onError: () => setIsFollowing(true),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  if (isFollowing) {
    return (
      <Button
        variant={isHovered ? 'outlined' : 'contained'}
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        fullWidth={fullWidth}
        sx={{
          borderRadius: '48px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: size === 'small' ? 13 : 14,
          minWidth: fullWidth ? undefined : 100,
          ...(isHovered
            ? {
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                bgcolor: 'transparent',
                '&:hover': {
                  borderColor: theme.palette.error.dark,
                  bgcolor: 'transparent',
                },
              }
            : {
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }),
        }}
      >
        {isHovered ? 'Unfollow' : 'Following'}
      </Button>
    );
  }

  return (
    <Button
      variant="outlined"
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      fullWidth={fullWidth}
      sx={{
        borderRadius: '48px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: size === 'small' ? 13 : 14,
        minWidth: fullWidth ? undefined : 100,
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
        '&:hover': {
          borderColor: theme.palette.primary.dark,
          bgcolor: 'transparent',
        },
      }}
    >
      Follow
    </Button>
  );
}
