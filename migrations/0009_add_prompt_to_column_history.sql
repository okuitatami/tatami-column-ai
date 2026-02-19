-- コラム履歴にプロンプトカラムを追加
ALTER TABLE column_history ADD COLUMN generation_prompt TEXT;
