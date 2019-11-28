---
title: Installation
summary: Installation and setup of the Concierge migration tool.
weight: 100
---

### Prerequisites
  * Linux operating system (Ubuntu 18.04 preferred)
  * Git
  * Docker
  * Docker Compose 

### Installation

#### Clone the repository
```bash
git clone --recurse-submodules https://github.com/Smithsonian/dpo-concierge.git
```

#### Create local environment configuration
- Copy the environment template file
- Edit the variables in `.env` to reflect your local configuration
```
cp .env.template .env
vim .env
```

#### Build the Docker images (API, Database)
The following command creates two Docker images: one with the Concierge API server,
and one with a MariaDB database. Based on the images, two containers are started
and linked, and the development version of Concierge is automatically built and
run. Source code monitoring watches the code and rebuilds the server or client
code as changes happen.
```bash
npm run up
```

If the API server fails to start, you can restart the containers with the following script.

```bash
npm run restart
```

#### Other useful scripts

Note:scripts with a star (*) must be run from within the Docker API container.
Start a shell using `npm run bash`, then execute the script from witin the shell.

```bash
npm run up             # builds and runs Concierge in a Docker environment,
                       # in dev/watch mode, with 2 containers: API, Database
npm run down           # terminates and removes the Docker containers
npm run restart        # restarts the Docker containers
npm run bash           # runs a shell in the API container

*npm run api           # starts the API server monitored by nodemon
*npm run watch         # starts the API server and watches for client
                       # and server source code changes, triggers rebuild
*npm run build-api     # builds the API server code
*npm run build-dev     # builds the web client in dev mode
*npm run build-prod    # builds the web client in production mode
*npm run clean         # remove build output
*npm run clean-models  # remove build output (sequelize models only)
```

### Troubleshooting

Please open an issue on Github if you encounter any bugs or problems.

### Tech Stack

Concierge leverages the following 3rd party libraries and technologies

- API server and client written in Typescript
- Node.js
- GraphQL
- Sequelize ORM
- React
- Material-UI