CREATE TABLE IF NOT EXISTS folders (
  folder_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_folders_parent_folder
    FOREIGN KEY (parent_folder_id)
    REFERENCES folders(folder_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS boards (
  board_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_boards_folder
    FOREIGN KEY (folder_id)
    REFERENCES folders(folder_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tldraw_rooms (
  room_id TEXT PRIMARY KEY,
  snapshot JSONB NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tldraw_rooms_boards
    FOREIGN KEY (room_id)
    REFERENCES boards(board_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tldraw_assets (
  id SERIAL PRIMARY KEY,
  asset_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  page_id TEXT,
  data BYTEA NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_tldraw_assets UNIQUE (asset_id, room_id, page_id),
  CONSTRAINT fk_tldraw_assets_boards
    FOREIGN KEY (room_id)
    REFERENCES boards(board_id)
    ON DELETE CASCADE
);
