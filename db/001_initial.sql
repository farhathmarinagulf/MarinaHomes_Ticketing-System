CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL, email varchar(254) UNIQUE NOT NULL,
 employee_code varchar(40) UNIQUE NOT NULL, password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'staff' CHECK(role IN ('staff','admin')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS tickets (
 id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), subject varchar(160) NOT NULL,
 description text NOT NULL, category text NOT NULL, priority text NOT NULL CHECK(priority IN ('Low','Medium','High')),
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Assigned','Completed')),
 assignee varchar(100), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comments (
 id uuid PRIMARY KEY, ticket_id integer NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id), body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attachments (
 id uuid PRIMARY KEY, ticket_id integer NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 name varchar(255) NOT NULL, mime text NOT NULL, data bytea NOT NULL
);
CREATE TABLE IF NOT EXISTS ticket_events (
 id uuid PRIMARY KEY, ticket_id integer NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id), body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_limits (key text PRIMARY KEY, attempts integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS tickets_owner_idx ON tickets(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status,created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
