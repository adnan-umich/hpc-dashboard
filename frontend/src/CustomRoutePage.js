import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Paper, Typography } from '@mui/material';
import { ConfigProvider, useConfig } from './hooks/ConfigContext';

const CustomRouteContent = () => {
  const location = useLocation();
  const { config } = useConfig();
  const normalizePath = (path) => path.replace(/\/+$/, '') || '/';
  const page = config.customRoutes.find((route) => normalizePath(route.path) === normalizePath(location.pathname));

  if (!page) return <Navigate to="/" replace />;

  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Paper square sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1 }}>
          <Button component={Link} to="/">Dashboard</Button>
          <Typography component="h1" variant="h6" sx={{ flex: 1 }}>{page.label}</Typography>
          <Button component="a" href={page.url} target="_blank" rel="noopener noreferrer">Open directly</Button>
        </Box>
        <Box
          component="iframe"
          src={page.url}
          title={page.label}
          sx={{ border: 0, flex: 1, width: '100%' }}
        />
      </Paper>
    </Box>
  );
};

const CustomRoutePage = () => (
  <ConfigProvider>
    <CustomRouteContent />
  </ConfigProvider>
);

export default CustomRoutePage;
