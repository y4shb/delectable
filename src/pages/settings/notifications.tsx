import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as PhoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/AppShell';
import { fetchNotificationPreferences, updateNotificationPreferences } from '../../api/api';
import type { NotificationPreference } from '../../types';

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: fetchNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleToggle = (field: keyof NotificationPreference) => (
    _: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    if (prefs) {
      mutation.mutate({ ...prefs, [field]: checked });
    }
  };

  const handleSelectChange = (field: keyof NotificationPreference) => (
    event: { target: { value: string } },
  ) => {
    if (prefs) {
      mutation.mutate({ ...prefs, [field]: event.target.value });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </AppShell>
    );
  }

  if (!prefs) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load preferences</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Notification Settings
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Preferences saved!
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">Activity Notifications</Typography>
          </Box>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={prefs.likesEnabled} onChange={handleToggle('likesEnabled')} />}
              label="Likes on your reviews"
            />
            <FormControlLabel
              control={<Switch checked={prefs.commentsEnabled} onChange={handleToggle('commentsEnabled')} />}
              label="Comments on your reviews"
            />
            <FormControlLabel
              control={<Switch checked={prefs.followsEnabled} onChange={handleToggle('followsEnabled')} />}
              label="New followers"
            />
            <FormControlLabel
              control={<Switch checked={prefs.mentionsEnabled} onChange={handleToggle('mentionsEnabled')} />}
              label="Mentions"
            />
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Engagement Notifications
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={prefs.trendingEnabled} onChange={handleToggle('trendingEnabled')} />}
              label="Trending venues near you"
            />
            <FormControlLabel
              control={<Switch checked={prefs.streaksEnabled} onChange={handleToggle('streaksEnabled')} />}
              label="Streak reminders"
            />
            <FormControlLabel
              control={<Switch checked={prefs.badgesEnabled} onChange={handleToggle('badgesEnabled')} />}
              label="Badge unlocks"
            />
            <FormControlLabel
              control={<Switch checked={prefs.nudgesEnabled} onChange={handleToggle('nudgesEnabled')} />}
              label="Smart nudges"
            />
            <FormControlLabel
              control={<Switch checked={prefs.nearbyEnabled} onChange={handleToggle('nearbyEnabled')} />}
              label="Nearby saved venues"
            />
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Digest & Email</Typography>
          </Box>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={prefs.digestEnabled} onChange={handleToggle('digestEnabled')} />}
              label="Weekly digest"
            />
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Digest frequency:</Typography>
              <Select
                size="small"
                value={prefs.digestFrequency}
                onChange={handleSelectChange('digestFrequency')}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="never">Never</MenuItem>
              </Select>
            </Box>
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PhoneIcon color="primary" />
            <Typography variant="h6">Channels</Typography>
          </Box>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={prefs.pushEnabled} onChange={handleToggle('pushEnabled')} />}
              label="Push notifications"
            />
            <FormControlLabel
              control={<Switch checked={prefs.emailEnabled} onChange={handleToggle('emailEnabled')} />}
              label="Email notifications"
            />
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">Quiet Hours</Typography>
          </Box>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch checked={prefs.quietHoursEnabled} onChange={handleToggle('quietHoursEnabled')} />
              }
              label="Enable quiet hours"
            />
            {prefs.quietHoursEnabled && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Start"
                  type="time"
                  size="small"
                  value={prefs.quietHoursStart}
                  onChange={(e) =>
                    mutation.mutate({ ...prefs, quietHoursStart: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <Typography>to</Typography>
                <TextField
                  label="End"
                  type="time"
                  size="small"
                  value={prefs.quietHoursEnd}
                  onChange={(e) =>
                    mutation.mutate({ ...prefs, quietHoursEnd: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
          </FormGroup>
        </Box>
      </Container>
    </AppShell>
  );
}
