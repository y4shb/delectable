import { createTheme, Theme } from '@mui/material/styles';

const commonTheme = {
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 20,
  },
};

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#F24D4F', // peach accent
      },
      secondary: {
        main: '#FFD36E', // yellow accent
      },
      background: {
        default: mode === 'dark' ? '#181818' : '#faf9f6',
        paper: mode === 'dark' ? '#232323' : '#fff',
      },
      text: {
        primary: mode === 'dark' ? '#fff' : '#181818',
        secondary: mode === 'dark' ? '#bdbdbd' : '#595959',
      },
    },
    ...commonTheme,
  });

const theme = getTheme('light');
export default theme;
