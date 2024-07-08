import requests
from django.http import JsonResponse
from django.shortcuts import render
from dotenv import load_dotenv
import os

# Ensure environment variables are loaded
load_dotenv()

class Partitions:
    def __init__(self):
        return None
    
    @staticmethod
    def fetch_partition_stats(cluster):
        # URL of the external API
        if cluster == "greatlakes":
            api_url = f"{os.getenv('GREATLAKES_API_URL')}/hpc/v0.1/dashboard/partitions" # Future GL Shim
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('GL_SECRET_KEY')
            }
        elif cluster == "armis2":
            api_url = 'https://host.docker.internal:8001/hpc/v0.1/dashboard/partitions' # Future A2 Shim
                        # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('A2_SECRET_KEY')
            }
        elif cluster == "lighthouse":
            api_url = 'https://host.docker.internal:8002/hpc/v0.1/dashboard/partitions' # Future LH Shim
                        # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('LH_SECRET_KEY')
            }

        
        # Make the GET request to the external API
        response = requests.get(api_url, headers=headers, verify=False)  # verify=False to ignore SSL warnings, use cautiously
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()  # Parse the JSON data from the response
            result = {'mixed': {}, 'idle': {}}
            if len(data) > 0:
                # Transform into mixed vs idle comparison
                for item in data:
                    state = item['State']
                    partition = item['Partition']
                    nodes = item['Nodes']

                    if state not in result:
                        continue

                    if partition not in result[state]:
                        result[state][partition] = 0

                    result[state][partition] += nodes

                    # Ensure both 'mixed' and 'idle' have the same partition names
                    mixed_partitions = set(result['mixed'].keys())
                    idle_partitions = set(result['idle'].keys())

                    # Find partitions that are in 'mixed' but not in 'idle' and vice versa
                    mixed_not_in_idle = mixed_partitions - idle_partitions
                    idle_not_in_mixed = idle_partitions - mixed_partitions

                    # Add missing partitions with value 0
                    for partition in mixed_not_in_idle:
                        result['idle'][partition] = 0

                    for partition in idle_not_in_mixed:
                        result['mixed'][partition] = 0

                return JsonResponse(result, safe=False)  # Return the data as a JSON response
            else:
                return JsonResponse(data, safe=False)  # Return the data as a JSON response
        else:
            _return_response = JsonResponse({'error': 'Failed to fetch data from the SHIM', 
                                             'Response from Shim': response.json()}, status=response.status_code)
            print(_return_response)
            print({'Response from Shim': response.json()})
            return _return_response