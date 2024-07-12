import requests
import os
from multiprocessing.pool import Pool
from dotenv import load_dotenv
from django.http import JsonResponse


# Ensure environment variables are loaded
load_dotenv()

class Budget:
    def __init__(self):
        return None
    
    @staticmethod
    def fetch_budget(cluster, account):
        # Determine the API URL based on the cluster
        if cluster == "greatlakes":
            api_url = f"{os.getenv('GREATLAKES_API_URL')}/hpc/v0.1/accounts/{account}/budget"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('GL_SECRET_KEY')
            }
        elif cluster == "armis2":
            api_url = f"{os.getenv('ARMIS2_API_URL')}/hpc/v0.1/accounts/{account}/budget"
            # Headers including the API key
            headers = {
                'accept': 'application/json',
                'X-API-KEY': os.getenv('A2_SECRET_KEY')
            }
        elif cluster == "lighthouse":
            api_url = f"{os.getenv('LIGHTHOUSE_API_URL')}/hpc/v0.1/accounts/{account}/budget"
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
            if len(data) > 0:
                if len(data[0]["unithours"]) > 0:
                    return JsonResponse(data[0]["unithours"], safe=False)  # Return the data as a JSON response
                else:
                    return JsonResponse("Budget Not Available", safe=False)
            else:
                return JsonResponse(data, safe=False)  # Return the data as a JSON response
        else:
            _return_response = JsonResponse({'error': 'Failed to fetch data from the SHIM', 
                                             'Response from Shim': response.json()}, status=response.status_code)
            print(_return_response)
            print({'Response from Shim': response.json()})
            return _return_response