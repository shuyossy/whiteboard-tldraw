// FolderService.ts

/**
 * FolderService.ts
 *
 * フォルダ作成、削除、更新、階層制限チェックなどのビジネスロジックを実装。
 * データベースへのCRUD操作はTypeORMのRepositoryを使用。
 * データの重複や存在しないエンティティに対する操作時に例外を投げ、後段でキャッチしてフロントエンドに通知。
 */

import { AppDataSource } from '@/integration/data-source'
import { Folder } from '@/entity/Folder'
import { Board } from '@/entity/Board'
import { TreeData } from '@/app/component/folder/SidebarFolders'

export class FolderService {
  /**
   * フォルダエンティティのリポジトリ
   */
  private folderRepo = AppDataSource.getRepository(Folder)
  
  /**
   * ボードエンティティのリポジトリ
   */
  private boardRepo = AppDataSource.getRepository(Board)

  /**
   * フォルダとボードの全一覧を取得する関数
   * @returns フォルダとボードのオブジェクト
   */
  async getAllFoldersAndBoards() {
    const folders = await this.getAllFolders()
    const boards = await this.getAllBoards()
    return { folders, boards }
  }

  /**
   * フォルダとボードの一覧をツリー形式で取得する関数
   * @returns ツリー形式のフォルダデータ
   */
  async getTreeData() {
    const allFolders = await this.getAllFolders()
    const allBoards = await this.getAllBoards()
    return this.buildFolderTree(allFolders, allBoards, null)
  }

  /**
   * 全てのフォルダを取得する関数
   * @returns フォルダの配列
   */
  async getAllFolders() {
    return this.folderRepo.find()
  }

  /**
   * 全てのボードを取得する関数
   * @returns ボードの配列
   */
  async getAllBoards() {
    return this.boardRepo.find()
  }

  /**
   * 新規フォルダを作成する関数
   * @param folderId 作成するフォルダのID
   * @param name 作成するフォルダの名前
   * @param parentFolderId 親フォルダのID（オプション）
   * @returns 作成されたフォルダエンティティ
   * @throws フォルダIDの重複や階層制限に違反した場合にエラーを投げる
   */
  async createFolder(folderId: string, name: string, parentFolderId?: string | null) {
    // フォルダIDの重複チェック
    const existing = await this.folderRepo.findOne({ where: { folderId } })
    if (existing) {
      // 重複が存在する場合、エラーを投げる
      throw new Error(`フォルダID '${folderId}' は既に存在します。`)
    }

    // 2階層制限のチェック
    if (parentFolderId) {
      const parent = await this.folderRepo.findOne({ where: { folderId: parentFolderId } })
      if (!parent) {
        // 親フォルダが存在しない場合、エラーを投げる
        throw new Error(`親フォルダID '${parentFolderId}' が見つかりません。`)
      }
      if (parent.parentFolderId) {
        // 既に親フォルダがさらに親を持っている場合、3階層目となるためエラーを投げる
        throw new Error('2階層目のフォルダに対して、更にフォルダを作成することはできません。')
      }
    }

    // 新しいフォルダエンティティの作成
    const newFolder = this.folderRepo.create({
      folderId,
      name,
      parentFolderId: parentFolderId || null,
    })
    // フォルダをデータベースに保存
    await this.folderRepo.save(newFolder)
    return newFolder
  }

  /**
   * 新規ボードを作成する関数
   * @param boardId 作成するボードのID
   * @param name 作成するボードの名前
   * @param folderId ボードを所属させるフォルダのID（オプション）
   * @returns 作成されたボードエンティティ
   * @throws ボードIDの重複や存在しないフォルダに対するエラーを投げる
   */
  async createBoard(boardId: string, name: string, folderId?: string | null) {
    // ボードIDの重複チェック
    const existing = await this.boardRepo.findOne({ where: { boardId } })
    if (existing) {
      // 重複が存在する場合、エラーを投げる
      throw new Error(`ボードID '${boardId}' は既に存在します。`)
    }

    // フォルダIDが指定されている場合、そのフォルダの存在を確認
    if (folderId) {
      const parentFolder = await this.folderRepo.findOne({ where: { folderId } })
      if (!parentFolder) {
        // 指定されたフォルダが存在しない場合、エラーを投げる
        throw new Error(`指定フォルダID '${folderId}' が見つかりません。`)
      }
      // 2階層目のフォルダでもボードの作成は許可されているため、深さのチェックは不要
    }

    // 新しいボードエンティティの作成
    const newBoard = this.boardRepo.create({
      boardId,
      name,
      folderId: folderId || null,
    })
    // ボードをデータベースに保存
    await this.boardRepo.save(newBoard)
    return newBoard
  }

