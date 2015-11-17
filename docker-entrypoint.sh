#!/bin/bash
set -e

# set env variables
if [ -n "$REDIS_PORT_6379_TCP_ADDR" ] && [ -n "$REDIS_PORT_6379_TCP_PORT" ]; then
  export REDIS_ADDRESS="${REDIS_PORT_6379_TCP_ADDR}"
  export REDIS_PORT="${REDIS_PORT_6379_TCP_PORT}"
fi
echo "USING REDIS: ${REDIS_ADDRESS}:${REDIS_PORT}"

if [ -n "$NSQLOOKUPD_PORT_4161_TCP_ADDR" ] && [ -n "$NSQLOOKUPD_PORT_4161_TCP_PORT" ]; then
  export NSQLOOKUPD_ADDRESSES="http://${NSQLOOKUPD_PORT_4161_TCP_ADDR}:${NSQLOOKUPD_PORT_4161_TCP_PORT}"
fi
echo "USING NSQLOOKUPD: ${NSQLOOKUPD_ADDRESSES}"


# execute nodejs application
exec npm start