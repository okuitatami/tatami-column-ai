-- 診断チャート設定テーブル
CREATE TABLE IF NOT EXISTS diagnosis_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  preferred_material TEXT NOT NULL, -- 'natural', 'chemical', 'both'
  inquiry_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 診断結果履歴テーブル
CREATE TABLE IF NOT EXISTS diagnosis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT NOT NULL,
  answers TEXT NOT NULL, -- JSON配列
  recommended_method TEXT NOT NULL, -- 'urakaeshi', 'omoteae', 'shincho'
  recommended_material TEXT NOT NULL, -- 'igusa', 'paper', 'polypropylene'
  estimated_cost_min INTEGER,
  estimated_cost_max INTEGER,
  urgency_level TEXT NOT NULL, -- 'urgent', 'soon', 'consider', 'not_urgent'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_diagnosis_settings_user_id ON diagnosis_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_session_id ON diagnosis_results(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_user_id ON diagnosis_results(user_id);
