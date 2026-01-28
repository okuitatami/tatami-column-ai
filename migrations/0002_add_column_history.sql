-- コラム履歴テーブル
CREATE TABLE IF NOT EXISTS column_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  introduction TEXT NOT NULL,
  sections TEXT NOT NULL, -- JSON形式で保存
  closing TEXT NOT NULL, -- JSON形式で保存
  qa TEXT NOT NULL, -- JSON形式で保存
  keywords TEXT, -- JSON形式で保存
  regions TEXT, -- JSON形式で保存
  target_audience TEXT,
  meta_description TEXT,
  character_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_column_history_user_id ON column_history(user_id);
CREATE INDEX IF NOT EXISTS idx_column_history_created_at ON column_history(created_at);
CREATE INDEX IF NOT EXISTS idx_column_history_title ON column_history(title);
