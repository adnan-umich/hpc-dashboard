import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
import { Stack, Typography } from '@mui/material';

const PartitionStats = ({ clusterName }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the API
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
      const partitionsSet = new Set();
      const idleData = [];
      const mixedData = [];

      // Extract partition names and values
      for (const key in jsonData.idle) {
        partitionsSet.add(key);
        idleData.push({ partition: key, idle: jsonData.idle[key] });
      }

      for (const key in jsonData.mixed) {
        partitionsSet.add(key);
        mixedData.push({ partition: key, mixed: jsonData.mixed[key] });
      }

      const partitionsArray = Array.from(partitionsSet);

      // Combine data for the BarChart
      const combinedData = partitionsArray.map((partition) => ({
        partition,
        idle: idleData.find((item) => item.partition === partition)?.idle || 0,
        mixed: mixedData.find((item) => item.partition === partition)?.mixed || 0,
      }));

      setData(combinedData);
    };

    fetchData();
  }, [clusterName]);

  return (
    <Stack>
    <Typography variant="h6" sx={{ marginBottom: '1em', fontWeight: 'bold' }}>
    Node Availability
    </Typography>
    <ResponsiveContainer width={650} height={350}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="partition" 
          angle={-90} 
          textAnchor="end" 
          dx={-5}
          interval={0}
          fontSize={12}
        />
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 20 }} />
        <Bar dataKey="idle" stackId="stack1" fill="#8884d8" />
        <Bar dataKey="mixed" stackId="stack1" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
    </Stack>
  );
};

export default PartitionStats;
