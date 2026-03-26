import React, { useState } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CollectionsIcon from '@mui/icons-material/Collections';
import ExploreIcon from '@mui/icons-material/Explore';
import { useAuth } from '../context/AuthContext';

interface WelcomeSectionProps {
  onTabChange?: (tabValue: string) => void;
}

const feedTabs = [
  { id: 'tab-top-picks', label: 'Top picks', value: 'top-picks', ariaControls: 'tabpanel-top-picks', icon: <AutoAwesomeIcon sx={{ fontSize: 16 }} /> },
  { id: 'tab-recent', label: 'Recent', value: 'recent', ariaControls: 'tabpanel-recent', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> },
  { id: 'tab-collections', label: 'Collections', value: 'collections', ariaControls: 'tabpanel-collections', icon: <CollectionsIcon sx={{ fontSize: 16 }} /> },
  { id: 'tab-explore', label: 'Explore', value: 'explore', ariaControls: 'tabpanel-explore', icon: <ExploreIcon sx={{ fontSize: 16 }} /> },
];

function WelcomeSection({ onTabChange }: WelcomeSectionProps) {
  const [selectedTab, setSelectedTab] = useState('top-picks');
  const theme = useTheme();
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const handleChipClick = (value: string) => {
    setSelectedTab(value);
    onTabChange?.(value);
  };

  return (
    <Box sx={{ width: '100%', pt: 2, pb: 0.5 }}>
      {/* Welcome Text */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.main,
            fontSize: '28px',
            lineHeight: 1.2,
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            letterSpacing: 1,
          }}
        >
          Hi {user?.name?.split(' ')[0] || 'there'}!
        </Typography>
      </Box>

      {/* Tab chips — scroll container extends full width, content padded */}
      <Box
        id="feed-tabs"
        role="tablist"
        aria-label="Feed navigation tabs"
        sx={{
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          px: 2,
          pb: 1,
          mb: 1,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
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
                borderRadius: '18px',
                fontFamily: '"Inter", sans-serif',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '13px',
                px: 1,
                height: 34,
                flexShrink: 0,
                border: 'none',
                transition: 'all 0.15s ease',
                ...(isSelected
                  ? {
                      backgroundColor: theme.palette.primary.main,
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(242, 77, 79, 0.3)',
                      '& .MuiChip-icon': { color: '#fff' },
                      '&:hover': { backgroundColor: theme.palette.primary.dark || '#d93e40' },
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      color: theme.palette.text.secondary,
                      '& .MuiChip-icon': { color: theme.palette.text.secondary },
                      '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                    }),
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
export default React.memo(WelcomeSection);
