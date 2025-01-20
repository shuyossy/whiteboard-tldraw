// Whiteboard.tsx

"use client"

import { useSync } from '@tldraw/sync'
import {
	DefaultKeyboardShortcutsDialog,
	DefaultKeyboardShortcutsDialogContent,
	defaultShapeUtils,
	DefaultToolbar,
	DefaultToolbarContent,
	TLAssetStore,
	TLComponents,
	TLUserPreferences,
	Tldraw,
	TldrawUiMenuItem,
	TLUiOverrides,
	useTldrawUser,
	useIsToolSelected,
	useTools,
} from 'tldraw'
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import DrawioViewerCustomShapeUtil from '@/app/component/drawio/DrawioViewerCustomShape'
import { DrawioViewerTool } from '@/app/component/drawio/DrawioViewerTool'
import { useMemo, useState } from 'react'
import { useSearchParams } from "next/navigation"

/**
 * サーバーのURLを環境変数から取得
 */
const WORKER_URL = process.env.NEXT_PUBLIC_SERVER_URL

/**
 * カスタムツールの配列
 */
const custmTools = [DrawioViewerTool]

/**
 * アセットのURLを取得
 */
const assetUrls = getAssetUrls({ baseUrl: '/tldraw-assets' })
// @ts-expect-error
assetUrls.icons['drawio-icon'] = './drawio/drawio-icon.svg'

/**
 * 現在のボードIDを格納する変数
 */
let boardId: string | null;

/**
 * Whiteboardコンポーネント
 *
 * ホワイトボードの描画および同期機能を提供
 * - マルチプレイヤー対応
 * - カスタムツールおよびシェイプの利用
 * - アセットの管理
 */
function Whiteboard() {
	/**
	 * URLの検索パラメータを取得
	 */
	const searchParams = useSearchParams()
	/**
	 * ボードIDを検索パラメータから取得
	 */
	boardId = searchParams.get("boardId")

	/**
	 * カスタムシェイプユーティリティの配列
	 */
	const customShapeUtils = [DrawioViewerCustomShapeUtil]

	/**
	 * ユーザーの設定状態
	 */
	const [userPreferences, setUserPreferences] = useState<TLUserPreferences>({
		id: 'my-user-' + Math.random(),
		name: '名無し'
	})

	/**
	 * マルチプレイヤーに接続されたストアを作成
	 */
	const store = useSync({
		/**
		 * WebSocketのURIを設定
		 */
		uri: `${WORKER_URL}/api/tldraw/connect/${boardId}`,
		/**
		 * 静的アセット（画像や動画）の取り扱い方法を設定
		 */
		assets: multiplayerAssets,
		/**
		 * シェイプユーティリティを設定
		 */
		shapeUtils: useMemo(() => [...customShapeUtils, ...defaultShapeUtils], []),
		/**
		 * ユーザー情報を設定
		 */
		userInfo: userPreferences,
	})

	/**
	 * Tldrawユーザーを設定
	 */
	const user = useTldrawUser({ userPreferences, setUserPreferences })

	return (
		<div style={{ height: '100%', width: '100%' }}>
			<Tldraw
				/**
				 * 接続されたストアをTldrawコンポーネントに渡す
				 * - ローディング状態やマルチプレイヤーのUXを管理
				 */
				store={store}
				/**
				 * カスタムシェイプユーティリティを渡す
				 */
				shapeUtils={customShapeUtils}
				/**
				 * カスタムツールクラスの配列を渡す
				 */
				tools={custmTools}
				/**
				 * UIのオーバーライドを渡す
				 */
				overrides={uiOverrides}
				/**
				 * カスタムコンポーネントを渡す
				 */
				components={components}
				/**
				 * 深いリンクを有効化
				 */
				deepLinks
				/**
				 * カスタムアセットのURLを渡す
				 */
				assetUrls={assetUrls}
				/**
				 * コンポーネントのマウント時に実行される処理
				 */
				onMount={(editor) => {
					// @ts-expect-error
					window.editor = editor
					/**
					 * アセットを削除する際の処理を登録
					 */
					editor.sideEffects.registerAfterDeleteHandler('shape', async (shape) => {
						if ((shape.type === 'image' || shape.type === 'bookmark')) {
							// @ts-expect-error
							const url = getAssetUrl(shape.props.assetId, editor.getCurrentPage().id)
							const response = await fetch(url, { method: 'DELETE' })
							if (!response.ok) {
								console.error('Failed to delete asset', response.statusText)
							}
						}
					})
					/**
					 * ページを削除する際にそのページ内の全てのアセットを削除する処理を登録
					 */
					editor.sideEffects.registerAfterDeleteHandler('page', async (page) => {
						const url = getPageUrl(page.id)
						const response = await fetch(url, { method: 'DELETE' })
						if (!response.ok) {
							console.error('Failed to delete asset when page is deleted', response.statusText)
						}
					})
				}}
				/**
				 * ユーザー情報を渡す
				 */
				user={user}
			/>
		</div>
	)
}

