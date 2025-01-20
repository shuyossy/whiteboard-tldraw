// drawio-viewer-props.ts

import { RecordProps, T } from 'tldraw'
import { DrawioViewerCustomShape } from './drawio-viewer-type'

/** シェイプのプロパティを定義 */
export const drawioViewerProps: RecordProps<DrawioViewerCustomShape> = {
	w: T.number,
	h: T.number,
	xml: T.string,
}