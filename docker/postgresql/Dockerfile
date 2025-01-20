# ベースイメージとしてPostgreSQLを使用
FROM postgres:15

# 初期化スクリプトをコンテナ内の指定ディレクトリにコピー
COPY init.sql /docker-entrypoint-initdb.d/

# 必要なポートを開放
EXPOSE 5432