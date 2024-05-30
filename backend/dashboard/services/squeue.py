import requests
import os
from dotenv import load_dotenv
from requests.exceptions import RequestException
from django.http import JsonResponse

# Ensure environment variables are loaded
load_dotenv()

class Squeue:
    def __init__(self):
        return None

    @staticmethod
    def fetch_squeue(cluster, account):
        # Determine the API URL based on the cluster
        if cluster == "greatlakes":
            api_url = f"{os.getenv('GREATLAKES_API_URL')}/hpc/v0.1/accounts/subaccount/{account}/squeue"
        elif cluster == "armis2":
            api_url = f"{os.getenv('ARMIS2_API_URL')}/hpc/v0.1/accounts/subaccount/{account}/squeue"
        elif cluster == "lighthouse":
            api_url = f"{os.getenv('LIGHTHOUSE_API_URL')}/hpc/v0.1/accounts/subaccount/{account}/squeue"
        else:
            return JsonResponse({'error': 'Invalid cluster'}, status=400)

        # Headers including the API key
        headers = {
            'accept': 'application/json',
            'X-API-KEY': "mysecret"
        }

        # Make the GET request to the external API
        response = requests.get(api_url, headers=headers, verify=False)  # verify=False to ignore SSL warnings, use cautiously
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()  # Parse the JSON data from the response
            data_queued = [x for x in data if (x['state'] != "RUNNING" and x['state'] != "COMPLETING")]
            return JsonResponse(data_queued, safe=False)  # Return the data as a JSON response
        else:
            return JsonResponse({'error': 'Failed to fetch data from the SHIM'}, status=response.status_code)
