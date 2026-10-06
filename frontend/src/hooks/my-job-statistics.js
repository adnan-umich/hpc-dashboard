import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from './apiClient';

export const fetchJobStats = async (cluster, jobId, apiBase) => {
    try {
      const response = await axios.get(apiUrl(`/get_my_job_stats/${cluster}/${jobId}`, apiBase));
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return 'Failed to fetch job stats';
    }
  };

export const parseJobEfficiency = (output) => {
  const report = typeof output === 'string' ? output : output?.report;
  const percentage = (label) => {
    if (typeof report !== 'string') return null;
    const match = report.match(new RegExp(`^\\s*${label} Efficiency:\\s*(\\d+(?:\\.\\d+)?)%`, 'mi'));
    return match ? Number(match[1]) : null;
  };
  const cpu = percentage('CPU');
  const memory = percentage('Memory');
  return { cpu, memory, inefficient: (cpu !== null && cpu < 50) || (memory !== null && memory < 50) };
};

// Fetch in the background with bounded concurrency; ignore stale search results.
export const useJobEfficiency = (cluster, jobs) => {
  const [results, setResults] = useState({ jobs: null, values: {} });
  useEffect(() => {
    let cancelled = false;
    let next = 0;
    const completed = jobs.filter(job => (job.Status ?? job.State) === 'COMPLETED');
    setResults({ jobs, values: {} });
    const worker = async () => {
      while (!cancelled && next < completed.length) {
        const job = completed[next++];
        const efficiency = parseJobEfficiency(await fetchJobStats(cluster, job.id));
        if (!cancelled) {
          setResults(previous => ({ jobs, values: { ...previous.values, [job.id]: efficiency } }));
        }
      }
    };
    for (let i = 0; i < Math.min(4, completed.length); i++) worker();
    return () => { cancelled = true; };
  }, [cluster, jobs]);
  return ({ id }) => results.jobs === jobs && results.values[id]?.inefficient ? 'inefficient-job' : '';
};

export const jobEfficiencyStyles = {
  '& .MuiDataGrid-row.inefficient-job': { backgroundColor: 'rgba(237, 156, 0, 0.18)' },
  '& .MuiDataGrid-row.inefficient-job:hover': { backgroundColor: 'rgba(237, 156, 0, 0.28)' },
  '& .MuiDataGrid-row.inefficient-job.Mui-selected': { backgroundColor: 'rgba(237, 156, 0, 0.32)' },
  '& .MuiDataGrid-row.inefficient-job.Mui-selected:hover': { backgroundColor: 'rgba(237, 156, 0, 0.38)' },
};
