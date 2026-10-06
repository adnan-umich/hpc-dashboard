import axios from 'axios';
import { apiUrl } from './apiClient';

// get_job_script/<str:index>/<job_id> [name='get_job_script']
export const fetchJobScript = async (index, jobId, apiBase) => {
    try {
      const response = await axios.get(apiUrl(`/get_job_script/${index}/${jobId}`, apiBase));
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return 'Failed to fetch job stats';
    }
  };