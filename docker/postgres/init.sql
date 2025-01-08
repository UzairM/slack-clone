-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'synapse') THEN
      CREATE USER synapse WITH PASSWORD 'changeme';
   END IF;
END
$do$;

-- Create database with correct collation
CREATE DATABASE synapse
    LC_COLLATE 'C'
    LC_CTYPE 'C'
    ENCODING 'UTF8'
    TEMPLATE template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse;

-- Connect to the synapse database and set up permissions
\c synapse

-- Grant schema permissions
ALTER DEFAULT PRIVILEGES FOR ROLE synapse IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO synapse;

ALTER DEFAULT PRIVILEGES FOR ROLE synapse IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO synapse;

ALTER DEFAULT PRIVILEGES FOR ROLE synapse IN SCHEMA public
GRANT ALL PRIVILEGES ON FUNCTIONS TO synapse;

-- Set ownership
ALTER DATABASE synapse OWNER TO synapse;
