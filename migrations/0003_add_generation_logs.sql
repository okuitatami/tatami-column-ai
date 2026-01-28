-- コラム生成ログテーブル（月間生成数カウント用）
CREATE TABLE IF NOT EXISTS column_generation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  keywords TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON column_generation_logs(created_at);
