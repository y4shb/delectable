import AppShell from '../../layouts/AppShell';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function NewPlaylistPage() {
  const theme = useTheme();

  return (
    <AppShell>
      <Box sx={{ maxWidth: 420, mx: 'auto', pb: 11 }}>
        <Typography
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            fontSize: 28,
            color: '#F24D4F',
            textAlign: 'left',
            mb: 3,
          }}
        >
          New Playlist
        </Typography>

        <Stack spacing={3}>
          {/* Title input */}
          <TextField
            variant="outlined"
            label="Playlist Title"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Description input */}
          <TextField
            variant="outlined"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Cover photo area */}
          <Box
            sx={{
              height: 200,
              width: '100%',
              borderRadius: '20px',
              border: '2px dashed',
              borderColor: 'text.secondary',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <PhotoCameraIcon sx={{ color: 'text.secondary', fontSize: 40, mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tap to add cover photo
            </Typography>
          </Box>

          {/* Add spots section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Add Spots
              </Typography>
              <Button
                variant="contained"
                sx={{
                  minWidth: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  padding: 0,
                  backgroundColor: '#F24D4F',
                  '&:hover': {
                    backgroundColor: '#d93d3f',
                  },
                }}
              >
                +
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Search and add restaurants to your playlist
            </Typography>
          </Box>

          {/* Create button */}
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#F24D4F',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '48px',
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#d93d3f',
              },
            }}
          >
            Create Playlist
          </Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
