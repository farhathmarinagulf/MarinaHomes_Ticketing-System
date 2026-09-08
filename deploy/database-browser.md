# Browse the database locally

Start Adminer with `docker compose --profile tools up -d adminer`, then open http://localhost:8080.

Log in with:

- System: PostgreSQL
- Server: db
- Username: marina
- Password: the POSTGRES_PASSWORD value from your .env file
- Database: marina

Select a table, then select its data to browse rows. Adminer provides database administration access, including editing and deleting records. The port is bound to localhost only. The tools profile keeps it optional for server deployments.

Stop the database browser with `docker compose stop adminer`. This does not stop the ticketing application or database.

Official image documentation: https://hub.docker.com/_/adminer/
