import requests
import os
from dotenv import load_dotenv
from django.http import JsonResponse


# Ensure environment variables are loaded
load_dotenv()

class GetJobScript:
    def __init__(self):
        return None
    
    @staticmethod
    def fetch_script(index="slurm_greatlakes", job_id=int) -> dict:

        # Elasticsearch Query
        query = {
            "_source": ["script"],  # Fetch only the 'script' field
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"jobid": {"query": job_id}}}
                    ]
                }
            }
        }
        # Determine the API URL based on the cluster
        if index == "slurm_greatlakes":
            ES_HOST = "https://es.arc-ts.umich.edu"
            # Headers including the API key
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('ES_API_KEY')}"  # Ensure ES_API_KEY is set in .env
            }

        elif index == "slurm_lighthouse":
            ES_HOST = "https://es.arc-ts.umich.edu"
            # Headers including the API key
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('ES_API_KEY')}"  # Ensure ES_API_KEY is set in .env
            }

        else:
            return JsonResponse({'error': 'Invalid cluster'}, status=400)

            # Elasticsearch Search Endpoint
        url = f"{ES_HOST}/{index}/_search"

        # Send request
        try:
            response = requests.get(url, headers=headers, json=query, verify=False)  # verify=False to ignore SSL warnings
            response.raise_for_status()  # Raise exception for HTTP errors
            data = response.json()
            return JsonResponse(data['hits']['hits'][0]["_source"]["script"], safe=False)  # Return the data as a JSON response

        except requests.exceptions.RequestException as e:
            print(f"Error querying Elasticsearch: {e}")
