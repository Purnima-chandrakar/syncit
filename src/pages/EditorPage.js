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
  const [editingBlocked, setEditingBlocked] = useState(false);
  const [host, setHost] = useState(null);
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const editorComponentRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          // Host is the first client in the room
          if (clients.length > 0) {
            setHost(clients[0].username);
          }
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      // Listen for editing blocked event from server
      socketRef.current.on(ACTIONS.EDITING_BLOCKED, ({ blocked }) => {
        setEditingBlocked(blocked);
      });
    };
    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.EDITING_BLOCKED);
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

  const handleBlockEditing = () => {
    if (!socketRef.current) return;
    socketRef.current.emit(ACTIONS.BLOCK_EDITING, {
      roomId,
      blocked: !editingBlocked,
    });
  };

  // Save file handler
  const handleSaveFile = () => {
    const code = codeRef.current || "";
    let filename = window.prompt(
      "Enter filename (with extension, e.g. myfile.js):",
      "code.txt"
    );
    if (!filename) return;
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Open file handler
  const handleOpenFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (text !== undefined && text !== null) {
        codeRef.current = text;
        // Update the editor UI locally
        if (editorComponentRef.current && editorComponentRef.current.setValue) {
          editorComponentRef.current.setValue(text);
        }
        // Broadcast the code to all clients
        if (socketRef.current) {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code: text,
          });
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
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
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
            {editingBlocked ? "Unblock Editing" : "Block Editing"}
          </button>
        )}
      </div>
      <div className="editorWrap">
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: "1 1 auto" }}>
            <Editor
              ref={editorComponentRef}
              socketRef={socketRef}
              roomId={roomId}
              onCodeChange={(code) => {
                codeRef.current = code;
              }}
              disabled={!isHost && editingBlocked}
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
            <Terminal socketRef={socketRef} roomId={roomId} codeRef={codeRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
