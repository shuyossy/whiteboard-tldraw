// WhiteboardWithFolders.tsx

"use client";

import React, { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import Split from 'react-split' // react-split のインポート
import SidebarFolders, { TreeData } from '@/app/component/folder/SidebarFolders'
import Whiteboard from '@/app/component/whiteboard/Whiteboard'
import { useRouter, useSearchParams } from "next/navigation"

/**
 * WhiteboardWithFolders.tsx
 *
 * 左側にフォルダおよびボードのツリー表示（SidebarFolders）、
 * 右側に選択されたボードのホワイトボード（Whiteboard）を表示するレイアウトコンポーネント。
 */
export default function WhiteboardWithFolders() {
  /**
   * ツリーデータを保持するステート
   */
  const [treeData, setTreeData] = useState<TreeData>([])

  /**
   * 現在選択されているノードのID（フォルダまたはボード）
   */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  /**
   * 現在選択されているボードのID
   */
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  /**
   * URLの検索パラメータを取得するフック
   */
  const searchParams = useSearchParams();

  /**
   * サイドバーとホワイトボードの分割サイズを管理するステート
   * 初期値: 左10%、右90%
   */
  const [splitSizes, setSplitSizes] = useState([10, 90])

  /**
   * コンポーネントの初回マウント時にツリーデータをサーバーから取得するエフェクト
   */
  useEffect(() => {
    fetchTreeFromServer()
  }, [])

  /**
   * URLの検索パラメータに基づいて初期ボードIDを設定するエフェクト
   */
  useEffect(() => {
    const initialBoardId = searchParams.get("boardId");
    if (initialBoardId !== null) {
      (async () => {
        try {
          const res = await fetch('/api/folders/board/' + initialBoardId + '/exist');
          const data = await res.json();
          if (data.exists) {
            setSelectedBoardId(initialBoardId);
          } else {
            console.log('指定されたboardIdは存在しません');
            setSelectedBoardId(null);
          }
        } catch (error) {
          console.error('エラーが発生しました:', error);
          setSelectedBoardId(null);
        }
      })();
    } else {
      setSelectedBoardId(null);
    }
  }, [searchParams, selectedBoardId]);

  /**
   * Next.jsのルーターを取得するフック
   */
  const router = useRouter();

  /**
   * サーバーからツリーデータを取得する関数
   */
  const fetchTreeFromServer = async () => {
    try {
      const res = await fetch('/api/folders/tree')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ツリーデータの取得に失敗しました')
      }
      const json = await res.json()
      setTreeData(json)
    } catch (err) {
      console.error(err)
      // 必要に応じてUIにエラー表示
    }
  }

  /**
   * ボード選択時に呼び出されるコールバック関数
   * @param boardId 選択されたボードのID
   */
  const handleSelectBoard = (boardId: string | null) => {
    setSelectedBoardId(boardId)
    router.push(`/?boardId=${boardId}`)
  }


  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex' }}>
      <Split
        style={{ display: 'flex', width: '100%', height: '100%' }}
        sizes={splitSizes}
        minSize={[50, 300]}
        maxSize={[600, Infinity]}
        gutterSize={6}
        direction="horizontal"
        cursor="col-resize"
        onDragEnd={(newSizes) => {
          setSplitSizes(newSizes as number[])
        }}
      >
        {/* 左サイドバー部分 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          <SidebarFolders
            treeData={treeData}
            setTreeData={setTreeData}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            selectedBoardId={selectedBoardId}
            onSelectBoard={handleSelectBoard}
            onRefreshTree={fetchTreeFromServer}
          />
        </Box>

        {/* 右ホワイトボード部分 */}
        <Box sx={{ position: 'relative', width: '100%', height: '100%', minWidth: 0 }}>
          {selectedBoardId ? (
            <Whiteboard />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f3f3f3',
              }}
            >
              表示するホワイトボードを選択してください
            </Box>
          )}
        </Box>
      </Split>
    </Box>
  )
}
