-- AI学習システム用テーブル

-- コラムセクションの訂正履歴
CREATE TABLE IF NOT EXISTS column_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  column_id INTEGER,
  section_type TEXT NOT NULL, -- 'introduction', 'section', 'closing', 'qa'
  section_index INTEGER, -- セクション番号（該当する場合）
  original_heading TEXT,
  original_content TEXT NOT NULL,
  corrected_heading TEXT,
  corrected_content TEXT NOT NULL,
  correction_reason TEXT, -- 訂正理由（オプション）
  keywords TEXT, -- JSON配列
  regions TEXT, -- JSON配列
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (column_id) REFERENCES column_history(id)
);

-- コラム品質評価
CREATE TABLE IF NOT EXISTS column_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  column_id INTEGER NOT NULL,
  is_approved BOOLEAN NOT NULL, -- Yes/No判定
  feedback TEXT, -- フィードバック（オプション）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (column_id) REFERENCES column_history(id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_corrections_user_id ON column_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_corrections_keywords ON column_corrections(keywords);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON column_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_approved ON column_evaluations(is_approved);
