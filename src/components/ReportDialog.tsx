import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { reportContent } from '../api/api';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  contentType: 'review' | 'comment' | 'user' | 'photo';
  contentId: string;
  onSuccess?: () => void;
}

const REPORT_TYPES = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'false_info', label: 'False Information' },
  { value: 'copyright', label: 'Copyright Violation' },
  { value: 'other', label: 'Other' },
] as const;

function ReportDialog({
  open,
  onClose,
  contentType,
  contentId,
  onSuccess,
}: ReportDialogProps) {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      reportContent({
        reportType,
        contentType,
        contentId,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setReportType('');
    setReason('');
    setSubmitted(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!reportType) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="report-dialog-title"
    >
      <DialogTitle id="report-dialog-title">Report Content</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Typography sx={{ py: 2 }}>
            Report submitted. Thank you for helping keep our community safe.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Why are you reporting this content?
            </Typography>
            <RadioGroup
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((type) => (
                <FormControlLabel
                  key={type.value}
                  value={type.value}
                  control={<Radio />}
                  label={type.label}
                />
              ))}
            </RadioGroup>
            <TextField
              label="Additional details (optional)"
              multiline
              rows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              helperText={`${reason.length}/500`}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 500 }}
            />
            {mutation.isError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {(mutation.error as Error)?.message?.includes('409') ||
                (mutation.error as Error)?.message?.includes('unique')
                  ? 'You have already reported this content.'
                  : 'Failed to submit report. Please try again.'}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {submitted ? (
          <Button onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="error"
              disabled={!reportType || mutation.isPending}
            >
              {mutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Submit Report'
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ReportDialog;
