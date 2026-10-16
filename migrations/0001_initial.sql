PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS records (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('people','orders','deliveries','notifications','occasions')),
  id TEXT NOT NULL,
  recipient_id TEXT,
  data TEXT NOT NULL CHECK(json_valid(data)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(user_id,kind,id)
);
CREATE INDEX IF NOT EXISTS records_user_kind_idx ON records(user_id,kind,created_at);
CREATE INDEX IF NOT EXISTS records_recipient_idx ON records(user_id,recipient_id);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL CHECK(json_valid(data)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL CHECK(json_valid(data)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS staff (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO products(id,data,active) VALUES
('cherries','{"id":"cherries","name":"ალუბლები","image":"/images/collection/cherries.webp","price":97.5,"stems":[{"type":"rose","weight":1}],"bestFor":"სიყვარულისთვის","category":["Roses","Romantic"],"description":"ბორდოსფერი სპრეი ვარდები, პატარა მწვანე კოკრები და ნაზი შეფუთვა — თბილი, გულწრფელი ჟესტი."}',1),
('everyday','{"id":"everyday","name":"ყოველდღიური","image":"/images/collection/everyday.webp","price":78,"stems":[{"type":"rose","weight":1}],"bestFor":"ყოველდღიური სიხარულისთვის","category":["Roses","Minimal","Birthday"],"description":"ნაზი ვარდისფერი სპრეი ვარდები თეთრ შეფუთვაში. პატარა ყურადღება, რომელიც ჩვეულებრივ დღეს განსაკუთრებულს ხდის."}',1),
('just-because','{"id":"just-because","name":"უმიზეზოდ","image":"/images/collection/just-because.webp","price":91,"stems":[{"type":"lily","weight":1}],"bestFor":"უბრალოდ გასახარებლად","category":["Mixed","Lilies","Birthday"],"description":"ვარდისფერი ყვავილები, შროშანის კოკრები და ცოცხალი მწვანე აქცენტები მკვეთრ ვარდისფერ შეფუთვაში."}',1),
('heartbeat','{"id":"heartbeat","name":"გულისცემა","image":"/images/collection/heartbeat.webp","price":325,"stems":[{"type":"rose","weight":1}],"bestFor":"დიდი გრძნობისთვის","category":["Roses","Romantic","Premium"],"description":"წითელი სპრეი ვარდების უხვი თაიგული თეთრი შეფუთვითა და წითელი ლენტით — გრძნობა, რომელიც სიტყვებს სცდება."}',1),
('garden','{"id":"garden","name":"ბაღი","image":"/images/collection/garden.webp","price":149.5,"stems":[{"type":"rose","weight":1}],"bestFor":"დაბადების დღისთვის","category":["Mixed","Birthday"],"description":"კრემისფერი და იასამნისფერი ვარდები, თეთრი ალსტრომერია და იისფერი აქცენტები — პატარა აყვავებული ბაღი."}',1),
('garden-of-love','{"id":"garden-of-love","name":"სიყვარულის ბაღი","image":"/images/collection/garden-of-love.webp","price":221,"stems":[{"type":"rose","weight":1}],"bestFor":"წლისთავისთვის","category":["Mixed","Romantic","Premium"],"description":"ვარდისფერი, წითელი და კრემისფერი ყვავილების თავისუფალი კომპოზიცია, ჰაეროვანი მწვანილითა და ნაზი ლენტით."}',1),
('silk','{"id":"silk","name":"აბრეშუმი","image":"/images/collection/silk.webp","price":2340,"stems":[{"type":"peony","weight":1}],"bestFor":"განსაკუთრებული დღისთვის","category":["Peonies","Premium","Romantic"],"description":"ვარდისფერი პიონების დიდი, მრგვალი თაიგული — აბრეშუმივით რბილი ფურცლები და შთამბეჭდავი მოცულობა."}',1),
('hundred-roses','{"id":"hundred-roses","name":"100 ვარდი","image":"/images/collection/hundred-roses.webp","price":845,"stems":[{"type":"rose","weight":1}],"bestFor":"დაუვიწყარი ჟესტისთვის","category":["Roses","Romantic","Premium"],"description":"წითელი ვარდების დიდი, კლასიკური თაიგული გრძელი ღეროებით — განსაკუთრებული ყურადღების გამოსახატავად."}',1)
ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=excluded.active;
