-- 価格設定のカテゴリ名変更と人気価格の追加

-- 既存のprice_settingsテーブルに人気価格カラムを追加
ALTER TABLE price_settings ADD COLUMN popular_price INTEGER DEFAULT 0;

-- 既存データの更新（全面張替え→新調工事、メンテナンス→裏返し）
-- Note: カテゴリ名はコード内で変更するため、ここではカラム追加のみ
