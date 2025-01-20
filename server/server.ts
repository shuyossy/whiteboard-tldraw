// server.ts

import websocketPlugin from '@fastify/websocket'
import fastify, { FastifyInstance } from 'fastify'
import next from 'next'
import whiteboardConfig from 'config'
import { folderRoutes } from '@/routes/folderRoutes'
import { tldrawRoutes } from '@/routes/tldrawRoutes'
import { AppDataSource } from '@/integration/data-source'

/**
 * 環境変数を経由してNext.jsに値を渡す設定
 * - サーバーのURLとDraw.ioのURLを設定
 */
process.env.NEXT_PUBLIC_SERVER_URL = "http://" + whiteboardConfig.get<string>('host') + ":" + whiteboardConfig.get<number>('port')
process.env.NEXT_PUBLIC_DRAWIO_URL = whiteboardConfig.get<string>('drawio_url')

/**
 * サーバーのポート番号を設定
 */
const PORT = whiteboardConfig.get<number>('port')

/**
 * 現在の実行環境が開発モードかどうかを判定
 */
const dev = process.env.NODE_ENV !== 'production'

/**
 * Next.jsアプリケーションの初期化
 */
const nextApp = next({ dev })

/**
 * Next.jsのリクエストハンドラーを取得
 */
const handle = nextApp.getRequestHandler()

/**
 * Fastifyインスタンスの作成
 * - ログ機能を有効化
 */
const app: FastifyInstance = fastify({
  logger: true
})

/**
 * WebSocketプラグインの登録
 */
app.register(websocketPlugin)

/**
 * フォルダ関連のルートを登録
 * - プレフィックス: /api/folders
 */
app.register(folderRoutes, { prefix: '/api/folders' })

/**
 * Tldraw関連のルートを登録
 * - プレフィックス: /api/tldraw
 */
app.register(tldrawRoutes, { prefix: '/api/tldraw' })

/**
 * Next.jsのリクエストハンドラーをFastifyに統合
 * - すべてのルートをNext.jsで処理
 */
app.all('/*', async (req, reply) => {
  try {
    await handle(req.raw, reply.raw)
    reply.sent = true
  } catch (err) {
    app.log.error(err)
    reply.status(500).send('Internal Server Error')
  }
})

/**
 * Next.jsの準備が整ったらデータベース接続を行い、サーバーを起動
 */
nextApp.prepare().then(async () => {
  try {
    await AppDataSource.initialize()  // TypeORM の初期化
    app.listen({ port: PORT }, (err) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
      app.log.info(`Server started on port ${PORT}`)
    })
  } catch (err) {
    console.error('TypeORM DataSource init error:', err)
    process.exit(1)
  }
}).catch(err => {
  console.error('Error preparing Next.js:', err)
  process.exit(1)
})
