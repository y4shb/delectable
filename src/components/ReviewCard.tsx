import { Box, Typography, Avatar, Stack } from '@mui/material';

interface ReviewCardProps {
  user: { name: string; avatarUrl: string };
  rating: number;
  text: string;
  photoUrl: string;
  date: string;
  caption?: string;
  commentCount?: number;
}

export default function ReviewCard({ user, rating, text, photoUrl, date, caption, commentCount }: ReviewCardProps) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderRadius: 1.5, // nearly rectangular
      p: 0,
      boxShadow: 2,
      overflow: 'hidden',
      mb: 2,
      maxWidth: 440,
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch'
    }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, pb: 1 }}>
        <Avatar src={user.avatarUrl} />
        <Box>
          <Typography fontWeight={600}>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">{date}</Typography>
        </Box>
        <Box flexGrow={1} />
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'primary.main', minWidth: 48, textAlign: 'center' }}>
          {rating.toFixed(1)}
        </Typography>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 2 }}>
        <Box sx={{
          width: 240,
          height: 240,
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'grey.300',
          overflow: 'hidden',
          boxShadow: 0,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src={photoUrl} alt="review" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </Box>
      </Box>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{caption}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{text}</Typography>
        <Typography variant="caption" color="text.secondary">
          {commentCount ?? 0} comments
        </Typography>
      </Box>
    </Box>
  );
}
