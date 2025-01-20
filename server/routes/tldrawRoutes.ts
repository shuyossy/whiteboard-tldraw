// tldrawRoutes.ts

/**
 * tldrawRoutes.ts
 *
 * tldrawのサーバサイド処理をまとめるルータプラグイン。
 * - WebSocket接続の管理
 * - アセットのアップロード、取得、削除
 * - ページ内のアセット一括削除
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { loadAsset, storeAsset, deleteAsset, deleteAssetsByPageId } from '@/service/tldraw/assets'
import { makeOrLoadRoom } from '@/service/tldraw/rooms'

/**
 * tldrawRoutesプラグイン
 *
 * Fastifyアプリケーションにtldraw関連のルートを登録するプラグイン。
 *
 * @param app - Fastifyインスタンス
 */
export const tldrawRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    /**
     * WebSocketエンドポイントの定義
     * - ルームIDとセッションIDを受け取り、対応するルームをロードまたは作成し、
     *   クライアントのソケット接続をハンドリングする。
     *
     * @route GET /connect/:roomId
     * @param roomId - 接続するルームのID
     * @param sessionId - クライアントのセッションID
     */
    app.get<{ Params: { roomId: string }; Querystring: { sessionId: string } }>('/connect/:roomId', { websocket: true }, async (socket, req) => {
        const roomId = req.params.roomId
        const sessionId = req.query.sessionId

        // ルームを生成または既存のルームをロード
        const room = await makeOrLoadRoom(roomId)
        // クライアントのソケット接続をルームにハンドリング
        room.handleSocketConnect({ sessionId, socket })
    })

    /**
     * アセットのアップロードと取得エンドポイントの設定
     * - すべてのコンテンツタイプをパース可能にするための設定
     */
    app.addContentTypeParser('*', (_, __, done) => done(null))

    /**
     * アセットのアップロードエンドポイント
     * - 指定されたルームID、ページID、アセットIDに対してアセットを保存する。
     *
     * @route PUT /assets/:roomId/:pageId/:assetId
     * @param roomId - アセットが属するルームのID
     * @param pageId - アセットが属するページのID
     * @param assetId - 保存するアセットのID
     * @body アセットデータのストリーム
     */
    app.put<{ Params: { roomId: string, pageId: string, assetId: string } }>('/assets/:roomId/:pageId/:assetId', {}, async (req, res) => {
        const roomId = req.params.roomId
        const pageId = req.params.pageId
        const assetId = req.params.assetId
        // アセットを保存するサービス関数を呼び出し
        await storeAsset(roomId, pageId, assetId, req.raw)
        // 成功レスポンスを送信
        res.send({ ok: true })
    })

    /**
     * アセットの取得エンドポイント
     * - 指定されたルームID、ページID、アセットIDに対してアセットデータを取得する。
     *
     * @route GET /assets/:roomId/:pageId/:assetId
     * @param roomId - アセットが属するルームのID
     * @param pageId - アセットが属するページのID
     * @param assetId - 取得するアセットのID
     * @returns アセットデータのバッファ
     */
    app.get<{ Params: { roomId: string, pageId: string, assetId: string } }>('/assets/:roomId/:pageId/:assetId', async (req, res) => {
        const roomId = req.params.roomId
        const pageId = req.params.pageId
        const assetId = req.params.assetId
        // アセットをロードするサービス関数を呼び出し
        const data = await loadAsset(roomId, pageId, assetId)
        // アセットデータをレスポンスとして送信
        res.send(data)
    })

    /**
     * アセットの削除エンドポイント
     * - 指定されたルームID、ページID、アセットIDに対してアセットを削除する。
     *
     * @route DELETE /assets/:roomId/:pageId/:assetId
     * @param roomId - アセットが属するルームのID
     * @param pageId - アセットが属するページのID
     * @param assetId - 削除するアセットのID
     */
    app.delete<{ Params: { roomId: string, pageId: string, assetId: string } }>('/assets/:roomId/:pageId/:assetId', async (req, res) => {
        const roomId = req.params.roomId
        const pageId = req.params.pageId
        const assetId = req.params.assetId
        // アセットを削除するサービス関数を呼び出し
        const data = await deleteAsset(roomId, pageId, assetId)
        // 削除結果をレスポンスとして送信
        res.send(data)
    })

    /**
     * ページ内の全てのアセットを削除するエンドポイント
     * - 指定されたルームID、ページIDに属する全アセットを削除する。
     *
     * @route DELETE /page/:roomId/:pageId
     * @param roomId - アセットが属するルームのID
     * @param pageId - 削除対象のページのID
     */
    app.delete<{ Params: { roomId: string, pageId: string } }>('/page/:roomId/:pageId', {}, async (req, res) => {
        const roomId = req.params.roomId
        const pageId = req.params.pageId
        // ページ内の全アセットを削除するサービス関数を呼び出し
        await deleteAssetsByPageId(roomId, pageId)
        // 成功レスポンスを送信
        res.send({ ok: true })
    })
}
