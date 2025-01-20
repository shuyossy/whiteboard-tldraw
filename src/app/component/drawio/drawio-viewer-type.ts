// drawio-viewer-type.ts

import { TLBaseShape } from "tldraw"

/**
 * カスタムシェイプ「drawioviewer-custom-shape」の型定義
 */
export type DrawioViewerCustomShape = TLBaseShape<
    'drawioviewer-custom-shape',
    {
        w: number
        h: number
        xml: string
    }
>