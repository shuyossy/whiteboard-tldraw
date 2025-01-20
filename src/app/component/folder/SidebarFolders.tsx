// SidebarFolders.tsx

import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  TextField,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SyncIcon from '@mui/icons-material/Sync';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FolderIcon from '@mui/icons-material/Folder'
import DescriptionIcon from '@mui/icons-material/Description'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { v4 as uuidv4 } from 'uuid'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

/**
 * ノードの種類を定義する型
 * - フォルダかボードのどちらか
 */
type NodeType = 'folder' | 'board'

/**
 * フォルダノードのインターフェース
 * - 子ノードとしてフォルダまたはボードを持つ
 */
export interface FolderNode {
  id: string
  name: string
  type: 'folder'
  children: (FolderNode | BoardNode)[]
}

/**
 * ボードノードのインターフェース
 */
export interface BoardNode {
  id: string
  name: string
  type: 'board'
}

/**
 * ツリーデータの型
 * - フォルダノードまたはボードノードの配列
 */
export type TreeData = (FolderNode | BoardNode)[]

// ----------------------
// SidebarFolders コンポーネントのプロパティ
// ----------------------
interface SidebarFoldersProps {
  treeData: TreeData
  setTreeData: React.Dispatch<React.SetStateAction<TreeData>>
  selectedNodeId: string | null
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>
  selectedBoardId: string | null
  onSelectBoard: (boardId: string | null) => void

  /**
   * ツリー全体をサーバーから再取得するためのコールバック
   * - 親コンポーネントから受け取る
   */
  onRefreshTree: () => void
}

/**
 * SidebarFolders.tsx
 *
 * フォルダおよびボードのツリー表示コンポーネント
 * - 検索、追加、削除、リネーム、ドラッグ&ドロップによる移動機能を提供
 * - ユーザー操作時にサーバーと同期を行う
 */
