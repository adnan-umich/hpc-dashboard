import axios from 'axios';

export const fetchJobTres = async (cluster, jobId) => {
    try {
      const response = await axios.get(`http://localhost:8888/get_tres/${cluster}/${jobId}`);
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job tres:', error);
      return 'Failed to fetch job tres';
    }
  };