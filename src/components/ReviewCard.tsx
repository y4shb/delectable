import { Box, Typography, Avatar, Stack, Rating } from '@mui/material';

interface ReviewCardProps {
  user: { name: string; avatarUrl: string };
  rating: number;
  text: string;
  photoUrl: string;
  date: string;
}

export default function ReviewCard({ user, rating, text, photoUrl, date }: ReviewCardProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, p: 2, boxShadow: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <Avatar src={user.avatarUrl} />
        <Box>
          <Typography fontWeight={600}>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">{date}</Typography>
        </Box>
        <Box flexGrow={1} />
        <Rating value={rating / 2} precision={0.1} readOnly max={5} size="small" />
      </Stack>
      <Box sx={{ mb: 1 }}>
        <img src={photoUrl} alt="review" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 180 }} />
      </Box>
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}
