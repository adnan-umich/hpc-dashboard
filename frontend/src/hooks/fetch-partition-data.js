import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart } from '@mui/x-charts/BarChart';
import { Stack, Typography } from '@mui/material';

const PartitionStats = ({ clusterName }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:8888/get_partition_stats/${clusterName}`);
        const json = response.data;
        processChartData(json);
      } catch (error) {
        console.error('Error fetching the data', error);
      }
    };

    const processChartData = (jsonData) => {
      const partitionsSet = new Set([
        ...Object.keys(jsonData.idle || {}),
        ...Object.keys(jsonData.mixed || {}),
      ]);
      const partitionsArray = Array.from(partitionsSet);

      setChartData({
        partitions: partitionsArray,
        idle: partitionsArray.map((p) => jsonData.idle?.[p] || 0),
        mixed: partitionsArray.map((p) => jsonData.mixed?.[p] || 0),
      });
    };

    fetchData();
  }, [clusterName]);

  return (
    <Stack>
      <Typography variant="h6" sx={{ marginBottom: '1em', fontWeight: 'bold' }}>
        Node Availability
      </Typography>
      {chartData && chartData.partitions.length > 0 && (
        <>
          <BarChart
            width={650}
            height={350}
            xAxis={[{
              data: chartData.partitions,
              scaleType: 'band',
              tickLabelStyle: { angle: -90, textAnchor: 'end', fontSize: 12 },
            }]}
            series={[
              { data: chartData.idle, label: 'idle', stack: 'stack1', color: '#8884d8' },
              { data: chartData.mixed, label: 'mixed', stack: 'stack1', color: '#82ca9d' },
            ]}
            margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
          />
          
        </>
      )}
    </Stack>
  );
};

export default PartitionStats;