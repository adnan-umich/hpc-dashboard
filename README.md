### 
Create ssh tunnel to gl/lh/a2-build for Shim
Port 8000 for gl-build
Port 8001 for a2-build
Port 8002 for lh-build

### Setup Docker
$ docker network create hpc-dashboard
$ docker-compose up --build