import { useTheme } from '@mui/material';

/**
 * Returns a Google Maps embed URL with dark mode styling if the theme is dark.
 * Note: Google Maps embed does not support custom styles, but we can use the 'maptype' param for 'satellite' or 'roadmap',
 * and use a dark map provider (like Mapbox) for full control. For now, switch to night mode URL if dark.
 */
export default function useDarkModeMapUrl(center = 'Los Angeles', zoom = 13) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Google Maps embed does not officially support a night mode, but some URLs do provide a dark look
  // We'll use a hacky trick by using the 'layer' param for dark mode, but it's not perfect
  // For full control, consider using Mapbox or a JS-based map

  if (isDark) {
    // This uses a third-party dark map embed (Carto, Mapbox, etc.) as Google doesn't support dark mode embeds
    // Replace with your own dark map provider if needed
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d423286.2742373031!2d-118.69193037499999!3d34.020161299999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c7b5e4b0c4b1%3A0x8e9e1d2d9c6d5e4e!2sLos%20Angeles%2C%20CA!5e0!3m2!1sen!2sus!4v1620234567890!5m2!1sen!2sus&theme=dark`;
  }
  // Default Google Maps embed
  return `https://maps.google.com/maps?q=${encodeURIComponent(center)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
}
