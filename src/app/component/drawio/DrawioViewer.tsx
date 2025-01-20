// DrawioViewer.tsx

import React, { useState, useEffect, useRef } from 'react';
import { DrawIoEmbed, DrawIoEmbedRef, EventAutoSave, EventExit, EventSave } from 'react-drawio';
import Tooltip from '@mui/material/Tooltip';

/**
 * Propsインターフェース
 * @interface Props
 * @property {number} height - コンポーネントの高さ
 * @property {number} width - コンポーネントの幅
 * @property {string} xml - 初期の.drawio (XML) データ
 * @property {() => boolean} checkEventTarget - イベントターゲットが自身かどうかを判定する関数
 * @property {(xml: string) => void} handleDrawioSave - 保存時のコールバック関数
 */
interface Props {
  height: number; // コンポーネントの高さ
  width: number; // コンポーネントの幅
  xml: string; // 初期の.drawio (XML) データ
  checkEventTarget: () => boolean; // イベントターゲットが自身かどうかを判定する関数
  handleDrawioSave: (xml: string) => void; // 保存時のコールバック関数
}

/**
 * DrawioViewerコンポーネント
 * @param {Props} props - コンポーネントのプロパティ
 * @returns {JSX.Element} JSX要素
 */
const DrawioViewer: React.FC<Props> = ({
  height,
  width,
  xml,
  checkEventTarget,
  handleDrawioSave,
}) => {
  /**
   * 現在のXMLデータを保持する状態
   * 初期値はpropsから受け取ったxml
   */
  const [currentXml, setCurrentXml] = useState(xml);

  /**
   * プレビュー表示中か編集中かを管理する状態フラグ
   * 初期状態はプレビュー表示(true)
   */
  const [isPreviewMode, setPreviewMode] = useState(true);

  /**
   * Draw.ioエディタを操作するための参照(ref)
   */
  const drawioRef = useRef<DrawIoEmbedRef>(null);

  /**
   * props.xmlが変更されたときにcurrentXmlを更新する
   */
  useEffect(() => {
    setCurrentXml(xml);
  }, [xml]);

  /**
   * currentXmlが変更されたときにDraw.ioエディタに新しいXMLをロードする
   */
  useEffect(() => {
    if (drawioRef.current) {
      drawioRef.current.load({
        xml: currentXml,
        autosave: true,
      });
    }
  }, [currentXml]);

  /**
   * 「編集」ボタンがクリックされたときのハンドラー
   * イベントターゲットが自身であればプレビューモードを解除する
   */
  const handleEditClick = () => {
    if (checkEventTarget()) setPreviewMode(false);
  };

  /**
   * Draw.io側で保存操作が行われたときのハンドラー
   * @param {EventAutoSave | EventSave} data - 保存イベントのデータ
   */
  const handleSave = (data: EventAutoSave | EventSave) => {
    if (checkEventTarget() && 'xml' in data) {
      handleDrawioSave(data.xml);
      setCurrentXml(data.xml);
    }
  };

  /**
   * Draw.ioエディタが閉じられたときのハンドラー
   * プレビューモードに戻す
   * @param {EventExit} data - 閉じるイベントのデータ
   */
  const handleClose = (data: EventExit) => {
    if (checkEventTarget()) setPreviewMode(true);
  };

  return (
    <div
      style={{
        width: '100%', // コンポーネントの幅を100%に設定
        height: '100%', // コンポーネントの高さを100%に設定
        position: 'relative', // 相対位置に設定
        padding: '15px', // 内側の余白を15pxに設定
        pointerEvents: 'all', // すべてのポインターイベントを許可
      }}
    >
      <DrawIoEmbed
        // プレビューと編集モードの切り替え時に再レンダリングを強制するためのキー
        key={isPreviewMode ? 'preview' : 'edit'}
        ref={drawioRef} // Draw.ioエディタへの参照を設定
        xml={currentXml} // 現在のXMLデータを渡す
        autosave={true} // 自動保存を有効にする
        onAutoSave={handleSave} // 自動保存時のコールバック関数を設定
        onSave={handleSave} // 保存時のコールバック関数を設定
        onClose={handleClose} // エディタが閉じられたときのコールバック関数を設定
        urlParameters={{
          close: true, // エディタを閉じる機能を有効にする
          chrome: !isPreviewMode, // プレビュー時はchromeを無効にする
          saveAndExit: false, // 保存して終了するボタンを無効にする
          noSaveBtn: true, // 保存ボタンを非表示にする
          noExitBtn: false, // 終了ボタンを表示する
        }}
        baseUrl={process.env.NEXT_PUBLIC_DRAWIO_URL} // Draw.ioのベースURLを環境変数から取得
      />
      {/* プレビュー時にオーバーレイを表示して編集モードへの切り替えを可能にする */}
      {isPreviewMode && (
        <Tooltip title="クリックで編集" placement="top">
          <div
            style={{
              position: 'absolute', // 絶対位置に設定
              top: 0, // 上端を0に設定
              left: 0, // 左端を0に設定
              width: '100%', // 幅を100%に設定
              height: '100%', // 高さを100%に設定
              zIndex: 999, // 他の要素より前面に表示
              backgroundColor: 'transparent', // 背景色を透明に設定
              cursor: 'pointer', // カーソルをポインターに設定
            }}
            onClick={handleEditClick} // クリック時に編集モードに切り替える
            // イベントの伝播を防止して他の要素に影響を与えないようにする
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default DrawioViewer;
