// tldrawRoom.ts

import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm'

/**
 * tldraw_rooms テーブルに対応するエンティティクラス
 * 
 * このクラスは tldraw_rooms データベーステーブルの構造を定義し、
 * テーブルの各カラムとクラスのプロパティをマッピングします。
 */
@Entity({ name: 'tldraw_rooms' })
export class TldrawRoom {
  
  /**
   * ルームの識別子
   * 
   * @primaryColumn - 主キーとして使用されるカラム
   * @type {string} - ルームIDは文字列型
   */
  @PrimaryColumn('text', { name: 'room_id' })
  roomId!: string

  /**
   * tldraw のルームのスナップショットを JSONB 形式で保存
   * 
   * @column - データベースのカラムに対応
   * @type {any} - 任意のデータ型を許容
   */
  @Column({ type: 'jsonb' })
  snapshot!: any

  /**
   * レコードの最終更新日時
   * 
   * @updateDateColumn - レコードが更新されるたびに自動的に現在日時が設定されるカラム
   * @type {Date} - 日付型
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
