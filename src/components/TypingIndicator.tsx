'use client';

import { Box, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
`;

export default function TypingIndicator() {
  const dotStyle = {
    width: 6,
    height: 6,
    backgroundColor: 'text.secondary',
    borderRadius: '50%',
    display: 'inline-block',
    animation: `${bounce} 1.4s infinite ease-in-out both`,
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 1.5,
          px: 2,
          boxShadow: 1,
          display: 'flex',
          gap: 0.8,
          alignItems: 'center',
          height: 36,
        }}
      >
        <Box sx={{ ...dotStyle, animationDelay: '-0.32s' }} />
        <Box sx={{ ...dotStyle, animationDelay: '-0.16s' }} />
        <Box sx={dotStyle} />
      </Box>
    </Box>
  );
}
