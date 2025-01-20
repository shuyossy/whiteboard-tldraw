// data-source.ts

/**
 * data-source.ts
 *
 * TypeORMの設定を行うファイル。
 * - configモジュールからデータベース接続情報を取得し、DataSourceを生成。
 * - 使用するエンティティをすべて登録。
 */

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { TldrawRoom } from '@/entity/TldrawRoom'
import { TldrawAsset } from '@/entity/TldrawAsset'
import { Folder } from '@/entity/Folder'
import { Board } from '@/entity/Board'
import whiteboardConfig from 'config'

/**
 * アプリケーション全体で使用するTypeORMのDataSourceインスタンス。
 * データベースへの接続設定やエンティティの登録を行う。
 */
export const AppDataSource = new DataSource({
  type: 'postgres', // データベースの種類をPostgreSQLに設定
  host: whiteboardConfig.get<string>('pg_host'), // データベースホスト名を設定
  port: whiteboardConfig.get<number>('pg_port'), // データベースポート番号を設定
  username: whiteboardConfig.get<string>('pg_user'), // データベースユーザー名を設定
  password: whiteboardConfig.get<string>('pg_password'), // データベースパスワードを設定
  database: whiteboardConfig.get<string>('pg_database'), // データベース名を設定
  synchronize: whiteboardConfig.get<boolean>('typeorm_synchronize'), // データベーススキーマの自動同期設定（本番環境ではfalse推奨）
  logging: false, // データベースクエリのログ出力設定（必要に応じてtrueに変更）
  entities: [
    // データベースで使用するエンティティのリスト
    TldrawRoom, // ホワイトボードのルーム情報を管理するエンティティ
    TldrawAsset, // ホワイトボード内のアセット（画像など）を管理するエンティティ
    Folder, // フォルダ情報を管理するエンティティ
    Board, // ボード情報を管理するエンティティ
  ],
})
