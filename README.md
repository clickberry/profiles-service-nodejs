# Dockerized Profiles worker service
Profiles worker micro-service on Node.js

* [Architecture](#architecture)
* [Technologies](#technologies)
* [Environment Variables](#environment-variables)
* [Events](#events)
* [License](#license)

# Architecture
The application is a worker service listening for `registrations` and `account-deletes` messages from the Bus and creates or deletes profiles.

# Technologies
* Node.js
* Redis/node_redis+hiredis
* Official nsqjs driver for NSQ messaging service

# Environment Variables
The service should be properly configured with following environment variables.

Key | Value | Description
:-- | :-- | :-- 
NSQLOOKUPD_ADDRESSES | nsqlookupd1:4161,nsqlookupd2:4161 | TCP addresses for nsqlookupd instances to read messages from.
REDIS_ADDRESS | redis.yourdomain.com | Redis server address.
REDIS_PORT | 6379 | Redis server port.

# Events
The service listens events from the Bus (messaging service).

## Receive events

Topic | Channel | Params | Description
:-- | :-- | :-- | :--
registrations | create-profile | { id: *user_id*, email: *user_email*, memberships: { name: *user_name* } } | Creates user profile.
account-deletes | delete-profile | { id: *user_id* } | Deletes user profile.

# License
Source code is under GNU GPL v3 [license](LICENSE).
