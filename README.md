# Concierge Preview
### Workflow Management and Migration Tool for 3D Data

### Prerequisites
  * Linux operating system (Ubuntu 18.04 preferred)
  * Git
  * Docker
  * Docker Compose 

### Installation

#### Clone the repository
```bash
git clone https://github.com/Smithsonian/dpo-concierge.git
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

```bash
npm run api           # starts the API server monitored by nodemon
npm run watch         # starts the API server and watches for client
                      # and server source code changes, triggers rebuild
npm run build-api     # builds the API server code
npm run build-dev     # builds the web client in dev mode
npm run build-prod    # builds the web client in production mode
npm run clean         # remove build output
npm run clean-models  # remove build output (sequelize models only)
npm run up            # builds and runs Concierge in a Docker environment,
                      # in dev/watch mode, with 2 containers: API, Database
npm run down          # terminates and removes the Docker containers
npm run restart       # restarts the Docker containers
npm run rebuild       # rebuilds API and client and restarts the Docker containers
npm run bash          # runs a shell in the API container
```

### Troubleshooting

Please open an issue on Github if you encounter any bugs or problems.

### Tech Stack

Concierge leverages the following 3rd party libraries and technologies :heart:
- API server and client written in Typescript
- Node.js
- GraphQL
- Sequelize ORM
- React
- Material-UI

### Pre-Release Software
This is preview software and provided "as is". Breaking changes can and will happen during development.

### License Information
Copyright 2019 Smithsonian Institution.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use the content of this repository except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
