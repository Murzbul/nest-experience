FROM postgres:16

# Install pgjwt extension for JWT support
RUN apt-get update && \
    apt-get install -y postgresql-16-pgjwt && \
    rm -rf /var/lib/apt/lists/*

# Copy initialization scripts
# Scripts in /docker-entrypoint-initdb.d/ run in alphabetical order
COPY 00-load-extensions.sh /docker-entrypoint-initdb.d/00-load-extensions.sh
COPY 01-setup-supabase.sh /docker-entrypoint-initdb.d/01-setup-supabase.sh
COPY 02-create-app-tables.sh /docker-entrypoint-initdb.d/02-create-app-tables.sh

# Make scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/*.sh
