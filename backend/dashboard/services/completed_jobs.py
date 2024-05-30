import requests
import os
from multiprocessing.pool import Pool
from dotenv import load_dotenv
from requests.exceptions import RequestException
from django.http import JsonResponse
from datetime import timedelta


# Ensure environment variables are loaded
load_dotenv()

def get_time_hh_mm_ss(sec):
    td = timedelta(seconds=sec)
    # Extract days, seconds, and microseconds from the timedelta
    days = td.days
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    # Format the output string
    if days > 0:
        return f"{days:2d}-{hours:02d}:{minutes:02d}:{seconds:02d}"
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

class Completed:
    def __init__(self):
        return None
    
    @staticmethod
    def fetch_completed(cluster, account, starttime, endtime):
        # Determine the API URL based on the cluster
        if cluster == "greatlakes":
            api_url = f"{os.getenv('GREATLAKES_API_URL')}/hpc/v0.1/dashboard/CompletedJobs/{account}/{starttime}/{endtime}"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('GL_SECRET_KEY')
            }
        elif cluster == "armis2":
            api_url = f"{os.getenv('ARMIS2_API_URL')}/hpc/v0.1/dashboard/CompletedJobs/{account}/{starttime}/{endtime}"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('A2_SECRET_KEY')
            }
        elif cluster == "lighthouse":
            api_url = f"{os.getenv('LIGHTHOUSE_API_URL')}/hpc/v0.1/dashboard/CompletedJobs/{account}/{starttime}/{endtime}"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('LH_SECRET_KEY')
            }
        else:
            return JsonResponse({'error': 'Invalid cluster'}, status=400)

        # Make the GET request to the external API
        response = requests.get(api_url, headers=headers, verify=False)  # verify=False to ignore SSL warnings, use cautiously
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()  # Parse the JSON data from the response

            # format elapsed time to DD-HH-MM-S
            for job in data:
                job['elapsed_time'] = get_time_hh_mm_ss(job['elapsed_time'])
                if job['state'] == "OUT_OF_MEMORY":
                    job['state'] = 'OOM'
            return JsonResponse(data, safe=False)  # Return the data as a JSON response
        else:
            return JsonResponse({'error': 'Failed to fetch data from the SHIM'}, status=response.status_code)
