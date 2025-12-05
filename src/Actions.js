const ACTIONS = {
  // legacy room-wide editing block (no longer used in UI but kept for compatibility)
  BLOCK_EDITING: "block-editing",
  EDITING_BLOCKED: "editing-blocked",

  // room and presence
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",

  // editor
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",

  // terminal
  TERMINAL_RUN: "terminal-run",
  TERMINAL_OUTPUT: "terminal-output",
  TERMINAL_INPUT: "terminal-input",

  // per-user permissions and raise-hand
  SET_USER_PERMISSION: "set-user-permission", // client -> server (admin only)
  PERMISSION_UPDATE: "permission-update", // server -> clients (broadcast current permissions state)
  RAISE_HAND: "raise-hand", // client -> server (non-admin typically)

  // active editor indicator
  TYPING: "typing", // client -> server (shared tab only)
  ACTIVE_EDITOR: "active-editor", // server -> clients (who is currently editing)

  // admin moderation
  KICK_USER: "kick-user", // client -> server (admin requests removing a user)
  USER_KICKED: "user-kicked", // server -> client (notifies target they were kicked)
};

module.exports = ACTIONS;
