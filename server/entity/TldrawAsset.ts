// tldrawAsset.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'

/**
 * tldraw_assets テーブルに対応するエンティティクラス
 * 
 * このクラスは tldraw_assets データベーステーブルの構造を定義し、
 * 各カラムとクラスのプロパティをマッピングします。
 */
@Entity({ name: 'tldraw_assets' })
@Unique(['assetId', 'roomId', 'pageId'])
export class TldrawAsset {
  
  /**
   * 自動生成される主キー
   * 
   * @type {number} - 数値型
   */
  @PrimaryGeneratedColumn()
  id!: number

  /**
   * アセットの識別子
   * 
   * @type {string} - 文字列型
   */
  @Column({ type: 'text', name: 'asset_id' })
  assetId!: string

  /**
   * ルームの識別子
   * 
   * @type {string} - 文字列型
   */
  @Column({ type: 'text', name: 'room_id' })
  roomId!: string

  /**
   * ページの識別子
   * 
   * @type {string | null} - 文字列型または null
   */
  @Column({ type: 'text', name: 'page_id', nullable: true })
  pageId?: string | null

  /**
   * アセットのデータ
   * 
   * @type {Buffer} - バイナリデータ型
   */
  @Column({ type: 'bytea' })
  data!: Buffer

  /**
   * レコードの最終更新日時
   * 
   * @type {Date} - 日付型
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
