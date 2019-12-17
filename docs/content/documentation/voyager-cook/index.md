---
title: Voyager and Cook
summary: How Concierge interacts with Voyager and Cook
weight: 110
---

### Cook

Concierge needs access to an instance of Cook. It interacts with Cook through its Web API. Configuration is done
by setting variables in Concierge's `.env` configuration file.

- `COOK_MACHINE_ADDRESS` The address and port under which Cook is running, e.g. `http://192.168.1.19:7000`
- `COOK_CLIENT_ID` The Cook's client ID

### Voyager

Concierge serves the Voyager distributables from the following folder on the storage drive:
`<path_to_storage>/apps/voyager`

#### Create an up-to-date Voyager build
- Start Voyager in its Docker container by running `npm run up`
- Connect to the container: `npm run bash`
- From the container's command line, start the build: `npm run build-dev && npm run build-prod`
- Copy the entire content of the `dist` folder to Concierges storage drive and place it in `<path_to_storage/apps/voyager>`