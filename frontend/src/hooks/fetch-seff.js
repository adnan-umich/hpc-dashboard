import axios from 'axios';

export const fetchSeff = async (cluster, jobId) => {
    try {
      const response = await axios.get(`http://localhost:8888/get_seff/${cluster}/${jobId}`);
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job seff:', error);
      return 'Failed to fetch job seff';
    }
  };