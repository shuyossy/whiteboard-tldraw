// DrawioViewerCustomShape.tsx

import {
	BaseBoxShapeUtil,
	Geometry2d,
	RecordProps,
	Rectangle2d,
	TLResizeInfo,
	resizeBox,
} from 'tldraw'
import DrawioViewer from './DrawioViewer'
import { drawioViewerMigrations } from './drawio-viewer-migrations'
import { drawioViewerProps } from './drawio-viewer-props'
import { DrawioViewerCustomShape } from './drawio-viewer-type'


/**
 * DrawioViewerCustomShapeのユーティリティクラス
 */
class DrawioViewerCustomShapeUtil extends BaseBoxShapeUtil<DrawioViewerCustomShape> {

	/** シェイプのタイプを定義 */
	static override type = 'drawioviewer-custom-shape' as const

	/** シェイプのプロパティを定義 */
	static override props: RecordProps<DrawioViewerCustomShape> = drawioViewerProps

	/** シェイプのプロパティマイグレーションを追加 */
	static override migrations = drawioViewerMigrations;

	/**
	 * シェイプのデフォルトプロパティを取得
	 * @returns デフォルトプロパティ
	 */
	getDefaultProps(): DrawioViewerCustomShape['props'] {
		return {
			w: 600,    // デフォルトの幅
			h: 600,    // デフォルトの高さ
			xml: "",   // デフォルトのXMLは空文字
		}
	}

	/**
	 * シェイプが編集可能かどうかを返す
	 * @returns 編集不可
	 */
	override canEdit() {
		return false
	}

	/**
	 * シェイプがリサイズ可能かどうかを返す
	 * @returns リサイズ可能
	 */
	override canResize() {
		return true
	}

	/**
	 * シェイプのアスペクト比が固定されているかどうかを返す
	 * @returns アスペクト比固定されていない
	 */
	override isAspectRatioLocked() {
		return false
	}

	/**
	 * シェイプのジオメトリを取得
	 * @param shape シェイプのインスタンス
	 * @returns ジオメトリ情報
	 */
	getGeometry(shape: DrawioViewerCustomShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,          // 幅
			height: shape.props.h,         // 高さ
			isFilled: false,               // 塗りつぶしなし
		})
	}

	/**
	 * シェイプがリサイズされた際の処理
	 * @param shape シェイプのインスタンス
	 * @param info リサイズ情報
	 * @returns リサイズ後のシェイプ
	 */
	override onResize(shape: any, info: TLResizeInfo<any>) {
		return resizeBox(shape, info)
	}

	/**
	 * シェイプをレンダリングするためのコンポーネント
	 * @param shape シェイプのインスタンス
	 * @returns JSX要素
	 */
	component(shape: DrawioViewerCustomShape) {
		/**
		 * XMLデータを保存するハンドラ
		 * @param xml 保存するXML文字列
		 */
		const handleSave = (xml: string) => {
			this.editor.updateShape<DrawioViewerCustomShape>({
				id: shape.id,
				type: 'drawioviewer-custom-shape',
				props: { xml: xml },
			})
		}

		return (
			<DrawioViewer
				height={shape.props.h} // シェイプの高さ
				width={shape.props.w}  // シェイプの幅
				xml={shape.props.xml}  // シェイプに紐づくXMLデータ
				checkEventTarget={() => {
					// カーソルがシェイプ内にあるかを判定
					const { x, y } = shape
					const { w, h } = shape.props
					const { currentPagePoint } = this.editor.inputs
					return x < currentPagePoint.x && currentPagePoint.x < x + w && y < currentPagePoint.y && currentPagePoint.y < y + h
				}}
				handleDrawioSave={handleSave} // XML保存時のハンドラを設定
			/>
		)
	}

	/**
	 * シェイプのインジケーターを描画
	 * @param shape シェイプのインスタンス
	 * @returns JSX要素
	 */
	indicator(shape: DrawioViewerCustomShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}

export default DrawioViewerCustomShapeUtil
export type { DrawioViewerCustomShape }
