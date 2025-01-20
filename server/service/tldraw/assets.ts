// assets.ts

/**
 * assets.ts
 *
 * アセット（画像など）をデータベースに保存、取得、削除する機能を提供。
 * TypeORMを使用してデータベースとのやり取りを行う。
 */

import { Readable } from 'stream'
import { AppDataSource } from '@/integration/data-source'
import { TldrawAsset } from '@/entity/TldrawAsset'

/**
 * アセットをデータベースに保存する関数。
 * 既存のアセットが存在する場合は更新し、存在しない場合は新規作成する。
 *
 * @param roomId - アセットが属するルームのID
 * @param pageId - アセットが属するページのID
 * @param assetId - 保存するアセットのID
 * @param stream - アセットデータのReadableストリーム
 * @throws データベースへの保存時にエラーが発生した場合
 */
export async function storeAsset(roomId: string, pageId: string, assetId: string, stream: Readable) {
  // ストリームをバッファに変換
  const data = await streamToBuffer(stream)

  try {
    // TldrawAssetエンティティのリポジトリを取得
    const assetsRepo = AppDataSource.getRepository(TldrawAsset)
    // 指定されたルームID、ページID、アセットIDで既存のアセットを検索
    const existing = await assetsRepo.findOne({ where: { roomId: roomId, pageId: pageId, assetId: assetId } })
    if (existing) {
      // 既存のアセットが存在する場合、データを更新
      existing.data = data
      await assetsRepo.save(existing)
    } else {
      // 新規アセットを作成し、データベースに保存
      const newAsset = assetsRepo.create({
        roomId: roomId,
        pageId: pageId,
        assetId: assetId,
        data,
      })
      await assetsRepo.save(newAsset)
    }
  } catch (err) {
    // エラーが発生した場合、コンソールにエラーメッセージを出力し、例外を投げる
    console.error('Error storing asset:', err)
    throw err
  }
}

/**
 * アセットをデータベースから読み込む関数。
 *
 * @param roomId - アセットが属するルームのID
 * @param pageId - アセットが属するページのID
 * @param assetId - 読み込むアセットのID
 * @returns アセットデータのバッファ、存在しない場合はnull
 * @throws データベースへの読み込み時にエラーが発生した場合
 */
export async function loadAsset(roomId: string, pageId: string, assetId: string): Promise<Buffer | null> {
  try {
    // TldrawAssetエンティティのリポジトリを取得
    const assetsRepo = AppDataSource.getRepository(TldrawAsset)
    // 指定されたルームID、ページID、アセットIDでアセットを検索
    const entity = await assetsRepo.findOne({ where: { roomId: roomId, pageId: pageId, assetId: assetId } })
    if (!entity) {
      // アセットが存在しない場合はnullを返す
      return null
    }
    // アセットデータをバッファとして返す
    return entity.data
  } catch (err) {
    // エラーが発生した場合、コンソールにエラーメッセージを出力し、nullを返す
    console.error('Error loading asset:', err)
    return null
  }
}

/**
 * ReadableストリームをBufferに変換するユーティリティ関数。
 *
 * @param stream - Bufferに変換するReadableストリーム
 * @returns Bufferに変換されたデータ
 * @throws ストリームの読み込み中にエラーが発生した場合
 */
function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    // ストリームからデータを受け取るたびにチャンクを配列に追加
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    // ストリームでエラーが発生した場合、Promiseを拒否
    stream.on('error', (err) => reject(err))
    // ストリームの読み込みが終了したら、チャンクを結合してBufferを返す
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

/**
 * 指定されたアセットをデータベースから削除する関数。
 *
 * @param roomId - アセットが属するルームのID
 * @param pageId - アセットが属するページのID
 * @param assetId - 削除するアセットのID
 * @throws データベースへの削除時にエラーが発生した場合
 */
export async function deleteAsset(roomId: string, pageId: string, assetId: string) {
  try {
    // TldrawAssetエンティティのリポジトリを取得
    const assetsRepo = AppDataSource.getRepository(TldrawAsset)
    // 指定されたルームID、ページID、アセットIDでアセットを削除
    await assetsRepo.delete({ roomId: roomId, pageId: pageId, assetId: assetId })
  } catch (err) {
    // エラーが発生した場合、コンソールにエラーメッセージを出力し、例外を投げる
    console.error('Error deleting asset:', err)
    throw err
  }
}

/**
 * 指定されたページ内の全てのアセットをデータベースから削除する関数。
 *
 * @param roomId - アセットが属するルームのID
 * @param pageId - アセットが属するページのID
 * @throws データベースへの削除時にエラーが発生した場合
 */
export async function deleteAssetsByPageId(roomId: string, pageId: string) {
  try {
    // TldrawAssetエンティティのリポジトリを取得
    const assetsRepo = AppDataSource.getRepository(TldrawAsset)
    // 指定されたルームID、ページIDに属する全てのアセットを削除
    await assetsRepo.delete({ roomId: roomId, pageId: pageId })
  } catch (err) {
    // エラーが発生した場合、コンソールにエラーメッセージを出力し、例外を投げる
    console.error('Error deleting assets:', err)
    throw err
  }
}
