import React from 'react';
import Box from '@mui/material/Box';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = ({ data, themeOptions }) => {
  const defaultOptions = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
      }
    },
    plugins: {
      legend: false
    }
  };

  const combinedOptions = {
    ...defaultOptions,
    ...themeOptions,
    scales: {
      r: {
        ...defaultOptions.scales.r,
        ...(themeOptions.scales ? themeOptions.scales.r : {}),
      }
    },
    plugins: {
      ...defaultOptions.plugins,
      ...(themeOptions.plugins ? themeOptions.plugins : {}),
    }
  };

  return (
      <Radar data={data} options={combinedOptions} 
      sx={{
        maxWidth: '600px',
        maxHeight: '600px',
      }}
      />
  );
};

export default RadarChart;
