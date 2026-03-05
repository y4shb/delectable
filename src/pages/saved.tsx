import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import AppShell from '../layouts/AppShell';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useBookmarks } from '../hooks/useApi';
import ReviewCard from '../components/ReviewCard';
import { reviewToFeedReview } from '../api/api';
import BookmarkIcon from '@mui/icons-material/Bookmark';

export default function SavedPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const { data: bookmarks, isLoading } = useBookmarks();

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const items = bookmarks ?? [];

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        <Typography
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            fontSize: 28,
            color: theme.palette.primary.main,
            textAlign: 'left',
            mb: 3,
          }}
        >
          Saved
        </Typography>

        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary" sx={{ fontSize: 16 }}>
              No saved reviews yet
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
              Bookmark reviews to find them here
            </Typography>
          </Box>
        ) : (
          items.filter((b) => b.reviewDetail).map((bookmark) => {
            const feedReview = reviewToFeedReview(bookmark.reviewDetail);
            return <ReviewCard key={bookmark.id} {...feedReview} />;
          })
        )}
      </Box>
    </AppShell>
  );
}
