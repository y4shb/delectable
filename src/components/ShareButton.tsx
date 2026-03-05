import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';

interface ShareButtonProps {
  type: 'review' | 'venue' | 'playlist' | 'profile';
  id: string;
  title: string;
  description?: string;
}

export default function ShareButton({ type, id, title, description }: ShareButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const shareUrl = `${window.location.origin}/${type}/${id}`;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNativeShare = async () => {
    handleClose();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    handleClose();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackbarMessage('Link copied to clipboard!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTwitterShare = () => {
    handleClose();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleInstagramStory = async () => {
    handleClose();
    // Generate share card and open Instagram
    // This would trigger the share card API
    setSnackbarMessage('Opening Instagram...');
    setSnackbarOpen(true);

    // In production, this would:
    // 1. Call generateShareCard API
    // 2. Download/open the image
    // 3. Prompt user to share to Instagram
  };

  const showNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label="Share"
        size="small"
      >
        <ShareIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {showNativeShare && (
          <MenuItem onClick={handleNativeShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share...</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleTwitterShare}>
          <ListItemIcon>
            <TwitterIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share to X</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleInstagramStory}>
          <ListItemIcon>
            <InstagramIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Instagram Story</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
}
