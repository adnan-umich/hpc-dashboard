import axios from 'axios';

export const fetchJobStats = async (cluster, jobId) => {
    try {
      const response = await axios.get(`http://localhost:8888/get_my_job_stats/${cluster}/${jobId}`);
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return 'Failed to fetch job stats';
    }
  };