import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../Actions";

const Editor = forwardRef(
  ({ socketRef, roomId, onCodeChange, disabled }, ref) => {
    const editorRef = useRef(null);
    useImperativeHandle(ref, () => ({
      setValue: (value) => {
        if (editorRef.current) {
          editorRef.current.setValue(value);
        }
      },
    }));

    useEffect(() => {
      async function init() {
        editorRef.current = Codemirror.fromTextArea(
          document.getElementById("realtimeEditor"),
          {
            mode: { name: "javascript", json: true },
            theme: "dracula",
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            readOnly: disabled ? "nocursor" : false,
          }
        );

        editorRef.current.on("change", (instance, changes) => {
          const { origin } = changes;
          const code = instance.getValue();
          onCodeChange(code);
          if (origin !== "setValue") {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
              roomId,
              code,
            });
          }
        });
      }
      init();
    }, []);

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.setOption("readOnly", disabled ? "nocursor" : false);
      }
    }, [disabled]);

    useEffect(() => {
      if (socketRef.current) {
        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
          if (code !== null) {
            editorRef.current.setValue(code);
          }
        });
      }

      return () => {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
  }
);

export default Editor;
