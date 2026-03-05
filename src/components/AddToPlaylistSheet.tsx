import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlaylists } from '../hooks/useApi';
import { addPlaylistItem, createPlaylist } from '../api/api';

interface AddToPlaylistSheetProps {
  open: boolean;
  onClose: () => void;
  venueId: string;
}

export default function AddToPlaylistSheet({
  open,
  onClose,
  venueId,
}: AddToPlaylistSheetProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: playlists, isLoading } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setAddedTo(new Set());
      setShowCreate(false);
      setNewTitle('');
    }
  }, [open, venueId]);

  const addMutation = useMutation({
    mutationFn: (playlistId: string) => addPlaylistItem(playlistId, venueId),
    onSuccess: (_data, playlistId) => {
      setAddedTo((prev) => new Set(prev).add(playlistId));
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createPlaylist({ title: newTitle }),
    onSuccess: async (playlist) => {
      await addPlaylistItem(playlist.id, venueId);
      setAddedTo((prev) => new Set(prev).add(playlist.id));
      setNewTitle('');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '24px 24px 0 0',
          position: 'fixed',
          bottom: 0,
          m: 0,
          maxHeight: '60vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18, textAlign: 'center', pb: 1 }}>
        Add to Playlist
      </DialogTitle>
      <Divider />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <List sx={{ px: 1, py: 1, maxHeight: 300, overflowY: 'auto' }}>
          {(playlists ?? []).map((playlist) => {
            const isAdded = addedTo.has(playlist.id);
            return (
              <ListItemButton
                key={playlist.id}
                onClick={() => !isAdded && addMutation.mutate(playlist.id)}
                disabled={isAdded || addMutation.isPending}
                sx={{ borderRadius: '12px', mb: 0.5 }}
              >
                <ListItemText
                  primary={playlist.title}
                  secondary={`${playlist.itemsCount} spots`}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }}
                  secondaryTypographyProps={{ fontSize: 13 }}
                />
                {isAdded && <CheckIcon sx={{ color: theme.palette.primary.main }} />}
              </ListItemButton>
            );
          })}
        </List>
      )}

      <Divider />

      {showCreate ? (
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Playlist name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => newTitle.trim() && createMutation.mutate()}
            disabled={!newTitle.trim() || createMutation.isPending}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: theme.palette.primary.main,
              minWidth: 60,
            }}
          >
            {createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : 'Add'}
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setShowCreate(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.primary.main,
              borderRadius: '12px',
            }}
          >
            Create New Playlist
          </Button>
        </Box>
      )}
    </Dialog>
  );
}
