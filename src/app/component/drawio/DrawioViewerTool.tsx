// DrawioViewerTool.tsx

import { StateNode } from 'tldraw'

// オフセット値の定義
const OFFSET = 12

/**
 * DrawioViewerToolクラス
 * tldrawのStateNodeを継承したカスタムツール
 */
export class DrawioViewerTool extends StateNode {
    /**
     * ツールの識別子
     */
    static override id = 'drawioviewer'

    /**
     * ツールの状態に入ったときの処理
     * カーソルをクロスタイプに設定
     */
    override onEnter() {
        this.editor.setCursor({ type: 'cross', rotation: 0 })
    }

    /**
     * ポインタが押されたときの処理
     * カスタムシェイプの作成とツールの切り替えを行う
     */
    override onPointerDown() {
        // 現在のページ上のポイントを取得
        const { currentPagePoint } = this.editor.inputs
        // カスタムシェイプの作成
        this.editor.createShape({
            type: 'drawioviewer-custom-shape',
            x: currentPagePoint.x - OFFSET,
            y: currentPagePoint.y - OFFSET,
            props: { xml: '' },
        })
        // 現在のツールを選択ツールに変更
        this.editor.setCurrentTool('select')
    }
}
