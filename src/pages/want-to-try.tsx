import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  BookmarkBorder as BookmarkIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useWantToTry } from '../hooks/useApi';
import {
  addWantToTry,
  removeWantToTry,
  searchAll,
} from '../api/api';
import type { Venue, WantToTryItem } from '../types';

export default function WantToTryPage() {
  useRequireAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const { data: items, isLoading, error } = useWantToTry();

  const { data: searchResults } = useQuery({
    queryKey: ['venueSearch', searchQuery],
    queryFn: async () => {
      const result = await searchAll(searchQuery, 'venue', 10);
      return result.venues ?? [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: ({ venueId, note }: { venueId: string; note?: string }) =>
      addWantToTry(venueId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wantToTry'] });
      handleCloseDialog();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWantToTry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['wantToTry'] });
      const previous = queryClient.getQueryData<WantToTryItem[]>(['wantToTry']);
      queryClient.setQueryData<WantToTryItem[]>(['wantToTry'], (old) =>
        old ? old.filter((item) => item.id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wantToTry'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wantToTry'] });
    },
  });

  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setSearchQuery('');
    setNote('');
    setSelectedVenue(null);
  };

  const handleAdd = () => {
    if (selectedVenue) {
      addMutation.mutate({ venueId: selectedVenue.id, note: note || undefined });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={700} mb={3}>
            Want to Try
          </Typography>
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={220}
                  sx={{ borderRadius: '20px' }}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load your want-to-try list</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4, pb: 12 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <BookmarkIcon sx={{ fontSize: 32, color: '#F24D4F' }} />
          <Typography variant="h4" fontWeight={700}>
            Want to Try
          </Typography>
        </Box>

        {(!items || items.length === 0) ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
            }}
          >
            <RestaurantIcon
              sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" fontWeight={600} mb={1}>
              Your culinary bucket list is empty
            </Typography>
            <Typography color="text.secondary" mb={3}>
              Discover venues and save them here to remember where you want to eat next.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#F24D4F',
                '&:hover': { bgcolor: '#d93d3f' },
              }}
            >
              Add a Venue
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    borderRadius: '20px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <Link href={`/venue/${item.venueDetail?.id ?? item.venue}`} passHref legacyBehavior>
                    <Box
                      component="a"
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {item.venueDetail?.photoUrl ? (
                        <Box
                          component="img"
                          src={item.venueDetail.photoUrl}
                          alt={item.venueDetail.name}
                          sx={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 140,
                            bgcolor: 'rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <RestaurantIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        </Box>
                      )}
                    </Box>
                  </Link>

                  <IconButton
                    size="small"
                    onClick={() => removeMutation.mutate(item.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  <CardContent sx={{ p: 2 }}>
                    <Typography fontWeight={700} fontSize={15} noWrap>
                      {item.venueDetail?.name ?? 'Unknown Venue'}
                    </Typography>
                    {item.venueDetail?.cuisineType && (
                      <Typography
                        color="text.secondary"
                        fontSize={13}
                        mt={0.25}
                      >
                        {item.venueDetail.cuisineType}
                      </Typography>
                    )}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      mt={0.5}
                    >
                      <StarIcon
                        sx={{ fontSize: 16, color: '#F24D4F' }}
                      />
                      <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{ color: '#F24D4F' }}
                      >
                        {item.venueDetail
                          ? Number(item.venueDetail.rating).toFixed(1)
                          : '--'}
                      </Typography>
                    </Box>
                    {item.note && (
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                        mt={1}
                        sx={{
                          fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        "{item.note}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* FAB to add */}
        <Fab
          color="primary"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            bgcolor: '#F24D4F',
            '&:hover': { bgcolor: '#d93d3f' },
          }}
        >
          <AddIcon />
        </Fab>

        {/* Add Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Add to Want to Try</Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              placeholder="Search for a venue..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedVenue(null);
              }}
              sx={{ mb: 2 }}
              size="small"
            />

            {selectedVenue ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.03)',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {selectedVenue.photoUrl ? (
                    <Avatar
                      src={selectedVenue.photoUrl}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 48, height: 48, bgcolor: 'rgba(0,0,0,0.1)' }}
                    >
                      <RestaurantIcon />
                    </Avatar>
                  )}
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>
                      {selectedVenue.name}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12}>
                      {selectedVenue.cuisineType}
                      {selectedVenue.locationText
                        ? ` - ${selectedVenue.locationText}`
                        : ''}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ ml: 'auto' }}
                    onClick={() => setSelectedVenue(null)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              searchResults &&
              searchResults.length > 0 && (
                <Box
                  sx={{
                    maxHeight: 240,
                    overflowY: 'auto',
                    mb: 2,
                  }}
                >
                  {searchResults.map((venue: Venue) => (
                    <Box
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      {venue.photoUrl ? (
                        <Avatar
                          src={venue.photoUrl}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'rgba(0,0,0,0.1)',
                          }}
                        >
                          <RestaurantIcon fontSize="small" />
                        </Avatar>
                      )}
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>
                          {venue.name}
                        </Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {venue.cuisineType}
                        </Typography>
                      </Box>
                      <Chip
                        label={Number(venue.rating).toFixed(1)}
                        size="small"
                        sx={{
                          ml: 'auto',
                          fontWeight: 700,
                          bgcolor: '#F24D4F',
                          color: '#fff',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )
            )}

            {selectedVenue && (
              <TextField
                fullWidth
                placeholder="Add a note (optional) - e.g. 'Try the omakase'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                inputProps={{ maxLength: 300 }}
                size="small"
                multiline
                rows={2}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!selectedVenue || addMutation.isPending}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#F24D4F',
                '&:hover': { bgcolor: '#d93d3f' },
              }}
            >
              Add to List
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
}
