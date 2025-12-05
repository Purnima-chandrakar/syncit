import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import Terminal from "../components/Terminal";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const [editingBlocked, setEditingBlocked] = useState(false); // legacy room-wide toggle
  const [host, setHost] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [permissions, setPermissions] = useState({}); // {socketId: boolean}
  const [hands, setHands] = useState([]); // [socketId]
  const [activeEditorId, setActiveEditorId] = useState(null);
  const socketRef = useRef(null);
  const codeRef = useRef(""); // shared buffer
  const personalCodeRef = useRef(""); // personal buffer
  const [activeTab, setActiveTab] = useState("shared"); // 'shared' | 'personal'
  const activeTabRef = useRef("shared"); // track latest tab in event handlers
  const displayRef = useRef(""); // what is currently shown in the editor UI
  const editorComponentRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  // This effect initializes and manages the socket connection. We intentionally
  // omit transient values (like `clients`) from the dependency array so the
  // socket initialization and handler registration only run once on mount.
  // Re-running this effect on every clients/permission change would cause
  // duplicate event subscriptions and unexpected behavior. The handlers
  // themselves update React state when needed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      const subscribeHandlers = () => {
        // remove old to avoid dupes
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.EDITING_BLOCKED);
        socketRef.current.off(ACTIONS.PERMISSION_UPDATE);
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.ACTIVE_EDITOR);
        socketRef.current.off(ACTIONS.USER_KICKED);
        socketRef.current.off('kick-success');
        socketRef.current.off('kick-error');

        // joined
        socketRef.current.on(
          ACTIONS.JOINED,
          ({ clients, username, socketId }) => {
            if (clients.length > 0) setHost(clients[0].username);
            if (username !== location.state?.username) {
              toast.success(`${username} joined the room.`);
            }
            setClients(clients);
            // sync our current shared buffer to the new peer
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId,
              mode: 'shared',
            });
          }
        );

        // disconnected
        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setClients((prev) => prev.filter((c) => c.socketId !== socketId));
        });

        // user was kicked by admin
        socketRef.current.on(ACTIONS.USER_KICKED, ({ reason }) => {
          toast.error(reason || 'You were removed from the room.');
          setTimeout(() => {
            reactNavigator('/', { state: { message: reason } });
          }, 500);
        });

        // kick result feedback for admin
        socketRef.current.on('kick-success', ({ username }) => {
          toast.success(`Removed ${username} from the room.`);
        });
        socketRef.current.on('kick-error', ({ error }) => {
          toast.error(error || 'Failed to remove user.');
        });

        // legacy block toggle
        socketRef.current.on(ACTIONS.EDITING_BLOCKED, ({ blocked }) => {
          setEditingBlocked(blocked);
        });

        // permissions and hands
        socketRef.current.on(
          ACTIONS.PERMISSION_UPDATE,
          ({ adminId, permissions, hands }) => {
            setAdminId(adminId || null);
            setPermissions(permissions || {});
            setHands(hands || []);
          }
        );

        // who is actively editing (shared)
        socketRef.current.on(ACTIONS.ACTIVE_EDITOR, ({ socketId }) => {
          setActiveEditorId(socketId || null);
        });

        // centralized shared code updates
        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
          if (typeof code === "string") {
            codeRef.current = code; // always update shared buffer
            if (
              activeTabRef.current === "shared" &&
              editorComponentRef.current?.setValue
            ) {
              if (displayRef.current !== code) {
                editorComponentRef.current.setValue(code);
                displayRef.current = code;
              }
            }
          }
        });
      };

      // load personal buffer from sessionStorage (per-tab storage)
      try {
        const key = `personal:${roomId}:${location.state?.username}`;
        const saved = sessionStorage.getItem(key);
        if (saved) {
          personalCodeRef.current = saved;
          displayRef.current = saved; // also set display so it shows on tab switch
        }
      } catch (e) {}

      // initial connect
      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      socketRef.current.on("connect", () => {
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });
        subscribeHandlers();
      });

      // reconnect
      socketRef.current.on("reconnect", () => {
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });
        subscribeHandlers();
        // push our current shared buffer to all peers we know
        const peers = clients || [];
        peers.forEach((p) => {
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId: p.socketId,
            mode: 'shared',
          });
        });
      });

      socketRef.current.on("reconnect_attempt", () => {});
      socketRef.current.on("reconnect_error", (e) =>
        console.warn("reconnect_error", e)
      );
    };
    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("reconnect");
        socketRef.current.off("reconnect_attempt");
        socketRef.current.off("reconnect_error");
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.EDITING_BLOCKED);
        socketRef.current.off(ACTIONS.PERMISSION_UPDATE);
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.ACTIVE_EDITOR);
        socketRef.current.off(ACTIONS.USER_KICKED);
        socketRef.current.off('kick-success');
        socketRef.current.off('kick-error');
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const isHost = location.state?.username === host;
  const mySocketId = socketRef.current?.id;
  const isAdmin = adminId && mySocketId === adminId;

  const handleBlockEditing = () => {
    if (!socketRef.current) return;
    socketRef.current.emit(ACTIONS.BLOCK_EDITING, {
      roomId,
      blocked: !editingBlocked,
    });
  };

  const toggleUserPermission = (targetSocketId) => {
    if (!socketRef.current) return;
    const current = permissions?.[targetSocketId] !== false; // default true
    socketRef.current.emit(ACTIONS.SET_USER_PERMISSION, {
      roomId,
      targetSocketId,
      canEdit: !current,
    });
  };

  const setHand = (raised) => {
    if (!socketRef.current) return;
    socketRef.current.emit(ACTIONS.RAISE_HAND, { roomId, raised });
  };

  // Save file handler (uses active tab)
  const handleSaveFile = () => {
    const code = activeTab === "shared" ? codeRef.current || "" : personalCodeRef.current || "";
    let filename = window.prompt(
      "Enter filename (with extension, e.g. myfile.js):",
      activeTab === "shared" ? "shared.txt" : "personal.txt"
    );
    if (!filename) return;
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Open file handler (contextual: shared vs personal)
  const handleOpenFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (text !== undefined && text !== null) {
        if (activeTab === "shared") {
          codeRef.current = text;
          if (editorComponentRef.current?.setValue) {
            editorComponentRef.current.setValue(text);
          }
          displayRef.current = text;
          if (socketRef.current) {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
              roomId,
              code: text,
              mode: 'shared',
            });
          }
        } else {
          personalCodeRef.current = text;
          if (editorComponentRef.current?.setValue) {
            editorComponentRef.current.setValue(text);
          }
          displayRef.current = text;
          try {
            const key = `personal:${roomId}:${location.state?.username}`;
            sessionStorage.setItem(key, personalCodeRef.current);
          } catch (e) {}
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {(() => {
              const sorted = [...clients].sort((a, b) => {
                const aIsAdmin = a.socketId === adminId ? -1 : 0;
                const bIsAdmin = b.socketId === adminId ? -1 : 0;
                if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
                return (a.username || "").localeCompare(b.username || "");
              });
              return sorted.map((client) => {
                const canEdit = permissions?.[client.socketId] !== false; // default true
                const handRaised = hands?.includes(client.socketId);
                const isSelf = client.socketId === mySocketId;
                const clientIsAdmin = client.socketId === adminId;
                const isActiveEditor = client.socketId === activeEditorId;
                return (
                  <Client
                    key={client.socketId}
                    username={client.username}
                    isAdminView={isAdmin}
                    isAdminUser={clientIsAdmin}
                    canEdit={canEdit}
                    isSelf={isSelf}
                    handRaised={handRaised}
                    isActiveEditor={isActiveEditor}
                    onTogglePermission={
                      isAdmin ? () => toggleUserPermission(client.socketId) : undefined
                    }
                    onRaiseHand={!clientIsAdmin && isSelf ? setHand : undefined}
                    onRemoveUser={isAdmin && !clientIsAdmin && !isSelf ? () => {
                      if (!socketRef.current) return;
                      socketRef.current.emit(ACTIONS.KICK_USER, { roomId, targetSocketId: client.socketId });
                    } : undefined}
                  />
                );
              });
            })()}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
        {isHost && (
          <button
            className="btn blockEditBtn"
            style={{
              marginTop: "10px",
              background: editingBlocked ? "#e74c3c" : "#2ecc71",
            }}
            onClick={handleBlockEditing}
          >
            {editingBlocked ? "Unblock Editing (all)" : "Block Editing (all)"}
          </button>
        )}
      </div>
      <div className="editorWrap">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flex: "1 1 auto" }}>
            {/* Tabs */}
            <div className="editorTabs">
              <button
                className={`tabBtn ${activeTab === "shared" ? "active" : ""}`}
                onClick={() => {
                  // persist current visible content to its buffer before switching
                  try {
                    const current = editorComponentRef.current?.getValue?.() ?? displayRef.current ?? "";
                    if (activeTabRef.current === "shared") {
                      codeRef.current = current;
                    } else {
                      personalCodeRef.current = current;
                      try {
                        const key = `personal:${roomId}:${location.state?.username}`;
                        sessionStorage.setItem(key, personalCodeRef.current);
                      } catch (e) {}
                    }
                  } catch (e) {}

                  // switch tab and update ref immediately to avoid stale closures
                  setActiveTab("shared");
                  activeTabRef.current = "shared";

                  // load the shared buffer into the editor
                  let target = codeRef.current ?? "";
                  if (editorComponentRef.current?.setValue) {
                    editorComponentRef.current.setValue(target);
                    displayRef.current = target;
                  }
                }}
              >
                Shared
              </button>
              <button
                className={`tabBtn ${activeTab === "personal" ? "active" : ""}`}
                onClick={() => {
                  // persist current visible content to its buffer before switching
                  try {
                    const current = editorComponentRef.current?.getValue?.() ?? displayRef.current ?? "";
                    if (activeTabRef.current === "shared") {
                      codeRef.current = current;
                    } else {
                      personalCodeRef.current = current;
                      try {
                        const key = `personal:${roomId}:${location.state?.username}`;
                        sessionStorage.setItem(key, personalCodeRef.current);
                      } catch (e) {}
                    }
                  } catch (e) {}

                  // switch tab and update ref immediately to avoid stale closures
                  setActiveTab("personal");
                  activeTabRef.current = "personal";

                  // load the personal buffer into the editor
                  let target = personalCodeRef.current ?? "";
                  if (editorComponentRef.current?.setValue) {
                    editorComponentRef.current.setValue(target);
                    displayRef.current = target;
                  }
                }}
              >
                Personal 🔒
              </button>
            </div>

            <Editor
              ref={editorComponentRef}
              socketRef={socketRef}
              roomId={roomId}
              onCodeChange={(code) => {
                // keep display in sync with what user sees
                displayRef.current = code;
                if (activeTabRef.current === "shared") {
                  codeRef.current = code;
                } else {
                  personalCodeRef.current = code;
                  try {
                    const key = `personal:${roomId}:${location.state?.username}`;
                    sessionStorage.setItem(key, personalCodeRef.current);
                  } catch (e) {}
                }
              }}
              emitChanges={activeTab === "shared"}
              disabled={(() => {
                if (activeTab === "personal") return false; // always editable
                if (!isHost && editingBlocked) return true; // legacy room-wide block
                const myId = mySocketId;
                if (!myId) return false;
                const canEdit = permissions?.[myId] !== false; // default true
                return !canEdit && !isAdmin;
              })()}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
            <button className="btn saveBtn" onClick={handleSaveFile}>
              Save File
            </button>
            <label className="btn openBtn" style={{ cursor: "pointer" }}>
              Open File
              <input
                type="file"
                accept=".js,.txt,.json,.py,.java,.cpp,.c,.md,.html,.css"
                style={{ display: "none" }}
                onChange={handleOpenFile}
              />
            </label>
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <Terminal
              socketRef={socketRef}
              roomId={roomId}
              codeRef={codeRef}
              personalCodeRef={personalCodeRef}
              source={activeTab === "personal" ? "personal" : "shared"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
