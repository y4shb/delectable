import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Groups, ContentCopy, Share } from '@mui/icons-material';
import { useRouter } from 'next/router';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { createDinnerPlan } from '../../api/api';
import type { DinnerPlan } from '../../types';

export default function NewDinnerPlanPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPlan, setCreatedPlan] = useState<DinnerPlan | null>(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your dinner plan.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const plan = await createDinnerPlan({
        title: title.trim(),
        description: description.trim(),
        cuisineFilter: cuisineFilter.trim(),
        suggestedDate: suggestedDate || undefined,
        suggestedTime: suggestedTime || undefined,
      });
      setCreatedPlan(plan);
    } catch (err: unknown) {
      setError('Failed to create dinner plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareLink = () => {
    if (!createdPlan) return '';
    return `${window.location.origin}/dinner-plan/join?code=${createdPlan.shareCode}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopySuccess(true);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareLink();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my dinner plan: ${createdPlan?.title}`,
          text: `Vote on where we should eat! Use code: ${createdPlan?.shareCode}`,
          url: getShareLink(),
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  // Show success state with share link
  if (createdPlan) {
    return (
      <AppShell>
        <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Groups sx={{ fontSize: 40, color: '#4CAF50' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              Plan Created!
            </Typography>
            <Typography color="text.secondary">
              Share this code with your friends so they can join and vote.
            </Typography>
          </Box>

          {/* Share code display */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              textAlign: 'center',
              mb: 3,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Share Code
            </Typography>
            <Typography
              sx={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: 6,
                fontFamily: 'monospace',
                color: '#F24D4F',
              }}
            >
              {createdPlan.shareCode}
            </Typography>
          </Paper>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={handleShare}
              fullWidth
              sx={{
                bgcolor: '#F24D4F',
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                '&:hover': { bgcolor: '#d93d3f' },
              }}
            >
              Share Invite Link
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleCopyLink}
              fullWidth
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                borderColor: '#F24D4F',
                color: '#F24D4F',
                '&:hover': { borderColor: '#d93d3f', bgcolor: 'rgba(242,77,79,0.04)' },
              }}
            >
              Copy Link
            </Button>
            <Button
              variant="text"
              onClick={() => router.push(`/dinner-plan/${createdPlan.id}`)}
              fullWidth
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                color: 'text.secondary',
              }}
            >
              Go to Plan
            </Button>
          </Box>

          <Snackbar
            open={copySuccess}
            autoHideDuration={2000}
            onClose={() => setCopySuccess(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Link copied to clipboard!
            </Alert>
          </Snackbar>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(242, 77, 79, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Groups sx={{ fontSize: 36, color: '#F24D4F' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Plan a Group Dinner
          </Typography>
          <Typography color="text.secondary">
            Find a restaurant everyone agrees on with Tinder-style venue swiping.
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Dinner Title"
            placeholder="Friday Night Dinner"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 200 }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          <TextField
            label="Description (optional)"
            placeholder="Let's find a great spot for the team!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          <TextField
            label="Cuisine Preference (optional)"
            placeholder="Italian, Japanese, Mexican..."
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
            fullWidth
            helperText="Filter venue options by cuisine type"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date (optional)"
              type="date"
              value={suggestedDate}
              onChange={(e) => setSuggestedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <TextField
              label="Time (optional)"
              type="time"
              value={suggestedTime}
              onChange={(e) => setSuggestedTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Groups />}
            onClick={handleCreate}
            disabled={isSubmitting || !title.trim()}
            fullWidth
            sx={{
              mt: 1,
              bgcolor: '#F24D4F',
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              fontSize: 16,
              '&:hover': { bgcolor: '#d93d3f' },
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create & Invite Friends'}
          </Button>
        </Box>
      </Box>
    </AppShell>
  );
}
