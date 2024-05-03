#!/bin/bash

docker build . -t cioraneanu/firefly-x-full:latest
docker save cioraneanu/firefly-x-full:latest | bzip2 | ssh root@192.168.1.33 docker load
ssh root@192.168.1.33 docker-compose -f /home/docker/firefly-x/docker-compose.yml up -d