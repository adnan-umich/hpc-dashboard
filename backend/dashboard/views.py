import requests
from django.http import JsonResponse
from django.shortcuts import render
from .services.partitions import Partitions
from .services.squeue import Squeue
from .services.squeue_active import Squeue_active
from .services.my_job_statistics import MyJobStatistics
from .services.completed_jobs import Completed
from .services.radar import MyRadar
from .services.get_tres import Tres
from .services.seff import Seff
from .services.budget import Budget


def get_partition_stats(request, cluster='greatlakes'):
    return Partitions.fetch_partition_stats(cluster)

def get_squeue(request, cluster='greatlakes', account=None):
    return Squeue.fetch_squeue(cluster, account)

def get_active(request, cluster='greatlakes', account=None):
    return Squeue_active.fetch_running_jobs(cluster, account)

def get_my_job_stats(request, cluster='greatlakes', jobid=None):
    return MyJobStatistics.get_my_job_statistics(cluster, jobid)

def get_completed_jobs(request, cluster='greatlakes', account=None, starttime=None, endtime=None):
    return Completed.fetch_completed(cluster=cluster, account=account, starttime=starttime, endtime=endtime)

def get_radar_stats(request, cluster='greatlakes', account=None, starttime=None, endtime=None):
    return MyRadar.get_radar(cluster=cluster, account=account, starttime=starttime, endtime=endtime)

def get_tres(request, cluster='greatlakes', jobid=None):
    return Tres.fetch_tres(cluster=cluster, jobid=jobid)

def get_seff(request, cluster='greatlakes', jobid=None):
    return Seff.get_seff(cluster=cluster, jobid=jobid)

def get_budget(request, cluster='greatlakes', account=None):
    return Budget.fetch_budget(cluster=cluster, account=account)

def fetch_root_account_from_shim(request):
    # URL of the external API
    api_url = 'https://localhost:8000/hpc/v0.1/accounts/'

    # Headers including the API key
    headers = {
        'accept': 'application/json',
        'X-API-KEY': 'mysecret'
    }
    
    # Make the GET request to the external API
    response = requests.get(api_url, headers=headers, verify=False)  # verify=False to ignore SSL warnings, use cautiously
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()  # Parse the JSON data from the response
        return JsonResponse(data, safe=False)  # Return the data as a JSON response
    else:
        return JsonResponse({'error': 'Failed to fetch data from the SHIM'}, status=response.status_code)
