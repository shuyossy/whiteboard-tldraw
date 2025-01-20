// BoardEntity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * boards テーブルに対応するエンティティクラス
 * 
 * このクラスは boards データベーステーブルの構造を定義し、
 * テーブルの各カラムとクラスのプロパティをマッピングします。
 */
@Entity({ name: 'boards' })
export class Board {
  
  /**
   * ボードの識別子
   * 
   * @primaryColumn - 主キーとして使用されるカラム
   * @type {string} - ボードIDは文字列型
   */
  @PrimaryColumn('text', { name: 'board_id' })
  boardId!: string

  /**
   * ボード名
   * 
   * @column - データベースのカラムに対応
   * @type {string} - ボード名は文字列型
   */
  @Column('text', { name: 'name' })
  name!: string

  /**
   * フォルダの識別子
   * 
   * @column - データベースのカラムに対応
   * @type {string | null} - フォルダIDは文字列型または null
   * - nullable: true に設定
   * - フォルダに所属しない場合は null
   */
  @Column('text', { name: 'folder_id', nullable: true })
  folderId!: string | null

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
