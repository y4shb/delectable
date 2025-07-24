import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs, useTheme } from '@mui/material';

interface WelcomeSectionProps {
  onTabChange?: (tabValue: string) => void;
}

export default function WelcomeSection({ onTabChange }: WelcomeSectionProps) {
  const [selectedTab, setSelectedTab] = useState('top-picks');
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    onTabChange?.(newValue);
  };

  return (
    <Box
      sx={{
        width: '100%',
        px: 2,
        pt: 2,
        pb: 1,
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Welcome Text */}
      <Box sx={{ mb: 3, textAlign: 'left' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 500,
            // color: theme.palette.text.primary,
            color: theme.palette.primary.main,
            fontSize: '32px',
            lineHeight: 1.2,
            mb: 0.5,
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            letterSpacing: 1,
          }}
        >
          Hi Yash!
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          id="feed-tabs"
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Feed navigation tabs"
          sx={{
            '& .MuiTabs-indicator': {
              display: 'none', // Hide the default indicator
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              color: theme.palette.text.secondary,
              minWidth: 'auto',
              px: 3,
              py: 1.5,
              mx: 0.5,
              borderRadius: 6,
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                color: '#fff',
                fontWeight: 700,
                backgroundColor: theme.palette.primary.main, // Peach color
                boxShadow: '0 2px 8px rgba(242, 77, 79, 0.3)',
              },
              '&:active, &.Mui-focusVisible': {
                color: '#fff',
                fontWeight: 700,
                backgroundColor: theme.palette.primary.main, // Same as selected state
                boxShadow: '0 2px 8px rgba(242, 77, 79, 0.3)',
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
              '&:hover.Mui-selected, &:active': {
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
              },
            },
            '& .MuiTabs-scrollButtons': {
              color: theme.palette.text.secondary,
            },
          }}
        >
          <Tab id="tab-top-picks" label="Top picks" value="top-picks" aria-controls="tabpanel-top-picks" />
          <Tab id="tab-recent" label="Recent" value="recent" aria-controls="tabpanel-recent" />
          <Tab id="tab-collections" label="Collections" value="collections" aria-controls="tabpanel-collections" />
          <Tab id="tab-explore" label="Explore" value="explore" aria-controls="tabpanel-explore" />
        </Tabs>
      </Box>
    </Box>
  );
}
