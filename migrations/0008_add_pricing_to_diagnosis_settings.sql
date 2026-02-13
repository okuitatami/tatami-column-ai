-- 診断チャート設定に価格設定カラムを追加
ALTER TABLE diagnosis_settings ADD COLUMN price_urakaeshi_min INTEGER DEFAULT 5000;
ALTER TABLE diagnosis_settings ADD COLUMN price_urakaeshi_max INTEGER DEFAULT 8000;
ALTER TABLE diagnosis_settings ADD COLUMN price_omoteae_min INTEGER DEFAULT 8000;
ALTER TABLE diagnosis_settings ADD COLUMN price_omoteae_max INTEGER DEFAULT 15000;
ALTER TABLE diagnosis_settings ADD COLUMN price_shincho_min INTEGER DEFAULT 15000;
ALTER TABLE diagnosis_settings ADD COLUMN price_shincho_max INTEGER DEFAULT 25000;
