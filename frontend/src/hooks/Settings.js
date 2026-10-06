import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { useConfig } from './ConfigContext';
import { DEFAULT_CONFIG } from './config';

const COLUMN_FIELDS = {
  active: [
    { key: 'status', label: 'Status' },
    { key: 'user', label: 'User' },
    { key: 'name', label: 'Job Name' },
    { key: 'partition', label: 'Partition' },
    { key: 'nodes', label: 'Node(s)' },
    { key: 'cpus', label: 'CPU(s)' },
    { key: 'memory', label: 'Memory' },
    { key: 'timeleft', label: 'Time Left' },
  ],
  pending: [
    { key: 'status', label: 'Status' },
    { key: 'user', label: 'User' },
    { key: 'name', label: 'Job Name' },
    { key: 'partition', label: 'Partition' },
    { key: 'nodes', label: 'Node(s)' },
    { key: 'cpus', label: 'CPU(s)' },
    { key: 'memory', label: 'Memory' },
    { key: 'timeleft', label: 'Alloc Time' },
  ],
  completed: [
    { key: 'status', label: 'Status' },
    { key: 'user', label: 'User' },
    { key: 'name', label: 'Job Name' },
    { key: 'partition', label: 'Partition' },
    { key: 'nodes', label: 'Node(s)' },
    { key: 'cpus', label: 'CPU(s)' },
    { key: 'memory', label: 'Memory' },
    { key: 'elapsed', label: 'Elapsed Time' },
    { key: 'begin', label: 'Begin Date' },
  ],
};

const TABLE_LABELS = { active: 'Active Jobs', pending: 'Pending Jobs', completed: 'Completed Jobs' };

const BACKGROUND_PRESETS = ['#f0f2f5', '#00274C', '#1b1b1b', '#e8f5e9', '#fff3e0'];

