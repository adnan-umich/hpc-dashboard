"""
GET slurm_greatlakes/_search 
{
  "version": true,
  "size": 10000,
  "sort": [
    {
      "@submit": {
        "order": "desc",
        "unmapped_type": "boolean"
      }
    }
  ],
  "_source": {
    "excludes": []
  },
  "aggs": {
    "2": {
      "date_histogram": {
        "field": "@submit",
        "interval": "30m",
        "time_zone": "America/New_York",
        "min_doc_count": 1
      }
    }
  },
  "stored_fields": [
    "*"
  ],
  "script_fields": {},
  "docvalue_fields": [
    {
      "field": "@eligible",
      "format": "date_time"
    },
    {
      "field": "@end",
      "format": "date_time"
    },
    {
      "field": "@start",
      "format": "date_time"
    },
    {
      "field": "@submit",
      "format": "date_time"
    }
  ],
  "query": {
    "bool": {
      "must": [
        {
          "match_phrase": {
            "account": {
              "query": "hpcstaff"
            }
          }
        },
        {
          "range": {
            "@submit": {
              "gte": "2024-09-22",
              "lte": "2024-09-24",
              "format": "yyyy-MM-dd"
            }
          }
        }
      ]
    }
  }
}
"""

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

def get_begin_date(date):
    return date.split('T')[0]

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
        response = requests.get(api_url, headers=headers, verify=False)  # verify=True to ignore SSL warnings, use cautiously
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()  # Parse the JSON data from the response
            # format elapsed time to DD-HH-MM-S
            if len(data) > 0:
                for job in data:
                    job['elapsed_time'] = get_time_hh_mm_ss(job['elapsed_time'])
                    job['begin_date'] = get_begin_date(job['starttime']) if job['starttime'] is not None else None
                    if job['state'] is None:
                      job['state'] == "None"
                    elif job['state'] == "OUT_OF_MEMORY":
                      job['state'] = 'OOM'
                    elif "CANCELLED" in job['state']:
                      job['state'] = 'CANCELLED'
                return JsonResponse(data, safe=False)  # Return the data as a JSON response
            else:
                return JsonResponse(data, safe=False)  # Return the data as a JSON response
        else:
            _return_response = JsonResponse({'error': 'Failed to fetch data from the SHIM', 
                                             'Response from Shim': response.json()}, status=response.status_code)
            print(_return_response)
            print({'Response from Shim': response.json()})
            return _return_response