import axios from 'axios';

// get_job_script/<str:index>/<job_id> [name='get_job_script']
export const fetchJobScript = async (index, jobId) => {
    try {
      const response = await axios.get(`http://localhost:8888/get_job_script/${index}/${jobId}`);
      return response.data; // Adjust as necessary based on the API response format
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return 'Failed to fetch job stats';
    }
  };