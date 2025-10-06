CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    server_ip VARCHAR(255) UNIQUE NOT NULL,
    edition VARCHAR(20) NOT NULL CHECK (edition IN ('java', 'bedrock')),
    version VARCHAR(50) NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 20,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'starting', 'stopping')),
    port INTEGER,
    rcon_port INTEGER,
    rcon_password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS server_logs (
    id SERIAL PRIMARY KEY,
    server_id INTEGER NOT NULL REFERENCES servers(id),
    log_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS server_settings (
    id SERIAL PRIMARY KEY,
    server_id INTEGER NOT NULL UNIQUE REFERENCES servers(id),
    motd TEXT,
    gamemode VARCHAR(20) DEFAULT 'survival',
    difficulty VARCHAR(20) DEFAULT 'normal',
    pvp BOOLEAN DEFAULT true,
    whitelist BOOLEAN DEFAULT false,
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_servers_user_id ON servers(user_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_server_logs_server_id ON server_logs(server_id);
