import AppShell from '../layouts/AppShell';
import { Box, Typography, Button, TextField, Stack } from '@mui/material';

export default function LoginPage() {
  return (
    <AppShell>
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Sign in to Delectable</Typography>
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 320 }}>
          <TextField label="Email" variant="outlined" fullWidth />
          <TextField label="Password" variant="outlined" type="password" fullWidth />
          <Button variant="contained" color="primary" size="large">Sign In (stub)</Button>
          <Button variant="text" color="primary">Sign Up</Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
