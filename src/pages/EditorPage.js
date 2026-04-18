import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Editor from "../components/Editor";
import Terminal from "../components/Terminal";
import TopNavigation from "../components/layout/TopNavigation";
import Sidebar from "../components/layout/Sidebar";
import AnalyticsPanel from "../components/analytics/AnalyticsPanel";
import Flowchart from "../components/Flowchart";
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
  const [progressMap, setProgressMap] = useState({}); // socketId -> analytics data
  const [showUserPanel, setShowUserPanel] = useState(false); // show connected user list on sidebar icon click
  const socketRef = useRef(null);
  const codeRef = useRef(""); // shared buffer
  const personalCodeRef = useRef(""); // personal buffer
  const [activeTab, setActiveTab] = useState("shared"); // 'shared' | 'personal' | 'analytics' | 'flowchart'
  const activeTabRef = useRef("shared"); // track latest tab in event handlers
  const [flowchartSource, setFlowchartSource] = useState("shared"); // track which code source to show in flowchart
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
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        socketRef.current.off("kick-success");
        socketRef.current.off("kick-error");
        socketRef.current.off(ACTIONS.PROGRESS_UPDATE);

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
              mode: "shared",
            });
          },
        );

        // disconnected
        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setClients((prev) => prev.filter((c) => c.socketId !== socketId));
        });

        // user was kicked by admin
        socketRef.current.on(ACTIONS.USER_KICKED, ({ reason }) => {
          toast.error(reason || "You were removed from the room.");
          setTimeout(() => {
            reactNavigator("/", { state: { message: reason } });
          }, 500);
        });

        // kick result feedback for admin
        socketRef.current.on("kick-success", ({ username }) => {
          toast.success(`Removed ${username} from the room.`);
        });
        socketRef.current.on("kick-error", ({ error }) => {
          toast.error(error || "Failed to remove user.");
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
          },
        );

        // who is actively editing (shared)
        socketRef.current.on(ACTIONS.ACTIVE_EDITOR, ({ socketId }) => {
          setActiveEditorId(socketId || null);
        });

        // live analytics updates
        socketRef.current.on(ACTIONS.PROGRESS_UPDATE, ({ clients }) => {
          const next = {};
          (clients || []).forEach((c) => {
            next[c.socketId] = c;
          });
          setProgressMap(next);
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
            mode: "shared",
          });
        });
      });

      socketRef.current.on("reconnect_attempt", () => {});
      socketRef.current.on("reconnect_error", (e) =>
        console.warn("reconnect_error", e),
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
        socketRef.current.off("kick-success");
        socketRef.current.off("kick-error");
        socketRef.current.off(ACTIONS.PROGRESS_UPDATE);
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

  const switchTab = (target) => {
    if (target === activeTabRef.current) return;

    // Always persist current editor content before switching
    const currentEditorContent =
      editorComponentRef.current?.getValue?.() ?? displayRef.current ?? "";
    if (currentEditorContent) {
      if (activeTabRef.current === "shared") {
        codeRef.current = currentEditorContent;
      } else if (activeTabRef.current === "personal") {
        personalCodeRef.current = currentEditorContent;
        try {
          const key = `personal:${roomId}:${location.state?.username}`;
          sessionStorage.setItem(key, personalCodeRef.current);
        } catch (e) {}
      }
    }

    // Track which code source to use for flowchart when switching away from editor tabs
    if (
      target === "flowchart" &&
      (activeTabRef.current === "shared" || activeTabRef.current === "personal")
    ) {
      setFlowchartSource(activeTabRef.current);
    }

    setActiveTab(target);
    activeTabRef.current = target;

    // Restore content when switching back to editor tabs
    if (target === "shared") {
      const targetValue = codeRef.current ?? "";
      setTimeout(() => {
        if (editorComponentRef.current?.setValue) {
          editorComponentRef.current.setValue(targetValue);
          displayRef.current = targetValue;
        }
      }, 50);
    } else if (target === "personal") {
      const targetValue = personalCodeRef.current ?? "";
      setTimeout(() => {
        if (editorComponentRef.current?.setValue) {
          editorComponentRef.current.setValue(targetValue);
          displayRef.current = targetValue;
        }
      }, 50);
    }
  };

  // Removed formatAgo and isErrorRecent to AnalyticsPanel.js

  // Save file handler (uses active tab)
  const handleSaveFile = () => {
    const code =
      activeTab === "shared"
        ? codeRef.current || ""
        : personalCodeRef.current || "";
    let filename = window.prompt(
      "Enter filename (with extension, e.g. myfile.js):",
      activeTab === "shared" ? "shared.txt" : "personal.txt",
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
              mode: "shared",
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
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body">
      <div className="grain-overlay fixed inset-0 z-0"></div>

      <TopNavigation
        isHost={isHost}
        editingBlocked={editingBlocked}
        handleBlockEditing={handleBlockEditing}
        copyRoomId={copyRoomId}
        username={location.state?.username}
        leaveRoom={leaveRoom}
        handleSaveFile={handleSaveFile}
        handleOpenFile={handleOpenFile}
        activeTab={activeTab}
      />

      <main className="flex-1 mt-12 flex flex-col relative z-10 w-full max-w-[1920px] mx-auto">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Sidebar: Classroom Members */}
          <Sidebar
            clients={clients}
            adminId={adminId}
            permissions={permissions}
            hands={hands}
            mySocketId={mySocketId}
            activeEditorId={activeEditorId}
            isAdmin={isAdmin}
            showUserPanel={showUserPanel}
            setShowUserPanel={setShowUserPanel}
            onTogglePermission={toggleUserPermission}
            onRaiseHand={setHand}
            onKickUser={(targetId) => {
              if (socketRef.current) {
                socketRef.current.emit(ACTIONS.KICK_USER, {
                  roomId,
                  targetSocketId: targetId,
                });
              }
            }}
          />

          {/* Main Content Area */}
          <section className="flex-1 flex flex-col bg-surface relative overflow-hidden">
            {/* Tabs Navigation */}
            <div className="h-10 flex items-center px-8 gap-1 border-b border-white/5 bg-surface-container-lowest/30 backdrop-blur-md">
              <button
                className={`px-6 h-full flex items-center gap-2 border-b-2 font-headline text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "shared" ? "border-primary text-primary bg-white/5" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
                onClick={() => switchTab("shared")}
              >
                <span className="material-symbols-outlined text-base">
                  diversity_3
                </span>
                Shared
              </button>
              <button
                className={`px-6 h-full flex items-center gap-2 border-b-2 font-headline text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "personal" ? "border-primary text-primary bg-white/5" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
                onClick={() => switchTab("personal")}
              >
                <span className="material-symbols-outlined text-base">
                  person
                </span>
                Personal
              </button>
              {isAdmin && (
                <button
                  className={`px-6 h-full flex items-center gap-2 border-b-2 font-headline text-xs font-bold uppercase tracking-widest transition-all group ${activeTab === "analytics" ? "border-primary text-primary bg-white/5" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
                  onClick={() => switchTab("analytics")}
                >
                  <span className="material-symbols-outlined text-base group-hover:text-primary transition-colors">
                    analytics
                  </span>
                  Analytics
                  {activeTab !== "analytics" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-dim animate-pulse"></span>
                  )}
                </button>
              )}
              <button
                className={`px-6 h-full flex items-center gap-2 border-b-2 font-headline text-xs font-bold uppercase tracking-widest transition-all group ${activeTab === "flowchart" ? "border-primary text-primary bg-white/5" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
                onClick={() => switchTab("flowchart")}
              >
                <span className="material-symbols-outlined text-base group-hover:text-primary transition-colors">
                  account_tree
                </span>
                Flowchart
                {activeTab !== "flowchart" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-dim animate-pulse"></span>
                )}
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Editor Component wrapper */}
              <div className="flex-[4] flex flex-col precision-border border-t-0 border-l-0 border-r-0 border-b-0 z-10 w-full">
                {(activeTab === "shared" || activeTab === "personal") && (
                  <div className="bg-surface-container-low px-4 py-2 flex items-center gap-4 border-b border-white/5">
                    <span className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                      {activeTab}.js
                    </span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-error/40"></span>
                      <span className="w-2 h-2 rounded-full bg-secondary-dim/40"></span>
                      <span className="w-2 h-2 rounded-full bg-primary-dim/40"></span>
                    </div>
                  </div>
                )}

                <div className="flex-1 bg-transparent flex flex-col overflow-hidden relative">
                  {activeTab === "shared" || activeTab === "personal" ? (
                    <Editor
                      ref={editorComponentRef}
                      socketRef={socketRef}
                      roomId={roomId}
                      onCodeChange={(code) => {
                        displayRef.current = code;
                        if (activeTabRef.current === "shared") {
                          codeRef.current = code;
                        } else if (activeTabRef.current === "personal") {
                          personalCodeRef.current = code;
                          try {
                            const key = `personal:${roomId}:${location.state?.username}`;
                            sessionStorage.setItem(
                              key,
                              personalCodeRef.current,
                            );
                          } catch (e) {}
                          socketRef.current?.emit?.(ACTIONS.PERSONAL_ACTIVITY, {
                            roomId,
                          });
                        }
                      }}
                      emitChanges={activeTab === "shared"}
                      disabled={(() => {
                        if (activeTab === "personal") return false;
                        if (activeTab === "analytics") return true;
                        if (!isHost && editingBlocked) return true;
                        const myId = mySocketId;
                        if (!myId) return false;
                        const canEdit = permissions?.[myId] !== false;
                        return !canEdit && !isAdmin;
                      })()}
                    />
                  ) : activeTab === "flowchart" ? (
                    <Flowchart
                      code={
                        flowchartSource === "shared"
                          ? codeRef.current
                          : personalCodeRef.current
                      }
                      source={flowchartSource}
                      onSourceChange={setFlowchartSource}
                    />
                  ) : isAdmin ? (
                    <AnalyticsPanel
                      clients={clients}
                      adminId={adminId}
                      progressMap={progressMap}
                      socket={socketRef.current}
                    />
                  ) : (
                    <div className="p-8 flex-1 text-white">
                      <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-surface/80 p-8 text-center">
                        <h2 className="text-xl font-semibold text-white mb-3">
                          Analytics are only available to the room admin.
                        </h2>
                        <p className="text-sm text-slate-400">
                          Switch to the Shared or Personal tab to continue
                          collaborating.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.02] select-none z-0">
                    <h1 className="font-headline font-black text-[120px] tracking-tighter">
                      SYNCIT
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Horizontal Terminal Section */}
        {activeTab !== "analytics" && (
          <div className="h-64 bg-black border-t border-white/10 flex flex-col z-20 shrink-0">
            <div className="flex-1 overflow-hidden w-full relative">
              <Terminal
                socketRef={socketRef}
                roomId={roomId}
                codeRef={codeRef}
                personalCodeRef={personalCodeRef}
                source={activeTab === "personal" ? "personal" : "shared"}
              />
            </div>
          </div>
        )}

        {/* Bottom Info Bar */}
        <div className="h-8 bg-slate-950 border-t border-white/5 px-6 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider">
            <span className="flex items-center gap-2 text-primary">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              Sync Protocol Active
            </span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface-variant">
              {clients.length} Students Connected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-on-surface-variant font-headline uppercase tracking-widest">
              UTF-8
            </span>
            <span className="text-[10px] text-on-surface-variant font-headline uppercase tracking-widest">
              JavaScript
            </span>
          </div>
        </div>
      </main>

      {/* Background Decorative Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-dim/5 blur-[200px] rounded-full pointer-events-none z-[-1]"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-dim/5 blur-[200px] rounded-full pointer-events-none z-[-1]"></div>
    </div>
  );
};

export default EditorPage;
