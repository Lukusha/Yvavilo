CREATE TABLE IF NOT EXISTS guest_orders (
  id TEXT PRIMARY KEY,
  claim_token_hash TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS guest_orders_created_idx ON guest_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS guest_orders_email_idx ON guest_orders(contact_email COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS support_requests_created_idx ON support_requests(created_at DESC);
