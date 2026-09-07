CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );


ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);


CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);