// src/RadarChart.js
import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = ({ data }) => {
  const chartData = {
    labels: ["standard", "largemem", "gpu", "spgpu", "spgpu2", "gpu_mig40", "viz", "build"],
    datasets: data.map(user => ({
      label: user.label,
      data: user.data,
      backgroundColor: 'rgba(34, 202, 236, .2)',
      borderColor: 'rgba(34, 202, 236, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(34, 202, 236, 1)'
    }))
  };

  const options = {
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

  return <Radar data={chartData} options={options} />;
};

export default RadarChart;
