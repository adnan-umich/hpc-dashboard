import axios from 'axios';
import { apiUrl } from './apiClient';

export const fetchJobTres = async (cluster, jobId, apiBase) => {
    try {
      const response = await axios.get(apiUrl(`/get_tres/${cluster}/${jobId}`, apiBase));
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job tres:', error);
      return 'Failed to fetch job tres';
    }
  };