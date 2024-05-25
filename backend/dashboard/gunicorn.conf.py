"""Production Gunicorn configuration file.
"""
from environs import Env

env = Env()
env.read_env()

bind = env.str("BIND", default="0.0.0.0:8888")

