CREATE TABLE IF NOT EXISTS rule_packs (
  rule_version TEXT PRIMARY KEY,
  engine_version TEXT NOT NULL,
  catalog_json TEXT NOT NULL CHECK(json_valid(catalog_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 60),
  origin TEXT NOT NULL CHECK(origin IN ('manual','school_target','score_copy')),
  parent_id TEXT REFERENCES scenarios(id),
  rule_version TEXT NOT NULL REFERENCES rule_packs(rule_version),
  engine_version TEXT NOT NULL,
  scores_json TEXT NOT NULL CHECK(json_valid(scores_json)),
  results_json TEXT NOT NULL CHECK(json_valid(results_json)),
  content_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(owner_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS scenarios_owner_created ON scenarios(owner_id, created_at DESC);
