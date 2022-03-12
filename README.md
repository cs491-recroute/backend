This repository contains backend microservices for the Recroute project

**yarn** needs to be installed in order to work with this repository

`yarn installAll` is used for installing all the dependencies in all services
***

You can start a specific microservice with `yarn startService SERVICE_NAME`  
SERVICE_NAME must match with a folder name in the services folder

Service names can be chained like `yarn startService user flow`. This command will start user and flow services

Also, you can start all the microservices by running `yarn startService all` command

In order to attach a debugger to the processes, you can use `yarn debugService` command. Rest is same as above.

***
Ports of the microservices start from 3500 and increases by 1 for every microservice. Order is specified in `scripts/startService` file

***

`yarn deploy` is used for syncing files with the server. After running the command, it will ask for password.
