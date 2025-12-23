#!/bin/sh

# Load PostgreSQL extensions required for the application
# uuid-ossp: For UUID generation
# unaccent: For removing accents from text

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<EOSQL
create extension unaccent;
create extension "uuid-ossp";
select * FROM pg_extension;
EOSQL
