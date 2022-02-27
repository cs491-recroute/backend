This repository contains backend microservices for the Recroute project

**yarn** needs to be installed in order to work with this repository

You can start a specific microservice with `yarn startService SERVICE_NAME`
SERVICE_NAME must match with a folder name in the services folder

Also, you can start all the microservices with `yarn startAll` command

Ports of the microservices start from 3500 and increases by 1 for every microservice. Order is specified in `scripts/startService` file

`yarn installAll` is used for installing all the dependencies in all services

`yarn deploy` is used for syncing files with the server. After running the command, it will ask for password.
