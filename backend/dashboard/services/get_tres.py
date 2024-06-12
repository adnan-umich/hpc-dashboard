import requests
import os
from multiprocessing.pool import Pool
from dotenv import load_dotenv
from requests.exceptions import RequestException
from django.http import JsonResponse
from datetime import timedelta


# Ensure environment variables are loaded
load_dotenv()

class Tres:
    def __init__(self):
        return None
    
    @staticmethod
    def fetch_tres(cluster, jobid):
        # Determine the API URL based on the cluster
        if cluster == "greatlakes":
            api_url = f"{os.getenv('GREATLAKES_API_URL')}/hpc/v0.1/dashboard/TRES/{jobid}"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('GL_SECRET_KEY')
            }
        elif cluster == "armis2":
            api_url = f"{os.getenv('ARMIS2_API_URL')}/hpc/v0.1/dashboard/TRES/{jobid}"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('A2_SECRET_KEY')
            }
        elif cluster == "lighthouse":
            api_url = f"{os.getenv('LIGHTHOUSE_API_URL')}/hpc/v0.1/dashboard/TRES/{jobid}"
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

            def parse_item(data):
                # Split the item by the pipe character
                parts = data.split('|')
                # Initialize the result list for dictionaries
                dicts = []
                # Process each part
                for part in parts:
                    if part:  # Only process non-empty parts
                        # Split the part by comma to get key-value pairs
                        kv_pairs = part.split(',')
                        # Create a dictionary from the key-value pairs
                        d = {}
                        for kv in kv_pairs:
                            key, value = kv.split('=')
                            d[key] = value
                        dicts.append(d)
                return dicts

            # Process each item in the data list
            result = [parse_item(data) for data in data]

            # Flatten the list of lists
            final_result = [d for sublist in result for d in sublist]
                                
            return JsonResponse(final_result, safe=False)  # Return the data as a JSON response
        else:
            return JsonResponse({'error': 'Failed to fetch data from the SHIM'}, status=response.status_code)