/**
 * アセット関連の処理を定義するストア
 */
const multiplayerAssets: TLAssetStore = {
	/**
	 * アセットをアップロードする関数
	 * @param _asset アップロードするアセット
	 * @param file アップロードするファイル
	 * @returns アセットのURL
	 */
	async upload(_asset, file) {
		if (_asset.type === 'video') throw new Error('Videos are not supported')
		// @ts-expect-error
		const url = getAssetUrl(_asset.id, window.editor.getCurrentPage().id)

		const response = await fetch(url, {
			method: 'PUT',
			body: file,
		})

		if (!response.ok) throw new Error(`Failed to upload asset: ${response.statusText}`)

		return url
	},
	/**
	 * アセットを取得する関数
	 * @param asset 取得するアセット
	 * @returns アセットのソースURL
	 */
	resolve(asset) {
		return asset.props.src
	},
}

/**
 * アセットのURLを生成する関数
 * @param assetId アセットのID
 * @param pageId ページのID
 * @returns アセットのURL
 */
function getAssetUrl(assetId: string, pageId: string): string {
	if (!boardId) throw new Error('boardId is not set')
	return `${WORKER_URL}/api/tldraw/assets/${encodeURIComponent(boardId)}/${encodeURIComponent(pageId)}/${encodeURIComponent(assetId)}`
}

/**
 * ページのURLを生成する関数
 * @param pageId ページのID
 * @returns ページのURL
 */
function getPageUrl(pageId: string): string {
	if (!boardId) throw new Error('boardId is not set')
	return `${WORKER_URL}/api/tldraw/page/${encodeURIComponent(boardId)}/${encodeURIComponent(pageId)}`
}

/**
 * UIのオーバーライド設定
 */
const uiOverrides: TLUiOverrides = {
	/**
	 * ツールバーのツールを編集する関数
	 * @param editor エディターインスタンス
	 * @param tools 既存のツール
	 * @returns 編集後のツール
	 */
	tools(editor, tools) {
		// UIのコンテキストにツールアイテムを作成
		tools.drawioviewer = {
			id: 'drawioviewer',
			icon: 'drawio-icon',
			label: 'Drawio',
			kbd: 's',
			onSelect: () => {
				editor.setCurrentTool('drawioviewer')
			},
		}
		return tools
	},
}

/**
 * カスタムコンポーネントの設定
 */
const components: TLComponents = {
	/**
	 * ツールバーコンポーネントのカスタマイズ
	 * @param props ツールバーのプロパティ
	 * @returns カスタマイズされたツールバーコンポーネント
	 */
	Toolbar: (props) => {
		const tools = useTools()
		const isDrawioViewerSelected = useIsToolSelected(tools['drawioviewer'])
		return (
			<DefaultToolbar {...props}>
				<DefaultToolbarContent />
				<TldrawUiMenuItem {...tools['drawioviewer']} isSelected={isDrawioViewerSelected} />
			</DefaultToolbar>
		)
	},
	/**
	 * キーボードショートカットダイアログのカスタマイズ
	 * @param props ダイアログのプロパティ
	 * @returns カスタマイズされたキーボードショートカットダイアログコンポーネント
	 */
	KeyboardShortcutsDialog: (props) => {
		const tools = useTools()
		return (
			<DefaultKeyboardShortcutsDialog {...props}>
				<DefaultKeyboardShortcutsDialogContent />
				{/* ツールグループにインタリーブする理想的な場所 */}
				<TldrawUiMenuItem {...tools['drawioviewer']} />
			</DefaultKeyboardShortcutsDialog>
		)
	},
}

export default Whiteboard