  /**
   * フォルダとボードの最新一覧を取得する関数
   * @returns フォルダとボードのオブジェクト
   */
  async refreshFoldersAndBoards() {
    return this.getAllFoldersAndBoards()
  }

  /**
   * 指定フォルダを削除する関数
   * @param folderId 削除対象のフォルダID
   * @returns 削除されたフォルダエンティティ
   * @throws フォルダが存在しない場合にエラーを投げる
   */
  async deleteFolder(folderId: string) {
    // フォルダの存在確認
    const folder = await this.folderRepo.findOne({ where: { folderId } })
    if (!folder) {
      // フォルダが存在しない場合、エラーを投げる
      throw new Error(`フォルダID '${folderId}' が見つかりません。`)
    }
    // フォルダを削除（関連するボードも削除される想定）
    await this.folderRepo.remove(folder)
    return folder
  }

  /**
   * 指定ボードを削除する関数
   * @param boardId 削除対象のボードID
   * @returns 削除されたボードエンティティ
   * @throws ボードが存在しない場合にエラーを投げる
   */
  async deleteBoard(boardId: string) {
    // ボードの存在確認
    const board = await this.boardRepo.findOne({ where: { boardId } })
    if (!board) {
      // ボードが存在しない場合、エラーを投げる
      throw new Error(`ボードID '${boardId}' が見つかりません。`)
    }
    // ボードを削除
    await this.boardRepo.remove(board)
    return board
  }

  /**
   * 指定フォルダの名前を変更する関数
   * @param folderId 名前を変更するフォルダのID
   * @param newName 新しいフォルダ名
   * @returns 更新されたフォルダエンティティ
   * @throws フォルダが存在しない場合にエラーを投げる
   */
  async renameFolder(folderId: string, newName: string) {
    // フォルダの存在確認
    const folder = await this.folderRepo.findOne({ where: { folderId } })
    if (!folder) {
      // フォルダが存在しない場合、エラーを投げる
      throw new Error(`フォルダID '${folderId}' が見つかりません。`)
    }
    // フォルダ名を更新
    folder.name = newName
    // 更新をデータベースに保存
    await this.folderRepo.save(folder)
    return folder
  }

  /**
   * 指定ボードの名前を変更する関数
   * @param boardId 名前を変更するボードのID
   * @param newName 新しいボード名
   * @returns 更新されたボードエンティティ
   * @throws ボードが存在しない場合にエラーを投げる
   */
  async renameBoard(boardId: string, newName: string) {
    // ボードの存在確認
    const board = await this.boardRepo.findOne({ where: { boardId } })
    if (!board) {
      // ボードが存在しない場合、エラーを投げる
      throw new Error(`ボードID '${boardId}' が見つかりません。`)
    }
    // ボード名を更新
    board.name = newName
    // 更新をデータベースに保存
    await this.boardRepo.save(board)
    return board
  }

