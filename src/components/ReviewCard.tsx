import { Box, Typography, Avatar, Chip, Stack } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface ReviewCardProps {
  venue: string;
  location: string;
  dish?: string;
  tags?: string[];
  user: { name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  date: string;
  likeCount?: number;
  commentCount?: number;
}

export default function ReviewCard({
  venue,
  location,
  dish,
  tags = [],
  user,
  rating,
  text,
  photoUrl,
  date,
  likeCount = 0,
  commentCount = 0,
}: ReviewCardProps) {
  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.background.paper,
        borderRadius: 1.1,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
        mb: 2,
        overflow: 'hidden',
        maxWidth: 420,
        mx: 'auto',
        width: '100%',
        px: 2,
        p: 0,
      })}
    >
      {/* Image & overlays */}
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1.5', minHeight: 375, background: '#eee' }}>
        <img
          src={photoUrl}
          alt={venue}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Rating overlay */}
        <Typography sx={{
          position: 'absolute',
          top: 14,
          right: 18,
          color: '#fff',
          fontWeight: 700,
          fontSize: 28,
          textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
          zIndex: 2,
        }}>{rating.toFixed(1)}</Typography>
        {/* Venue name & location */}
        <Box sx={{ position: 'absolute', left: 18, bottom: 38 }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 22, lineHeight: 1, textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{venue}</Typography>
          <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 14, textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{location}</Typography>
        </Box>
        {/* Reviewer row overlay */}
        <Box sx={{ position: 'absolute', left: 14, bottom: 8, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={user.avatarUrl} sx={{ width: 20, height: 20, border: '1px solid #fff' }} />
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14, ml: 0.1, textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{user.name}</Typography>
          {user.level && (
            <Box sx={{ bgcolor: '#F24D4F', color: '#fff', borderRadius: 2, px: 1, ml: 1, fontWeight: 700, fontSize: 13, height: 22, display: 'flex', alignItems: 'center', textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{user.level}</Box>
          )}
        </Box>
        {/* Dish name overlay */}
        {dish && (
          <Box sx={{ position: 'absolute', right: 18, bottom: 14 }}>
            <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 15, textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{dish}</Typography>
          </Box>
        )}
      </Box>
      {/* Tags/chips */}
      <Box sx={{ display: 'flex', gap: 1, px: 2, pt: 1.5, flexWrap: 'wrap' }}>
        {tags.map((tag, i) => (
          <Chip
            key={i}
            label={tag}
            sx={theme => ({
              bgcolor: theme.palette.mode === 'dark' ? '#232323' : '#fbeaec',
              color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#F24D4F',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 2,
              height: 28,
              border: theme.palette.mode === 'dark' ? `2px solid ${theme.palette.primary.main}` : 'none',
            })}
            size="small"
          />
        ))}
      </Box>
      {/* Review text */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography sx={theme => ({ fontWeight: 400, fontSize: 15, color: theme.palette.text.primary })}>{text}</Typography>
        <Typography sx={theme => ({ fontWeight: 400, fontSize: 13, color: theme.palette.text.secondary, mt: 0.5 })}>{date}</Typography>
      </Box>
      {/* Like/comment row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 2, pb: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FavoriteBorderIcon sx={theme => ({ fontSize: 20, color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : '#bdbdbd' })} />
          <Typography sx={theme => ({ fontWeight: 600, fontSize: 15, color: theme.palette.text.primary })}>{likeCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ChatBubbleOutlineIcon sx={theme => ({ fontSize: 20, color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : '#bdbdbd' })} />
          <Typography sx={theme => ({ fontWeight: 600, fontSize: 15, color: theme.palette.text.primary })}>{commentCount}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
