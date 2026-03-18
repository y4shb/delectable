import React, { useState, useRef } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CollectionsIcon from '@mui/icons-material/Collections';
import ExploreIcon from '@mui/icons-material/Explore';
import { useAuth } from '../context/AuthContext';

interface WelcomeSectionProps {
  onTabChange?: (tabValue: string) => void;
}

interface FeedTab {
  id: string;
  label: string;
  value: string;
  ariaControls: string;
  icon: React.ReactElement;
}

const feedTabs: FeedTab[] = [
  {
    id: 'tab-top-picks',
    label: 'Top picks',
    value: 'top-picks',
    ariaControls: 'tabpanel-top-picks',
    icon: <AutoAwesomeIcon fontSize="small" />,
  },
  {
    id: 'tab-recent',
    label: 'Recent',
    value: 'recent',
    ariaControls: 'tabpanel-recent',
    icon: <ScheduleIcon fontSize="small" />,
  },
  {
    id: 'tab-collections',
    label: 'Collections',
    value: 'collections',
    ariaControls: 'tabpanel-collections',
    icon: <CollectionsIcon fontSize="small" />,
  },
  {
    id: 'tab-explore',
    label: 'Explore',
    value: 'explore',
    ariaControls: 'tabpanel-explore',
    icon: <ExploreIcon fontSize="small" />,
  },
];

function WelcomeSection({ onTabChange }: WelcomeSectionProps) {
  const [selectedTab, setSelectedTab] = useState('top-picks');
  const theme = useTheme();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    onTabChange?.(newValue);
  };

  const handleChipClick = (value: string) => {
    const syntheticEvent = {} as React.SyntheticEvent;
    handleTabChange(syntheticEvent, value);
  };

  const isDark = theme.palette.mode === 'dark';

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
            color: theme.palette.primary.main,
            fontSize: '32px',
            lineHeight: 1.2,
            mb: 0.5,
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            letterSpacing: 1,
          }}
        >
          Hi {user?.name?.split(' ')[0] || 'there'}!
        </Typography>
      </Box>

      {/* Pill-shaped Chip Tabs with fade edges */}
      <Box
        id="feed-tabs"
        role="tablist"
        aria-label="Feed navigation tabs"
        sx={{ mb: 2, position: 'relative' }}
      >
        <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            maskImage: `linear-gradient(
              to right,
              transparent 0%,
              black 3%,
              black 97%,
              transparent 100%
            )`,
            WebkitMaskImage: `linear-gradient(
              to right,
              transparent 0%,
              black 3%,
              black 97%,
              transparent 100%
            )`,
            px: 0.5,
            pb: 0.5,
            /* Hide scrollbar across browsers */
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {feedTabs.map((tab) => {
            const isSelected = selectedTab === tab.value;

            return (
              <Chip
                key={tab.value}
                id={tab.id}
                role="tab"
                aria-selected={isSelected}
                aria-controls={tab.ariaControls}
                tabIndex={isSelected ? 0 : -1}
                icon={tab.icon}
                label={tab.label}
                clickable
                onClick={() => handleChipClick(tab.value)}
                sx={{
                  borderRadius: '20px',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: '14px',
                  letterSpacing: '0.01em',
                  px: 1.5,
                  py: 2.5,
                  transition: 'all 0.2s ease-in-out',
                  flexShrink: 0,
                  border: 'none',
                  ...(isSelected
                    ? {
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(242, 77, 79, 0.35)',
                        '& .MuiChip-icon': {
                          color: '#fff',
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark || '#d93e40',
                          boxShadow: '0 4px 16px rgba(242, 77, 79, 0.45)',
                        },
                        '&:focus-visible': {
                          backgroundColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 3px rgba(242, 77, 79, 0.4), 0 4px 12px rgba(242, 77, 79, 0.35)`,
                        },
                      }
                    : {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                        color: theme.palette.text.secondary,
                        boxShadow: 'none',
                        '& .MuiChip-icon': {
                          color: theme.palette.text.secondary,
                        },
                        '&:hover': {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.14)'
                            : 'rgba(0, 0, 0, 0.09)',
                        },
                        '&:focus-visible': {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.14)'
                            : 'rgba(0, 0, 0, 0.09)',
                          boxShadow: `0 0 0 3px ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                        },
                      }),
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(WelcomeSection);
