// drawio-viewer-migrations.ts

import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "tldraw";

/**
 * シェイプのプロパティマイグレーション用のバージョンIDを作成
 */
const Versions = createShapePropsMigrationIds('drawioviewer-custom-shape', {
    AddXML: 1, // 初期マイグレーションとしてXMLプロパティを追加
})

/**
 * シェイプのプロパティマイグレーションのシーケンスを定義
 */
export const drawioViewerMigrations = createShapePropsMigrationSequence({
    sequence: [
        {
            id: Versions.AddXML,
            /**
             * マイグレーションを適用する際の処理
             * @param props シェイプのプロパティ
             */
            up(props) {
                props.xml = ''; // XMLプロパティを空文字で初期化
            },
            /**
             * マイグレーションを元に戻す際の処理
             * @param props シェイプのプロパティ
             */
            down(props) {
                delete props.xml; // XMLプロパティを削除
            },
        },
    ],
});