const Settings = ({ open, onClose }) => {
  const { config, updateConfig } = useConfig();
  const [apiBaseUrlDraft, setApiBaseUrlDraft] = useState(config.apiBaseUrl);
  const [newPage, setNewPage] = useState({ label: '', host: '', port: '', clusterKey: '' });
  const [newRoute, setNewRoute] = useState({ label: '', path: '', url: '' });
  const fileInputRef = useRef(null);

  const handleApiSave = () => {
    updateConfig((prev) => ({ ...prev, apiBaseUrl: apiBaseUrlDraft.trim() || DEFAULT_CONFIG.apiBaseUrl }));
  };

  const handleBackgroundTypeChange = (event) => {
    updateConfig((prev) => ({ ...prev, background: { ...prev.background, type: event.target.value } }));
  };

  const handleBackgroundColorChange = (color) => {
    updateConfig((prev) => ({ ...prev, background: { ...prev.background, type: 'color', color } }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateConfig((prev) => ({ ...prev, background: { ...prev.background, type: 'image', image: reader.result } }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updateConfig((prev) => ({ ...prev, background: { ...prev.background, type: 'none', image: null } }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleColumnToggle = (tableType, key) => {
    updateConfig((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [tableType]: { ...prev.columns[tableType], [key]: !(prev.columns[tableType]?.[key] !== false) },
      },
    }));
  };

  const handleAddPage = () => {
    if (!newPage.host || !newPage.port) return;
    const id = `custom-${Date.now()}`;
    const page = {
      id,
      label: newPage.label.trim() || `${newPage.host}:${newPage.port}`,
      host: newPage.host.trim(),
      port: newPage.port.trim(),
      clusterKey: newPage.clusterKey.trim() || 'default',
    };
    updateConfig((prev) => ({ ...prev, customPages: [...prev.customPages, page] }));
    setNewPage({ label: '', host: '', port: '', clusterKey: '' });
  };

  const handleRemovePage = (id) => {
    updateConfig((prev) => ({ ...prev, customPages: prev.customPages.filter((p) => p.id !== id) }));
  };

  const handleAddRoute = () => {
    const path = newRoute.path.trim().startsWith('/') ? newRoute.path.trim() : `/${newRoute.path.trim()}`;
    const url = newRoute.url.trim();
    if (!path || path === '/' || !url || config.customRoutes.some((route) => route.path === path)) return;
    const route = { id: `route-${Date.now()}`, label: newRoute.label.trim() || path, path, url };
    updateConfig((prev) => ({ ...prev, customRoutes: [...prev.customRoutes, route] }));
    setNewRoute({ label: '', path: '', url: '' });
  };

  const handleRemoveRoute = (id) => {
    updateConfig((prev) => ({ ...prev, customRoutes: prev.customRoutes.filter((route) => route.id !== id) }));
  };

  const handleResetAll = () => {
    updateConfig(() => DEFAULT_CONFIG);
    setApiBaseUrlDraft(DEFAULT_CONFIG.apiBaseUrl);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configuration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4}>
          {/* API endpoint */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>API Endpoint</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Base URL used for requests to the Great Lakes / Armis2 / Lighthouse dashboards (e.g. your local backend).
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                label="API Base URL"
                placeholder="http://localhost:8888"
                value={apiBaseUrlDraft}
                onChange={(e) => setApiBaseUrlDraft(e.target.value)}
              />
              <Button variant="contained" onClick={handleApiSave}>Save</Button>
            </Stack>
          </Box>

          <Divider />

          {/* Custom URL routes */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Custom Pages (by URL)</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Add a route such as /shim2 that displays another local page or an external dashboard.
            </Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Page Name" value={newRoute.label} onChange={(e) => setNewRoute({ ...newRoute, label: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Path" placeholder="/my-page" value={newRoute.path} onChange={(e) => setNewRoute({ ...newRoute, path: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Page URL" placeholder="/shim" value={newRoute.url} onChange={(e) => setNewRoute({ ...newRoute, url: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="contained" onClick={handleAddRoute} disabled={!newRoute.path.trim() || !newRoute.url.trim()}>Add Page</Button>
              </Grid>
            </Grid>

            {config.customRoutes.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {config.customRoutes.map((route) => (
                  <Chip
                    key={route.id}
                    label={`${route.label} (${route.path})`}
                    component={Link}
                    to={route.path}
                    clickable
                    onDelete={() => handleRemoveRoute(route.id)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Background */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Background</Typography>
            <RadioGroup row value={config.background.type} onChange={handleBackgroundTypeChange}>
              <FormControlLabel value="none" control={<Radio />} label="Default" />
              <FormControlLabel value="color" control={<Radio />} label="Color" />
              <FormControlLabel value="image" control={<Radio />} label="Image" />
            </RadioGroup>

            {config.background.type === 'color' && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <input
                  type="color"
                  value={config.background.color}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  style={{ width: 40, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                {BACKGROUND_PRESETS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleBackgroundColorChange(color)}
                    sx={{
                      width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                      border: config.background.color === color ? '2px solid #1976d2' : '1px solid #ccc',
                    }}
                  />
                ))}
              </Stack>
            )}

            {config.background.type === 'image' && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload Image
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </Button>
                {config.background.image && (
                  <>
                    <Box component="img" src={config.background.image} alt="background preview" sx={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 1 }} />
                    <IconButton size="small" onClick={handleRemoveImage}><DeleteIcon fontSize="small" /></IconButton>
                  </>
                )}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Column visibility */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Table Columns</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose which columns appear in each job table.
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(COLUMN_FIELDS).map((tableType) => (
                <Grid item xs={12} sm={4} key={tableType}>
                  <Typography variant="body2" fontWeight="bold">{TABLE_LABELS[tableType]}</Typography>
                  <Stack>
                    {COLUMN_FIELDS[tableType].map(({ key, label }) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            size="small"
                            checked={config.columns[tableType]?.[key] !== false}
                            onChange={() => handleColumnToggle(tableType, key)}
                          />
                        }
                        label={label}
                      />
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* Dynamic pages */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Dynamic Pages (by IP / Port)</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Add a dashboard page that talks to a different backend instance running the same API.
            </Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Page Name" value={newPage.label} onChange={(e) => setNewPage({ ...newPage, label: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField size="small" fullWidth label="IP / Host" value={newPage.host} onChange={(e) => setNewPage({ ...newPage, host: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField size="small" fullWidth label="Port" value={newPage.port} onChange={(e) => setNewPage({ ...newPage, port: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField size="small" fullWidth label="Cluster Key" value={newPage.clusterKey} onChange={(e) => setNewPage({ ...newPage, clusterKey: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button fullWidth variant="contained" onClick={handleAddPage} disabled={!newPage.host || !newPage.port}>Add Page</Button>
              </Grid>
            </Grid>

            {config.customPages.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {config.customPages.map((page) => (
                  <Chip
                    key={page.id}
                    label={`${page.label} (${page.host}:${page.port})`}
                    onDelete={() => handleRemovePage(page.id)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Tooltip title="Reset all configuration to defaults">
          <Button startIcon={<SettingsBackupRestoreIcon />} color="warning" onClick={handleResetAll}>Reset to Defaults</Button>
        </Tooltip>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Settings;
