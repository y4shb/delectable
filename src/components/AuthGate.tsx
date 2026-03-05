import { useState, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

interface AuthGateProps {
  children: ReactNode;
  /** What action the user is trying to perform (shown in prompt) */
  action?: string;
  /** If true, don't wrap children, just conditionally render */
  inline?: boolean;
}

/**
 * AuthGate wraps interactive elements that require authentication.
 *
 * For anonymous users, clicking triggers a sign-up prompt instead of the action.
 * For authenticated users, children render and behave normally.
 *
 * Usage:
 * <AuthGate action="like this review">
 *   <IconButton onClick={handleLike}>...</IconButton>
 * </AuthGate>
 */
export default function AuthGate({
  children,
  action = 'do this',
  inline = false,
}: AuthGateProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPrompt(true);
  };

  const handleSignUp = () => {
    setShowPrompt(false);
    router.push('/login?redirect=' + encodeURIComponent(router.asPath));
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (inline) {
    return (
      <>
        <Box
          onClick={handleClick}
          sx={{ cursor: 'pointer', display: 'inline-block' }}
        >
          {children}
        </Box>
        <AuthPromptDialog
          open={showPrompt}
          action={action}
          onSignUp={handleSignUp}
          onClose={handleClose}
        />
      </>
    );
  }

  return (
    <>
      <Box onClick={handleClick} sx={{ cursor: 'pointer' }}>
        {children}
      </Box>
      <AuthPromptDialog
        open={showPrompt}
        action={action}
        onSignUp={handleSignUp}
        onClose={handleClose}
      />
    </>
  );
}

interface AuthPromptDialogProps {
  open: boolean;
  action: string;
  onSignUp: () => void;
  onClose: () => void;
}

function AuthPromptDialog({
  open,
  action,
  onSignUp,
  onClose,
}: AuthPromptDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          maxWidth: 340,
          p: 1,
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Typography
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            color: theme.palette.primary.main,
            fontSize: 32,
            mb: 1,
          }}
        >
          de.
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1 }}>
          Join to {action}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
          Create an account to save your favorites, follow tastemakers, and share your discoveries.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={onSignUp}
          sx={{
            py: 1.5,
            borderRadius: '48px',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: 16,
            mb: 1.5,
          }}
        >
          Sign Up
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={onClose}
          sx={{
            py: 1,
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: 14,
          }}
        >
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
}
