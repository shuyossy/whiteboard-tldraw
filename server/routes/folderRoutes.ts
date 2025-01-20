// folderRoutes.ts

/**
 * folderRoutes.ts
 *
 * フォルダ管理に関するAPIをまとめるルータプラグイン。
 * - フォルダの作成、削除、リネーム、移動
 * - ボードの作成、削除、リネーム、移動
 * - フォルダ構成の取得、リフレッシュ
 * - ボードの存在確認
 * - 例外発生時にはステータスコードとメッセージをフロントエンドに返す
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { FolderService } from '@/service/FolderService'

/**
 * folderRoutesプラグイン
 *
 * Fastifyインスタンスにフォルダ管理APIのルートを登録するプラグイン。
 *
 * @param app - Fastifyインスタンス
 */
export const folderRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    /**
     * FolderServiceのインスタンスを生成
     */
    const folderService = new FolderService()

    /**
     * フォルダ構成のツリー状データを取得するエンドポイント
     *
     * @route GET /tree
     * @returns フォルダとボードのツリーデータ
     */
    app.get('/tree', async (request, reply) => {
        console.log('get tree')
        try {
            // FolderServiceを使用してツリーデータを取得
            const tree = await folderService.getTreeData()
            // ツリーデータをレスポンスとして送信
            reply.send(tree)
        } catch (error: any) {
            // エラー発生時に500ステータスコードとエラーメッセージを返す
            reply.status(500).send({ error: error.message })
        }
    })

    /**
     * フォルダとボードの全一覧を取得するエンドポイント
     *
     * @route GET /
     * @returns フォルダとボードのデータ
     */
    app.get('/', async (request, reply) => {
        try {
            // FolderServiceを使用してフォルダとボードの一覧を取得
            const data = await folderService.getAllFoldersAndBoards()
            // データをレスポンスとして送信
            reply.send(data)
        } catch (err: any) {
            // エラー発生時に500ステータスコードとエラーメッセージを返す
            reply.status(500).send({ error: err.message })
        }
    })

    /**
     * 新規フォルダを作成するエンドポイント
     *
     * @route POST /create-folder
     * @body { folderId: string, name: string, parentFolderId?: string }
     * @returns 作成成功メッセージと新規フォルダデータ
     * @throws folderIdまたはnameが不足している場合に400エラーを返す
     */
    app.post('/create-folder', async (request, reply) => {
        try {
            /**
             * リクエストボディの構造例:
             * {
             *   folderId: 'xxx',
             *   name: 'フォルダ名',
             *   parentFolderId: '...'
             * }
             */
            const { folderId, name, parentFolderId } = request.body as {
                folderId: string
                name: string
                parentFolderId?: string
            }
            // folderIdとnameが存在するかチェック
            if (!folderId || !name) {
                // 不足している場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'folderId, name は必須です。' })
            }

            // FolderServiceを使用して新規フォルダを作成
            const newFolder = await folderService.createFolder(folderId, name, parentFolderId)
            // 作成成功メッセージとフォルダデータをレスポンスとして送信
            reply.send({ message: 'フォルダ作成成功', folder: newFolder })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 新規ボードを作成するエンドポイント
     *
     * @route POST /create-board
     * @body { boardId: string, name: string, folderId?: string }
     * @returns 作成成功メッセージと新規ボードデータ
     * @throws boardIdまたはnameが不足している場合に400エラーを返す
     */
    app.post('/create-board', async (request, reply) => {
        try {
            /**
             * リクエストボディの構造例:
             * {
             *   boardId: 'xxx',
             *   name: 'ボード名',
             *   folderId: '...'
             * }
             */
            const { boardId, name, folderId } = request.body as {
                boardId: string
                name: string
                folderId?: string
            }
            // boardIdとnameが存在するかチェック
            if (!boardId || !name) {
                // 不足している場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'boardId, name は必須です。' })
            }

            // FolderServiceを使用して新規ボードを作成
            const newBoard = await folderService.createBoard(boardId, name, folderId)
            // 作成成功メッセージとボードデータをレスポンスとして送信
            reply.send({ message: 'ボード作成成功', board: newBoard })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * フォルダとボードの最新構成を取得するエンドポイント
     *
     * @route GET /refresh
     * @returns 最新のフォルダとボードのデータ
     */
    app.get('/refresh', async (request, reply) => {
        try {
            // FolderServiceを使用して最新のフォルダとボードのデータを取得
            const data = await folderService.refreshFoldersAndBoards()
            // データをレスポンスとして送信
            reply.send(data)
        } catch (err: any) {
            // エラー発生時に500ステータスコードとエラーメッセージを返す
            reply.status(500).send({ error: err.message })
        }
    })

    /**
     * 指定フォルダを削除するエンドポイント
     *
     * @route DELETE /folder/:folderId
     * @param folderId - 削除対象のフォルダID
     * @returns 削除成功メッセージ
     * @throws folderIdが不足している場合やフォルダが存在しない場合に400エラーを返す
     */
    app.delete('/folder/:folderId', async (request, reply) => {
        try {
            // パラメータからfolderIdを取得
            const { folderId } = request.params as { folderId: string }
            // folderIdが存在するかチェック
            if (!folderId) {
                // 存在しない場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'folderId は必須です。' })
            }

            // FolderServiceを使用してフォルダを削除
            await folderService.deleteFolder(folderId)
            // 削除成功メッセージをレスポンスとして送信
            reply.send({ message: `フォルダ '${folderId}' を削除しました。` })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定ボードを削除するエンドポイント
     *
     * @route DELETE /board/:boardId
     * @param boardId - 削除対象のボードID
     * @returns 削除成功メッセージ
     * @throws boardIdが不足している場合やボードが存在しない場合に400エラーを返す
     */
    app.delete('/board/:boardId', async (request, reply) => {
        try {
            // パラメータからboardIdを取得
            const { boardId } = request.params as { boardId: string }
            // boardIdが存在するかチェック
            if (!boardId) {
                // 存在しない場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'boardId は必須です。' })
            }

            // FolderServiceを使用してボードを削除
            await folderService.deleteBoard(boardId)
            // 削除成功メッセージをレスポンスとして送信
            reply.send({ message: `ボード '${boardId}' を削除しました。` })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定フォルダの名前を変更するエンドポイント
     *
     * @route PATCH /folder/:folderId/rename
     * @param folderId - 名前を変更するフォルダID
     * @body { newName: string }
     * @returns リネーム成功メッセージと更新されたフォルダデータ
     * @throws folderIdやnewNameが不足している場合やフォルダが存在しない場合に400エラーを返す
     */
    app.patch('/folder/:folderId/rename', async (request, reply) => {
        try {
            // パラメータからfolderIdを取得
            const { folderId } = request.params as { folderId: string }
            // ボディからnewNameを取得
            const { newName } = request.body as { newName: string }
            // folderIdとnewNameが存在するかチェック
            if (!folderId || !newName) {
                // 不足している場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'folderId, newName は必須です。' })
            }

            // FolderServiceを使用してフォルダ名を変更
            const updated = await folderService.renameFolder(folderId, newName)
            // リネーム成功メッセージと更新されたフォルダデータをレスポンスとして送信
            reply.send({ message: `フォルダ名を '${updated.name}' に変更しました。`, folder: updated })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定ボードの名前を変更するエンドポイント
     *
     * @route PATCH /board/:boardId/rename
     * @param boardId - 名前を変更するボードID
     * @body { newName: string }
     * @returns リネーム成功メッセージと更新されたボードデータ
     * @throws boardIdやnewNameが不足している場合やボードが存在しない場合に400エラーを返す
     */
    app.patch('/board/:boardId/rename', async (request, reply) => {
        try {
            // パラメータからboardIdを取得
            const { boardId } = request.params as { boardId: string }
            // ボディからnewNameを取得
            const { newName } = request.body as { newName: string }
            // boardIdとnewNameが存在するかチェック
            if (!boardId || !newName) {
                // 不足している場合は400ステータスコードとエラーメッセージを返す
                return reply.status(400).send({ error: 'boardId, newName は必須です。' })
            }

            // FolderServiceを使用してボード名を変更
            const updated = await folderService.renameBoard(boardId, newName)
            // リネーム成功メッセージと更新されたボードデータをレスポンスとして送信
            reply.send({ message: `ボード名を '${updated.name}' に変更しました。`, board: updated })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定フォルダを別の親フォルダに移動するエンドポイント
     *
     * @route PATCH /folder/:folderId/move
     * @param folderId - 移動対象のフォルダID
     * @body { newParentFolderId: string }
     * @returns 移動成功メッセージと更新されたフォルダデータ
     * @throws folderIdやnewParentFolderIdが不足している場合やフォルダが存在しない場合に400エラーを返す
     */
    app.patch('/folder/:folderId/move', async (request, reply) => {
        try {
            // パラメータからfolderIdを取得
            const { folderId } = request.params as { folderId: string }
            // ボディからnewParentFolderIdを取得
            const { newParentFolderId } = request.body as { newParentFolderId: string }

            // FolderServiceを使用してフォルダを移動
            const updated = await folderService.moveFolder(folderId, newParentFolderId)
            // 移動成功メッセージと更新されたフォルダデータをレスポンスとして送信
            reply.send({ message: `フォルダを移動しました。`, folder: updated })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定ボードを別のフォルダに移動するエンドポイント
     *
     * @route PATCH /board/:boardId/move
     * @param boardId - 移動対象のボードID
     * @body { newFolderId: string }
     * @returns 移動成功メッセージと更新されたボードデータ
     * @throws boardIdやnewFolderIdが不足している場合やボードが存在しない場合に400エラーを返す
     */
    app.patch('/board/:boardId/move', async (request, reply) => {
        try {
            // パラメータからboardIdを取得
            const { boardId } = request.params as { boardId: string }
            // ボディからnewFolderIdを取得
            const { newFolderId } = request.body as { newFolderId: string }

            // FolderServiceを使用してボードを移動
            const updated = await folderService.moveBoard(boardId, newFolderId)
            // 移動成功メッセージと更新されたボードデータをレスポンスとして送信
            reply.send({ message: `ボードを移動しました。`, board: updated })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })

    /**
     * 指定ボードの存在を確認するエンドポイント
     *
     * @route GET /board/:boardId/exist
     * @param boardId - 存在を確認するボードID
     * @returns ボードの存在有無を示すオブジェクト
     */
    app.get('/board/:boardId/exist', async (request, reply) => {
        try {
            // パラメータからboardIdを取得
            const { boardId } = request.params as { boardId: string }
            // FolderServiceを使用してボードの存在を確認
            const exists = await folderService.checkBoardExists(boardId)
            // 結果をレスポンスとして送信
            reply.send({ exists })
        } catch (err: any) {
            // エラー発生時に400ステータスコードとエラーメッセージを返す
            reply.status(400).send({ error: err.message })
        }
    })
}
