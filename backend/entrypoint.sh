#!/bin/sh

python manage.py makemigrations
python manage.py migrate --no-input
python manage.py collectstatic --no-input

gunicorn dashboard.wsgi:application --config=dashboard/gunicorn.conf.py