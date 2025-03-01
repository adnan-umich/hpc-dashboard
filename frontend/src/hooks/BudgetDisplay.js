import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Box, Container, Typography, CircularProgress } from '@mui/material';

const fetchBudget = async (cluster, account) => {
  try {
    const response = await axios.get(`http://localhost:8888/get_budget/${cluster}/${account}`);
    return response.data; // Adjust as necessary based on the API response format
  } catch (error) {
    console.error('Error fetching account budget:', error);
    return 'Failed to obtain account budget';
  }
};

const BudgetDisplay = ({ cluster, account }) => {
  const [budgetData, setBudgetData] = useState(null);

  useEffect(() => {
    const getBudget = async () => {
      const data = await fetchBudget(cluster, account);
      setBudgetData(data);
    };
    getBudget();
  }, [cluster, account]);
  

  if (budgetData === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <CircularProgress />
      </Box>
    );
  }

  if (typeof budgetData === 'string') {
    return <Typography>{budgetData}</Typography>; // In case of error message
  }

  const getBackgroundColor = (value) => {
    if (value < 50) return '#ffcccc'; // light red
    if (value < 3000) return '#ffebcc'; // light orange
    return '#e6ffcc'; // light green
  };

  return (
        <Container sx={{ marginTop: '1em' }}>
          {Object.entries(budgetData).map(([key, value]) => (
            <Box
              key={key}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0.5em 0',
                padding: '0.5em 1em',
                backgroundColor: getBackgroundColor(value),
                borderRadius: '4px'
              }}
            >
              <Typography sx={{ textTransform: 'capitalize', color: '#777', fontSize: '1em', padding: '0 2em 0 0' }}>{key}</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1.5em', color: '#222' }}>{value}</Typography>
            </Box>
          ))}
        </Container>
  );
};

export default BudgetDisplay;
