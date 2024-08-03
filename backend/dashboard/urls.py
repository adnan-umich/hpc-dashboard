"""
URL configuration for dashboard project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path("admin/", admin.site.urls),
    path('fetch-root-accounts/', views.fetch_root_account_from_shim, name='fetch_root_account_from_shim'),
    path('get_partition_stats/<str:cluster>/', views.get_partition_stats, name='get_partition_stats'),
    path('get_squeue/<str:cluster>/<str:account>/', views.get_squeue, name='get_squeue'),
    path('get_active/<str:cluster>/<str:account>/', views.get_active, name='get_active'),
    path('get_my_job_stats/<str:cluster>/<int:jobid>/', views.get_my_job_stats, name='get_my_job_stats'),
    path('get_completed/<str:cluster>/<account>/<starttime>/<endtime>', views.get_completed_jobs, name='get_completed_jobs'),
    path('get_radar/<str:cluster>/<account>/<starttime>/<endtime>', views.get_radar_stats, name='get_radar'),
    path('get_tres/<str:cluster>/<jobid>', views.get_tres, name='get_tres'),
    path('get_seff/<str:cluster>/<jobid>', views.get_seff, name='get_seff'),
    path('get_budget/<str:cluster>/<account>', views.get_budget, name='get_budget'),
    
]
