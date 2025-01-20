// rooms.ts

/**
 * rooms.ts
 *
 * フォルダ作成、削除、更新、階層制限チェックなどのビジネスロジックを実装。
 * データベースへのCRUD操作はTypeORMのRepositoryを使用。
 * データの重複や存在しないエンティティに対する操作時に例外を投げ、後段でキャッチしてフロントエンドに通知。
 */

import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import { createTLSchema, defaultShapeSchemas } from '@tldraw/tlschema'
import { AppDataSource } from '@/integration/data-source'
import { TldrawRoom } from '@/entity/TldrawRoom'
import { FolderService } from '@/service/FolderService'
import { drawioViewerMigrations } from '@/app/component/drawio/drawio-viewer-migrations'
import { drawioViewerProps } from '@/app/component/drawio/drawio-viewer-props'

/**
 * フォルダサービスのインスタンスを生成
 */
const folderService = new FolderService()

/**
 * TldrawRoomエンティティのリポジトリを取得
 */
const roomRepo = AppDataSource.getRepository(TldrawRoom)

/**
 * 既存のシェイプスキーマにカスタムシェイプを追加してスキーマを作成
 */
const schema = createTLSchema({
  shapes: {
    ...defaultShapeSchemas,
    'drawioviewer-custom-shape': {
      props: drawioViewerProps,
      migrations: drawioViewerMigrations,
    },
  },
})

/**
 * 指定されたルームIDのスナップショットをデータベースから読み取る関数
 * @param roomId 読み取るルームのID
 * @returns ルームのスナップショットまたはundefined
 */
async function readSnapshotIfExists(roomId: string): Promise<RoomSnapshot | undefined> {
  try {
    const row = await roomRepo.findOne({
      where: { roomId: roomId },
    })
    if (!row) {
      // 該当するデータが存在しない場合はundefinedを返す
      return undefined
    }
    return row.snapshot // jsonbカラムから読み取ったスナップショット
  } catch (e) {
    console.error('Error reading snapshot from DB:', e)
    return undefined
  }
}

/**
 * 指定されたルームIDのスナップショットをデータベースに保存する関数
 * @param roomId 保存するルームのID
 * @param snapshot 保存するスナップショット
 */
async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
  try {
    const roomsRepo = AppDataSource.getRepository(TldrawRoom)
    /**
     * 既存行があればUPDATE、なければINSERTを実行
     * TypeORMで"upsert"相当の操作を行う
     */
    const existing = await roomsRepo.findOne({ where: { roomId: roomId } })
    if (existing) {
      // 既存のルームが存在する場合、スナップショットを更新
      existing.snapshot = snapshot
      await roomsRepo.save(existing)
    } else {
      // 新規ルームとして挿入
      const newRoom = roomsRepo.create({
        roomId: roomId,
        snapshot: snapshot,
      })
      await roomsRepo.save(newRoom)
    }
  } catch (e) {
    console.error('Error saving snapshot to DB:', e)
  }
}

/**
 * ルームの状態を管理するインターフェース
 */
interface RoomState {
  room: TLSocketRoom<any, void>
  id: string
  needsPersist: boolean
}

/**
 * ルームのマップを保持
 * キーはルームID、値はRoomStateオブジェクト
 */
const rooms = new Map<string, RoomState>()

/**
 * ミューテックスとして機能するPromise
 * 排他制御に使用
 */
let mutex = Promise.resolve<null | Error>(null)

/**
 * ルームを生成または既存のルームを読み込む関数
 * @param roomId 操作対象のルームID
 * @returns TLSocketRoomインスタンス
 * @throws エラーが発生した場合に例外を投げる
 */
export async function makeOrLoadRoom(roomId: string) {
  mutex = mutex
    .then(async () => {
      if (rooms.has(roomId)) {
        const roomState = rooms.get(roomId)!
        if (!roomState.room.isClosed()) {
          return null
        }
      }
      console.log('loading room', roomId)

      // データベースからスナップショットを読み取る
      const initialSnapshot = await readSnapshotIfExists(roomId)

      let roomState: RoomState
      roomState = {
        needsPersist: false,
        id: roomId,
        room: new TLSocketRoom({
          initialSnapshot,
          schema,
          /**
           * セッションが削除された際のハンドラー
           * @param room TLSocketRoomインスタンス
           * @param args セッション削除時の引数
           */
          onSessionRemoved(room, args) {
            console.log('client disconnected', args.sessionId, roomId)
            // 参加者が全員いなくなった場合の処理
            if (args.numSessionsRemaining === 0) {
              // 親フォルダが存在しない場合はルームを削除
              (async () => {
                console.log('No more participants...', roomId)
                if (await folderService.checkFolderExists(roomId)) {
                  console.log('No parent folder, deleting room', roomId)
                  await roomRepo.delete(roomId)
                } else if (roomState.needsPersist) {
                  console.log('saving snapshot', roomId)
                  await saveSnapshot(roomId, room.getCurrentSnapshot())
                }
                // ルームを閉じてマップから削除
                console.log('closing room', roomId)
                room.close()
                rooms.delete(roomState.id)
              })()
            }
          },
          /**
           * データ変更時のハンドラー
           */
          onDataChange() {
            roomState.needsPersist = true
          },
        }),
      }
      rooms.set(roomId, roomState)
      return null
    })
    .catch((error) => {
      return error
    })

  const err = await mutex
  if (err) throw err
  return rooms.get(roomId)!.room
}

/**
 * 定期的にルームのスナップショットをデータベースに保存するインターバル処理
 * サーバー内のメモリで最新のスナップショットを保持し、定期的に外部に保存
 */
setInterval(() => {
  for (const roomState of rooms.values()) {
    if (roomState.needsPersist) {
      roomState.needsPersist = false
      console.log('saving snapshot', roomState.id)
      saveSnapshot(roomState.id, roomState.room.getCurrentSnapshot())
    }
    if (roomState.room.isClosed()) {
      console.log('deleting room', roomState.id)
      rooms.delete(roomState.id)
    }
  }
}, 5 * 60000) // 5分間隔で実行