export default function SidebarFolders({
  treeData,
  setTreeData,
  selectedNodeId,
  setSelectedNodeId,
  selectedBoardId,
  onSelectBoard,
  onRefreshTree,
}: SidebarFoldersProps) {

  // ---------------------------------------------------
  // ステート定義
  // ---------------------------------------------------

  /**
   * 検索入力の状態
   */
  const [searchTerm, setSearchTerm] = useState('')

  /**
   * 検索結果のマッチノードIDの配列
   */
  const [searchMatches, setSearchMatches] = useState<string[]>([])

  /**
   * 現在の検索結果インデックス
   */
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0)

  /**
   * 新規作成ダイアログの開閉状態
   */
  const [dialogOpen, setDialogOpen] = useState(false)

  /**
   * 新規作成するノードの種類
   */
  const [dialogType, setDialogType] = useState<NodeType>('folder')

  /**
   * 新規作成するノードの名前
   */
  const [newItemName, setNewItemName] = useState('')

  /**
   * 展開中のツリーノードIDの配列
   */
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  /**
   * 選択中のツリーノードID
   */
  const [selectedItems, setSelectedItems] = useState<string | null>(null)

  /**
   * Snackbarの開閉状態
   */
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  /**
   * Snackbarに表示するメッセージ
   */
  const [snackbarMessage, setSnackbarMessage] = useState('')

  /**
   * Snackbarの表示種類（成功またはエラー）
   */
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  /**
   * 右クリックメニューのアンカー位置および対象ノード
   */
  const [contextMenuAnchor, setContextMenuAnchor] = useState<{
    mouseX: number
    mouseY: number
    targetNode: FolderNode | BoardNode | null
  } | null>(null)

  /**
   * リネーム用ダイアログの開閉状態
   */
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)

  /**
   * リネーム対象のノード
   */
  const [renameTarget, setRenameTarget] = useState<FolderNode | BoardNode | null>(null)

  /**
   * リネーム後の新しい名前
   */
  const [renameNewName, setRenameNewName] = useState('')

  /**
   * ドラッグ中のノード
   */
  const [draggingNode, setDraggingNode] = useState<FolderNode | BoardNode | null>(null)

  /**
   * ドロップターゲットとしてホバー中のノードID
   */
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  /**
   * ドロップ可能かどうかの判定結果
   */
  const [canDropHoveredNode, setCanDropHoveredNode] = useState<boolean>(false)

  // ---------------------------------------------------
  // ユーティリティ関数
  // ---------------------------------------------------

  /**
   * 指定されたIDのノードを検索する関数
   * @param nodes 検索対象のノード配列
   * @param id 検索するノードのID
   * @returns 見つかったノードまたはnull
   */
  const findNodeById = useCallback(
    function findNodeByIdFn(nodes: (FolderNode | BoardNode)[], id: string): FolderNode | BoardNode | null {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.type === 'folder') {
          const found = findNodeByIdFn(node.children, id)
          if (found) return found
        }
      }
      return null
    },
    []
  )

  /**
   * 指定されたボードが所属するフォルダのIDを検索する関数
   * @param nodes ツリーデータのノード配列
   * @param boardId 検索対象のボードID
   * @returns 親フォルダのIDまたはnull
   */
  const findParentFolderId = useCallback(
    function findParentFolderIdFn(nodes: TreeData, boardId: string): string | null {
      for (const node of nodes) {
        if (node.type === 'board') continue
        // フォルダの子ノードにボードが存在するか確認
        const foundNode = node.children.find((child) => child.id === boardId)
        if (foundNode) {
          return node.id
        }
        const deeper = findParentFolderIdFn(node.children, boardId)
        if (deeper) return deeper
      }
      return null
    },
    []
  )

  /**
   * 指定フォルダの深度を取得する関数
   * @param id フォルダのID
   * @param nodes ツリーデータのノード配列
   * @param depth 現在の深度
   * @returns フォルダの深度または-1
   */
  const getFolderDepth = useCallback(
    function getFolderDepthFn(id: string, nodes: TreeData, depth = 0): number {
      for (const node of nodes) {
        if (node.id === id && node.type === 'folder') {
          return depth
        }
        if (node.type === 'folder') {
          const foundDepth = getFolderDepthFn(id, node.children as FolderNode[], depth + 1)
          if (foundDepth !== -1) return foundDepth
        }
      }
      return -1
    },
    []
  )

  /**
   * 指定フォルダ配下の最大深度を計算する関数
   * @param folder フォルダノード
   * @param currentDepth 現在の深度
   * @returns 最大深度
   */
  const getMaxNestedDepth = useCallback(function getMaxNestedDepthFn(folder: FolderNode, currentDepth = 0): number {
    let maxDepth = currentDepth
    for (const child of folder.children) {
      if (child.type === 'folder') {
        const childDepth = getMaxNestedDepthFn(child, currentDepth + 1)
        if (childDepth > maxDepth) {
          maxDepth = childDepth
        }
      }
    }
    return maxDepth
  }, [])

  /**
   * ツリーをフォルダ→ボード順、名前の昇順にソートする関数
   * @param nodes ソート対象のノード配列
   * @returns ソート後のノード配列
   */
  const sortTreeRecursive = useCallback(function sortTreeRecursiveFn(
    nodes: (FolderNode | BoardNode)[]
  ): (FolderNode | BoardNode)[] {
    const folders = nodes.filter((n) => n.type === 'folder') as FolderNode[]
    const boards = nodes.filter((n) => n.type === 'board')

    folders.sort((a, b) => a.name.localeCompare(b.name))
    boards.sort((a, b) => a.name.localeCompare(b.name))

    for (const folder of folders) {
      folder.children = sortTreeRecursiveFn(folder.children)
    }
    return [...folders, ...boards]
  }, [])

  /**
   * ツリーデータを更新し、ソートを適用する関数
   * @param updater ツリーデータを更新する関数
   */
  const updateTreeData = useCallback(
    (updater: (prev: TreeData) => TreeData) => {
      setTreeData((prev) => {
        const newData = updater(prev)
        return sortTreeRecursive([...newData]) as TreeData
      })
    },
    [setTreeData, sortTreeRecursive]
  )

  /**
   * Snackbarを表示する関数
   * @param message 表示するメッセージ
   * @param severity 表示の種類（成功またはエラー）
   */
  const handleShowSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  /**
   * Snackbarを閉じる関数
   */
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  // ---------------------------------------------------
  // ツリーの展開・選択ハンドラー
  // ---------------------------------------------------

  /**
   * ツリーの展開状態が変更された際のハンドラー
   * @param _e イベントオブジェクト
   * @param newExpandedIds 新しい展開中のノードIDの配列
   */
  const handleExpandedItemsChange = useCallback((_e: React.SyntheticEvent, newExpandedIds: string[]) => {
    setExpandedItems(newExpandedIds)
  }, [])

  /**
   * ツリーの選択状態が変更された際のハンドラー
   * @param _e イベントオブジェクト
   * @param newSelected 新しく選択されたノードIDまたはnull
   */
  const handleSelectedItemsChange = useCallback(
    (_e: React.SyntheticEvent, newSelected: string | null) => {
      if (newSelected) {
        setSelectedItems(newSelected)
        setSelectedNodeId(newSelected)

        const node = findNodeById(treeData, newSelected)
        if (node && node.type === 'board') {
          onSelectBoard(node.id)
        }
      } else {
        setSelectedItems(null)
        setSelectedNodeId(null)
      }
    },
    [findNodeById, onSelectBoard, setSelectedNodeId, treeData]
  )

  // ---------------------------------------------------
  // 「更新」ボタンハンドラー
  // ---------------------------------------------------

  /**
   * ツリーデータを最新の状態に更新するハンドラー
   */
  const handleRefresh = () => {
    // 親コンポーネントから受け取ったコールバックを実行
    onRefreshTree()
    handleShowSnackbar('最新のフォルダ構成を取得しました', 'success')
  }

  // ---------------------------------------------------
  // 新規作成（フォルダ/ボード）ハンドラー
  // ---------------------------------------------------

  /**
   * 新規作成ダイアログを開くハンドラー
   * @param e クリックイベント
   * @param type 新規作成するノードの種類
   */
  const handleOpenDialog = (e: React.MouseEvent, type: NodeType) => {
    e.stopPropagation()
    setDialogType(type)
    setDialogOpen(true)
    setNewItemName('')
  }

  /**
   * 新規作成ダイアログを閉じるハンドラー
   */
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setNewItemName('')
  }

  /**
   * 新しいノードを追加するハンドラー
   */
  const handleAddNode = async () => {
    try {
      if (!newItemName.trim()) {
        handleShowSnackbar('名前を入力してください', 'error')
        return
      }

      // 新規作成先の親フォルダIDを決定
      let parentFolderId: string | null = null
      if (selectedNodeId) {
        const targetNode = findNodeById(treeData, selectedNodeId)
        if (targetNode) {
          if (targetNode.type === 'folder') {
            parentFolderId = targetNode.id
            // フォルダの深度をチェック
            const depth = getFolderDepth(parentFolderId, treeData)
            if (depth === 1 && dialogType === 'folder') {
              // 2階層目のフォルダにさらにフォルダを作成不可
              handleShowSnackbar('2階層目のフォルダにさらにフォルダは作成できません', 'error')
              return
            }
          } else {
            // ボードが選択されている場合は親フォルダに追加
            const foundFolderId = findParentFolderId(treeData, targetNode.id)
            parentFolderId = foundFolderId ?? null
          }
        }
      }

      if (dialogType === 'folder') {
        // フォルダ作成APIを呼び出し
        const folderId = uuidv4()
        const res = await fetch('/api/folders/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId,
            name: newItemName.trim(),
            parentFolderId: parentFolderId || undefined,
          }),
        })
        if (!res.ok) {
          console.log('res:', res)
          const data = await res.json()
          throw new Error(data.error || 'フォルダ作成に失敗しました')
        }
        handleShowSnackbar('フォルダを作成しました', 'success')
      } else {
        // ボード作成APIを呼び出し
        const boardId = uuidv4()
        const res = await fetch('/api/folders/create-board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boardId,
            name: newItemName.trim(),
            folderId: parentFolderId || undefined,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'ボード作成に失敗しました')
        }
        handleShowSnackbar('ホワイトボードを作成しました', 'success')
      }

      // 作成後にツリーデータを再取得
      onRefreshTree()
      handleCloseDialog()
    } catch (err: any) {
      console.error('handleAddNode error:', err)
      handleShowSnackbar(err.message, 'error')
    }
  }

  // ---------------------------------------------------
  // 削除ハンドラー
  // ---------------------------------------------------

  /**
   * 指定ノードを削除するハンドラー
   * @param nodeId 削除対象のノードID
   */
  const handleDeleteNode = async (nodeId: string) => {
    try {
      const node = findNodeById(treeData, nodeId)
      if (!node) {
        handleShowSnackbar('指定ノードが見つかりません', 'error')
        return
      }

      if (node.type === 'folder') {
        // フォルダ削除APIを呼び出し
        const res = await fetch(`/api/folders/folder/${node.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'フォルダ削除に失敗しました')
        }
        handleShowSnackbar('フォルダを削除しました', 'success')
      } else {
        // ボード削除APIを呼び出し
        const res = await fetch(`/api/folders/board/${node.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'ボード削除に失敗しました')
        }
        handleShowSnackbar('ボードを削除しました', 'success')
      }

      // 削除後にツリーデータを再取得
      onRefreshTree()

      // 削除対象が選択中の場合の選択解除
      if (selectedNodeId === nodeId) {
        setSelectedItems(null)
        setSelectedNodeId(null)
        onSelectBoard(null)
      }
    } catch (err: any) {
      console.error('handleDeleteNode error:', err)
      handleShowSnackbar(err.message, 'error')
    }
  }

  // ---------------------------------------------------
  // リネームハンドラー
  // ---------------------------------------------------

  /**
   * 指定ノードの名前を変更するハンドラー
   * @param targetId リネーム対象のノードID
   * @param newName 新しい名前
   */
  const handleRenameNode = async (targetId: string, newName: string) => {
    try {
      if (!newName.trim()) {
        handleShowSnackbar('名前を入力してください', 'error')
        return
      }

      const node = findNodeById(treeData, targetId)
      if (!node) {
        handleShowSnackbar('指定ノードが見つかりません', 'error')
        return
      }

      if (node.type === 'folder') {
        // フォルダ名変更APIを呼び出し
        const res = await fetch(`/api/folders/folder/${node.id}/rename`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newName: newName.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'フォルダ名変更に失敗しました')
        }
        handleShowSnackbar('フォルダ名を変更しました', 'success')
      } else {
        // ボード名変更APIを呼び出し
        const res = await fetch(`/api/folders/board/${node.id}/rename`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newName: newName.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'ボード名変更に失敗しました')
        }
        handleShowSnackbar('ボード名を変更しました', 'success')
      }

      // 名前変更後にツリーデータを再取得
      onRefreshTree()
    } catch (err: any) {
      console.error('handleRenameNode error:', err)
      handleShowSnackbar(err.message, 'error')
    }
  }

  // ---------------------------------------------------
  // 右クリックメニューハンドラー
  // ---------------------------------------------------

  /**
   * ノード上で右クリックされた際のハンドラー
   * @param e 右クリックイベント
   * @param node 右クリックされたノード
   */
  const handleContextMenu = useCallback((e: React.MouseEvent, node: FolderNode | BoardNode) => {
    e.preventDefault()
    setContextMenuAnchor({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      targetNode: node,
    })
  }, [])

  /**
   * 右クリックメニューを閉じるハンドラー
   */
  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null)
  }

  /**
   * 右クリックメニューの「削除」を選択した際のハンドラー
   */
  const handleContextMenuDelete = () => {
    if (contextMenuAnchor?.targetNode) {
      handleDeleteNode(contextMenuAnchor.targetNode.id)
    }
    handleCloseContextMenu()
  }

  /**
   * 右クリックメニューの「名前の変更」を選択した際のハンドラー
   */
  const handleContextMenuRename = () => {
    if (contextMenuAnchor?.targetNode) {
      setRenameDialogOpen(true)
      setRenameTarget(contextMenuAnchor.targetNode)
      setRenameNewName(contextMenuAnchor.targetNode.name)
    }
    handleCloseContextMenu()
  }

  /**
   * リネームダイアログを閉じるハンドラー
   */
  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false)
    setRenameTarget(null)
    setRenameNewName('')
  }

  /**
   * リネームを適用するハンドラー
   */
  const handleApplyRename = () => {
    if (renameTarget) {
      handleRenameNode(renameTarget.id, renameNewName)
    }
    handleCloseRenameDialog()
  }

  // ---------------------------------------------------
  // ドラッグ&ドロップハンドラー
  // ---------------------------------------------------

  /**
   * ドロップ可能かどうかを判定する関数
   * @param dragNode ドラッグ中のノード
   * @param dropTarget ドロップ先のノードまたは背景
   * @returns ドロップ可能であればtrue、不可であればfalse
   */
  const canDrop = useCallback(
    (dragNode: FolderNode | BoardNode, dropTarget: FolderNode | BoardNode | 'BACKGROUND'): boolean => {
      // フロント側での簡易チェック
      // ※ サーバ側でも最終チェックを行う想定

      if (!dragNode) return false
      if (dropTarget === 'BACKGROUND') return true
      if (dropTarget.type === 'board') return false

      // ボードからフォルダへのドロップは可能
      if (dragNode.type === 'board' && dropTarget.type === 'folder') {
        return true
      }

      // フォルダからフォルダへのドロップ
      if (dragNode.type === 'folder' && dropTarget.type === 'folder') {
        // 自分自身へのドロップは不可
        if (dragNode.id === dropTarget.id) return false
        // 3階層にならないかチェック
        const dropDepth = getFolderDepth(dropTarget.id, treeData)
        const dragMaxNested = getMaxNestedDepth(dragNode)
        const newMaxDepth = dropDepth + dragMaxNested
        if (newMaxDepth >= 1) {
          return false
        }
        return true
      }

      return false
    },
    [getFolderDepth, getMaxNestedDepth, treeData]
  )

  /**
   * ドラッグ開始時のハンドラー
   * @param e ドラッグイベント
   * @param node ドラッグ開始ノード
   */
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, node: FolderNode | BoardNode) => {
    e.stopPropagation()
    setDraggingNode(node)
    e.dataTransfer.setData('text/plain', node.id) // ドラッグ許可用のデータ設定
  }, [])

  /**
   * ドラッグ中にドロップ可能かを判定し、dropEffectを設定するハンドラー
   * @param e ドラッグオーバーイベント
   * @param node ドロップターゲットノード
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, node: FolderNode | BoardNode | 'BACKGROUND') => {
      e.preventDefault()
      e.stopPropagation()
      if (!draggingNode) return
      if (!canDrop(draggingNode, node)) {
        e.dataTransfer.dropEffect = 'none'
        return
      }
      e.dataTransfer.dropEffect = 'move'
    },
    [canDrop, draggingNode]
  )

  /**
   * ドラッグ中にターゲット上に入った際のハンドラー
   * @param e ドラッグエンターイベント
   * @param node ドロップターゲットノード
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>, node: FolderNode | BoardNode | 'BACKGROUND') => {
      if (!draggingNode) return
      e.stopPropagation()
      if (node === 'BACKGROUND') {
        setHoveredNodeId('BACKGROUND')
        setCanDropHoveredNode(canDrop(draggingNode, 'BACKGROUND'))
      } else {
        setHoveredNodeId(node.id)
        setCanDropHoveredNode(canDrop(draggingNode, node))
      }
    },
    [canDrop, draggingNode]
  )

  /**
   * ドロップ実行時のハンドラー
   * @param e ドロップイベント
   * @param dropTarget ドロップ先のノードまたは背景
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, dropTarget: FolderNode | BoardNode | 'BACKGROUND') => {
      e.stopPropagation()
      // ハイライト解除
      setHoveredNodeId(null)
      setCanDropHoveredNode(false)
      if (!draggingNode) return

      // ドロップ可能かの判定
      if (!canDrop(draggingNode, dropTarget)) {
        handleShowSnackbar('ドロップできません', 'error')
        return
      }

      // 新しい親フォルダIDを決定
      let newParentFolderId: string | null = null
      if (dropTarget === 'BACKGROUND') {
        newParentFolderId = null
      } else if (dropTarget.type === 'folder') {
        newParentFolderId = dropTarget.id
      }

      // ローカルツリーデータの更新
      updateTreeData((prev) => {
        // ノードを削除する再帰関数
        const removeNodeRecursively = (nodes: (FolderNode | BoardNode)[], removeId: string) => {
          return nodes.filter((n) => {
            if (n.id === removeId) {
              return false
            }
            if (n.type === 'folder') {
              n.children = removeNodeRecursively(n.children, removeId)
            }
            return true
          })
        }

        let newTree = removeNodeRecursively(prev, draggingNode.id)

        // ノードを挿入する再帰関数
        const insertNodeRecursively = (
          nodes: (FolderNode | BoardNode)[],
          folderId: string | null
        ): (FolderNode | BoardNode)[] => {
          if (!folderId) {
            return [...nodes, draggingNode]
          }
          return nodes.map((n) => {
            if (n.type === 'folder' && n.id === folderId) {
              // 子要素に追加
              (n as FolderNode).children = [...n.children, draggingNode]
              // フォルダを展開
              if (!expandedItems.includes(folderId)) {
                setExpandedItems((prevEx) => [...prevEx, folderId!])
              }
              // ドラッグ元がフォルダなら展開
              if (draggingNode.type === 'folder') {
                setExpandedItems((prevEx) => [...prevEx, draggingNode.id])
              }
              return n
            } else if (n.type === 'folder') {
              n.children = insertNodeRecursively(n.children, folderId)
            }
            return n
          })
        }

        newTree = insertNodeRecursively(newTree, newParentFolderId)
        return newTree as TreeData
      })

      setDraggingNode(null)

      // サーバーに移動を通知
      try {
        if (draggingNode.type === 'folder') {
          const res = await fetch(`/api/folders/folder/${draggingNode.id}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newParentFolderId }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'フォルダ移動に失敗しました')
          }
          handleShowSnackbar('フォルダを移動しました', 'success')
        } else {
          const res = await fetch(`/api/folders/board/${draggingNode.id}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newFolderId: newParentFolderId }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'ボード移動に失敗しました')
          }
          handleShowSnackbar('ボードを移動しました', 'success')
        }
      } catch (err: any) {
        console.error('Move error:', err)
        handleShowSnackbar(err.message, 'error')
        // サーバーエラー時にツリーデータを再取得
        onRefreshTree()
      }
    },
    [
      canDrop,
      draggingNode,
      findParentFolderId,
      expandedItems,
      onRefreshTree,
      treeData,
      updateTreeData,
      handleShowSnackbar,
    ]
  )

  // ---------------------------------------------------
  // ツリーの再帰描画関数
  // ---------------------------------------------------

  /**
   * ツリーノードを再帰的に描画する関数
   * @param node 描画対象のノード
   * @returns 描画されたReactノード
   */
  const renderTree = useCallback(
    function renderTreeFn(node: FolderNode | BoardNode): React.ReactNode {
      const isFolder = node.type === 'folder'
      const nodeIcon = isFolder
        ? <FolderIcon fontSize="small" sx={{ mr: 0.5 }} />
        : <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} />

      const isSelected = selectedBoardId === node.id
      const playIcon = isSelected ? <AutorenewIcon style={{ color: 'green' }} /> : null

      // ドロップハイライトの設定
      const isHovered = hoveredNodeId === node.id
      let labelBorder = 'none'
      let labelBg = 'transparent'
      if (isHovered) {
        labelBorder = canDropHoveredNode ? '2px solid #2196f3' : '2px solid red'
        labelBg = canDropHoveredNode ? 'rgba(33,150,243,0.08)' : 'rgba(255,0,0,0.08)'
      }

      const itemStyle = {
        border: labelBorder,
        backgroundColor: labelBg,
        borderRadius: '4px',
        padding: '2px 4px',
      }

      const label = (
        <Box
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDrop={(e) => handleDrop(e, node)}
          onDragEnter={(e) => handleDragEnter(e, node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          sx={{ display: 'inline-flex', alignItems: 'center' }}
        >
          {playIcon}
          {nodeIcon}
          <Box
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.name}
          </Box>
        </Box>
      )

      if (isFolder) {
        return (
          <TreeItem
            key={node.id}
            itemId={node.id}
            sx={itemStyle}
            label={label}
          >
            {node.children.map((child) => renderTreeFn(child))}
          </TreeItem>
        )
      } else {
        // ボードノードの場合
        return (
          <TreeItem
            key={node.id}
            itemId={node.id}
            sx={itemStyle}
            label={label}
          />
        )
      }
    },
    [
      canDropHoveredNode,
      handleContextMenu,
      handleDragEnter,
      handleDragOver,
      handleDragStart,
      handleDrop,
      hoveredNodeId,
      selectedBoardId,
    ]
  )

  // ---------------------------------------------------
  // 検索機能
  // ---------------------------------------------------

  /**
   * 検索ワードに基づいてツリーを検索し、マッチするノードを設定するエフェクト
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchMatches([])
      setCurrentMatchIndex(0)
      return
    }
    const matches: string[] = []
    const searchNodes = (nodes: (FolderNode | BoardNode)[]) => {
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.push(node.id)
        }
        if (node.type === 'folder') {
          searchNodes(node.children)
        }
      }
    }
    searchNodes(treeData)
    setSearchMatches(matches)
    setCurrentMatchIndex(0)
  }, [searchTerm, treeData])

  /**
   * 検索フィールドでキー押下時のハンドラー
   * @param e キーボードイベント
   */
  const handleKeyDownOnSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchMatches.length > 0) {
        setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length)
      }
    }
  }

  const currentSearchNodeId = searchMatches.length ? searchMatches[currentMatchIndex] : null
  const effectiveSelectedId = currentSearchNodeId ?? selectedItems ?? ''

  // 背景ドロップハイライトの設定
  const isBackgroundHovered = hoveredNodeId === 'BACKGROUND'
  let backgroundBorder = 'none'
  let backgroundBg = 'transparent'
  if (isBackgroundHovered) {
    backgroundBorder = '2px solid #2196f3'
    backgroundBg = 'rgba(33,150,243,0.08)'
  }

  // ---------------------------------------------------
  // レンダリング
  // ---------------------------------------------------
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: '50px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={() => {
        // 背景クリック時の選択解除
        setSelectedNodeId(null)
        setSelectedItems(null)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        setHoveredNodeId(null)
        setCanDropHoveredNode(false)
        handleDrop(e, 'BACKGROUND')
      }}
      onDragEnter={(e) => handleDragEnter(e, 'BACKGROUND')}
      onDragEnd={() => {
        setHoveredNodeId(null)
        setCanDropHoveredNode(false)
      }}
    >
      {/* ヘッダー：検索バー */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <SearchIcon sx={{ mr: 1, flexShrink: 0 }} />
        <TextField
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDownOnSearch}
          placeholder="フォルダ/ボード検索"
          fullWidth
        />
      </Box>
      <Divider />

      {/* 新規作成および更新ボタン群 */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center', flexShrink: 0 }}>
        <Tooltip title="新規フォルダ作成">
          <IconButton onClick={(e) => handleOpenDialog(e, 'folder')}>
            <CreateNewFolderIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="新規ホワイトボード作成">
          <IconButton onClick={(e) => handleOpenDialog(e, 'board')}>
            <NoteAddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="最新のフォルダ構成を取得">
          <IconButton onClick={handleRefresh}>
            <SyncIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      {/* ツリー表示エリア */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 2 }} onClick={(e) => e.stopPropagation()}>
        <SimpleTreeView
          slots={{ expandIcon: ChevronRightIcon, collapseIcon: ExpandMoreIcon }}
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
          selectedItems={effectiveSelectedId}
          onSelectedItemsChange={handleSelectedItemsChange}
          multiSelect={false}
          itemChildrenIndentation="16px"
          sx={{
            border: backgroundBorder,
            backgroundColor: backgroundBg,
            '& .MuiTreeItem-content': {
              minWidth: 0,
            },
            '& .MuiTreeItem-content .MuiTreeItem-label': {
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'middle',
            },
            '& .MuiTreeItem-root': {
              marginBottom: '4px',
            },
            '& .Mui-focused > .MuiTreeItem-content': {
              backgroundColor: 'rgba(25,118,210,0.12)',
            },
            '& .Mui-selected > .MuiTreeItem-content': {
              backgroundColor: 'rgba(25,118,210,0.2)',
            },
          }}
        >
          {treeData.map((rootNode) => renderTree(rootNode))}
        </SimpleTreeView>
      </Box>

      {/* 新規作成ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>{dialogType === 'folder' ? '新規フォルダ作成' : '新規ホワイトボード作成'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="名前"
            type="text"
            fullWidth
            variant="standard"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleAddNode} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* リネームダイアログ */}
      <Dialog open={renameDialogOpen} onClose={handleCloseRenameDialog}>
        <DialogTitle>名前の変更</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新しい名前"
            type="text"
            fullWidth
            variant="standard"
            value={renameNewName}
            onChange={(e) => setRenameNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRenameDialog}>キャンセル</Button>
          <Button onClick={handleApplyRename} variant="contained">
            変更
          </Button>
        </DialogActions>
      </Dialog>

      {/* 右クリックメニュー */}
      <Menu
        open={contextMenuAnchor !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenuAnchor
            ? { top: contextMenuAnchor.mouseY, left: contextMenuAnchor.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuDelete}>削除</MenuItem>
        <MenuItem onClick={handleContextMenuRename}>名前の変更</MenuItem>
      </Menu>

      {/* Snackbar通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
