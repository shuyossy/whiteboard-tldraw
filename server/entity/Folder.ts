// FolderEntity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * folders テーブルに対応するエンティティクラス
 * 
 * このクラスは folders データベーステーブルの構造を定義し、
 * テーブルの各カラムとクラスのプロパティをマッピングします。
 */
@Entity({ name: 'folders' })
export class Folder {
  
  /**
   * フォルダの識別子
   * 
   * @primaryColumn - 主キーとして使用されるカラム
   * @type {string} - フォルダIDは文字列型
   */
  @PrimaryColumn('text', { name: 'folder_id' })
  folderId!: string

  /**
   * フォルダ名
   * 
   * @column - データベースのカラムに対応
   * @type {string} - フォルダ名は文字列型
   */
  @Column('text', { name: 'name' })
  name!: string

  /**
   * 親フォルダID
   * 
   * @column - データベースのカラムに対応
   * @type {string | null} - 親フォルダIDは文字列型または null
   * - nullable: true に設定
   * - ルートフォルダの場合は null
   */
  @Column('text', { name: 'parent_folder_id', nullable: true })
  parentFolderId!: string | null

  /**
   * レコードの作成日時
   * 
   * @createDateColumn - レコード作成時に自動的に現在日時が設定されるカラム
   * @type {Date} - 日付型
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  /**
   * レコードの最終更新日時
   * 
   * @updateDateColumn - レコードが更新されるたびに自動的に現在日時が設定されるカラム
   * @type {Date} - 日付型
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