  /**
   * フォルダツリーを構築する関数
   * @param allFolders 全てのフォルダの配列
   * @param allBoards 全てのボードの配列
   * @param parentFolderId 親フォルダのID（ルートの場合はnull）
   * @returns ツリー形式のフォルダデータ
   */
  buildFolderTree(
    allFolders: Folder[],
    allBoards: Board[],
    parentFolderId: string | null
  ): TreeData {
    // 指定された親フォルダIDを持つフォルダをフィルタリング
    const childrenFolders = allFolders.filter(f => f.parentFolderId === parentFolderId)
  
    // 各フォルダについて再帰的にツリーデータを構築
    const folderNodes = childrenFolders.map(folder => {
      return {
        id: folder.folderId,
        name: folder.name,
        type: 'folder' as 'folder',
        // 再帰的に子フォルダとボードを追加
        children: this.buildFolderTree(allFolders, allBoards, folder.folderId),
      }
    })
  
    // 指定された親フォルダIDを持つボードをフィルタリング
    const childrenBoards = allBoards.filter(b => b.folderId === parentFolderId)
    const boardNodes = childrenBoards.map(board => {
      return {
        id: board.boardId,
        name: board.name,
        type: 'board' as 'board',
      }
    })
  
    // フォルダノードとボードノードを結合してツリーを形成
    return [...folderNodes, ...boardNodes]
  }  

  /**
   * 指定フォルダを新しい親フォルダに移動する関数
   * @param folderId 移動するフォルダのID
   * @param newParentFolderId 新しい親フォルダのID（nullの場合はルート）
   * @returns 更新されたフォルダエンティティ
   * @throws フォルダや新しい親フォルダが存在しない場合にエラーを投げる
   */
  async moveFolder(folderId: string, newParentFolderId: string | null) {
    // フォルダの存在確認
    const folder = await this.folderRepo.findOne({ where: { folderId } })
    if (!folder) {
      // フォルダが存在しない場合、エラーを投げる
      throw new Error(`フォルダID '${folderId}' が見つかりません。`)
    }

    // 新しい親フォルダIDが指定されている場合、そのフォルダの存在を確認
    if (newParentFolderId) {
      const parentFolder = await this.folderRepo.findOne({ where: { folderId: newParentFolderId } })
      if (!parentFolder) {
        // 新しい親フォルダが存在しない場合、エラーを投げる
        throw new Error(`新しい親フォルダID '${newParentFolderId}' が見つかりません。`)
      }
    }

    // フォルダの親フォルダIDを更新
    folder.parentFolderId = newParentFolderId
    // 更新をデータベースに保存
    await this.folderRepo.save(folder)
    return folder
  }

  /**
   * 指定ボードを新しいフォルダに移動する関数
   * @param boardId 移動するボードのID
   * @param newFolderId 新しいフォルダのID（nullの場合はルート）
   * @returns 更新されたボードエンティティ
   * @throws ボードや新しいフォルダが存在しない場合にエラーを投げる
   */
  async moveBoard(boardId: string, newFolderId: string | null) {
    // ボードの存在確認
    const board = await this.boardRepo.findOne({ where: { boardId } })
    if (!board) {
      // ボードが存在しない場合、エラーを投げる
      throw new Error(`ボードID '${boardId}' が見つかりません。`)
    }

    // 新しいフォルダIDが指定されている場合、そのフォルダの存在を確認
    if (newFolderId) {
      const folder = await this.folderRepo.findOne({ where: { folderId: newFolderId } })
      if (!folder) {
        // 新しいフォルダが存在しない場合、エラーを投げる
        throw new Error(`新しいフォルダID '${newFolderId}' が見つかりません。`)
      }
    }

    // ボードのフォルダIDを更新
    board.folderId = newFolderId
    // 更新をデータベースに保存
    await this.boardRepo.save(board)
    return board
  }

  /**
   * 指定フォルダの存在をチェックする関数
   * @param folderId チェックするフォルダのID
   * @returns フォルダが存在する場合はtrue、存在しない場合はfalse
   */
  async checkFolderExists(folderId: string) {
    const count = await this.folderRepo.count({ where: { folderId: folderId } })
    return count > 0
  }

  /**
   * 指定ボードの存在をチェックする関数
   * @param boardId チェックするボードのID
   * @returns ボードが存在する場合はtrue、存在しない場合はfalse
   */
  async checkBoardExists(boardId: string) {
    const count = await this.boardRepo.count({ where: { boardId: boardId } })
    return count > 0
  }
}
