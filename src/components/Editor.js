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
  ({ socketRef, roomId, onCodeChange, disabled, emitChanges = true }, ref) => {
    const editorRef = useRef(null);
    // Keep latest values in refs so the CodeMirror change handler
    // does not close over stale props when the component updates.
    const emitChangesRef = useRef(emitChanges);
    const onCodeChangeRef = useRef(onCodeChange);

    useEffect(() => {
      emitChangesRef.current = emitChanges;
      onCodeChangeRef.current = onCodeChange;
    }, [emitChanges, onCodeChange]);
    useImperativeHandle(ref, () => ({
      setValue: (value) => {
        if (editorRef.current) {
          editorRef.current.setValue(value);
        }
      },
    }));

    // This effect initializes CodeMirror once on mount.
    // Intentionally not including props like `disabled`, `emitChanges`,
    // `onCodeChange`, `roomId`, or `socketRef` in the dependency array because
    // re-running this effect would re-initialize the editor and re-attach
    // event handlers, causing duplicate listeners and state issues.
    //
    // The linter rule is disabled here for that reason; the component updates
    // that depend on those props are handled elsewhere (e.g. setOption/readOnly
    // effect and the onCodeChange callback provided by the parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // call the latest onCodeChange
          if (onCodeChangeRef.current) onCodeChangeRef.current(code);
          if (origin !== "setValue") {
            // read latest emitChanges value from ref to avoid stale closure
            if (emitChangesRef.current && socketRef.current) {
              socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                roomId,
                code,
                mode: 'shared',
              });
              // signal typing for active editor highlight (shared tab only)
              socketRef.current.emit(ACTIONS.TYPING, { roomId });
            }
            // For personal tab (emitChanges=false), no events are emitted
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

    // Network updates are handled at the page level to avoid leaking into personal tab
    // This component is now presentation-only with optional emit on local change.

    return <textarea id="realtimeEditor"></textarea>;
  }
);

export default Editor;
