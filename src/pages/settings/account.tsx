import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
  Logout as LogoutIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import AppShell from '../../layouts/AppShell';
import SEOHead from '../../components/SEOHead';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../context/AuthContext';
import { exportMyData, deleteMyAccount } from '../../api/api';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const blob = await exportMyData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'delectable-my-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch {
      setError('Failed to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteMyAccount();
      await logout();
      router.replace('/login');
    } catch {
      setError('Failed to delete your account. Please try again.');
      setIsDeleting(false);
    }
  }, [logout, router]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  if (authLoading) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEOHead
        title="Account Settings"
        description="Manage your Delectable account, export data, or delete your account."
      />

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Account Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {exportSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your data export has started downloading.
          </Alert>
        )}

        {/* Export Data */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <DownloadIcon color="primary" />
            <Typography variant="h6">Export My Data</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download a copy of all your data, including your profile, reviews,
            and preferences, as a JSON file.
          </Typography>
          <Button
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={18} /> : <DownloadIcon />}
            onClick={handleExportData}
            disabled={isExporting}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Privacy Policy Link */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ShieldIcon color="primary" />
            <Typography variant="h6">Privacy</Typography>
          </Box>
          <Link href="/privacy" passHref legacyBehavior>
            <Button
              component="a"
              variant="text"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              View Privacy Policy
            </Button>
          </Link>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Logout */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Log Out
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Delete Account */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <DeleteIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6" sx={{ color: 'error.main' }}>
              Delete Account
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Delete My Account
          </Button>
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
            setConfirmText('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Your Account?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action is permanent. All your reviews, photos, and data will be
            deleted.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To confirm, type <strong>DELETE</strong> below:
          </Typography>
          <TextField
            fullWidth
            placeholder="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            autoFocus
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setConfirmText('');
            }}
            disabled={isDeleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || isDeleting}
            startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
