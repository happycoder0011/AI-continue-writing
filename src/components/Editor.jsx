/**
 * EDITOR COMPONENT
 *
 * This is the main text editor component using ProseMirror.
 * ProseMirror is a powerful editor framework that gives us:
 * - Rich text editing capabilities
 * - Document structure (not just plain text)
 * - Undo/redo history
 * - Extensibility through plugins
 * Think of ProseMirror like a more powerful <textarea>:
 * - <textarea>: plain text only
 * - ProseMirror: structured documents with formatting, history, etc.
 */

import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { useEffect, useRef, useState } from "react";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { history, undo, redo } from "prosemirror-history";
import { EditorState, Plugin } from "prosemirror-state";
import "./Editor.css";

/**
 * Editor Component
 *
 * @param {Object} props
 * @param {Function} props.onContinue - Callback when user triggers AI generation
 * @param {boolean} props.isGenerating - Whether AI is currently generating
 * @param {string} props.generatedContent - AI-generated text to insert
 * @param {Function} props.onEditorStateChange - Callback when editor content changes
 * @param {Object} props.machineState - Current state machine state
 * @param {Function} props.send - Function to send events to state machine
 */
export function Editor({
  onContinue,
  isGenerating,
  generatedContent,
  onEditorStateChange,
  machineState,
  send,
}) {
  // useRef creates a reference that persists across renders
  // We use it to store the DOM element and ProseMirror view
  const editorRef = useRef(null); // The <div> where editor will be mounted
  const viewRef = useRef(null); // The ProseMirror EditorView instance

  const [hasInsertedContent, setHasInsertedContent] = useState(false);

  // Track if we're currently discarding to prevent race conditions
  const isDiscardingRef = useRef(false);

  // Track the position and length of AI-generated content for removal
  const [aiContentInfo, setAiContentInfo] = useState(null);

  /**
   * EFFECT 1: Initialize ProseMirror Editor
   * This runs once when the component mounts
   */
  useEffect(() => {
    // Don't initialize if already done or if ref isn't ready
    if (!editorRef.current || viewRef.current) return;
    // STEP 1: Create the editor schema
    // Schema defines what kind of content is allowed in the document
    // We use the basic schema which includes: paragraphs, headings, bold, italic, etc.
    const schema = new Schema({
      nodes: basicSchema.spec.nodes,
      marks: basicSchema.spec.marks,
    });

    // STEP 2: Create initial editor state
    const state = EditorState.create({
      // Start with an empty document
      doc: schema.node("doc", null, [schema.node("paragraph")]),

      // Plugins add functionality to the editor
      plugins: [
        // History plugin enables undo/redo
        history(),

        // Placeholder plugin
        // Note: Placeholder functionality is now handled by CSS styling

        // Inline continue button plugin
        new Plugin({
          spec: {
            isGenerating: isGenerating,
            machineState: machineState,
            onContinue: onContinue,
          },
          props: {
            decorations(state) {
              const decorations = [];
              const doc = state.doc;

              // Get the current state from plugin spec
              const isGenerating = this.spec.isGenerating || false;
              const machineState = this.spec.machineState;
              const onContinue = this.spec.onContinue;

              // Only show the inline button when:
              // 1. Not currently generating
              // 2. Not in review state
              // 3. Document has content
              // 4. Selection is collapsed (just a cursor, not a selection)
              // 5. Cursor is at the end of a text block
              if (
                !isGenerating &&
                machineState &&
                !machineState.matches("review") &&
                doc.content.size > 0
              ) {
                const selection = state.selection;

                if (
                  selection.empty &&
                  selection.$from.parent.isTextblock &&
                  selection.$from.parentOffset ===
                    selection.$from.parent.content.size
                ) {
                  const continueButton = document.createElement("button");
                  continueButton.className = "inline-continue-btn";
                  continueButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                    Continue
                  `;
                  continueButton.onclick = (e) => {
                    e.preventDefault();
                    onContinue(selection.to);
                  };

                  decorations.push(
                    Decoration.widget(selection.to, continueButton, {
                      side: 1,
                      key: "inline-continue",
                    })
                  );
                }
              }

              return DecorationSet.create(doc, decorations);
            },
          },
        }),

        // Keyboard shortcut tooltip plugin
        new Plugin({
          props: {
            decorations(state) {
              const decorations = [];
              const doc = state.doc;

              // Show tooltip when editor has content and cursor is at end of text
              if (doc.content.size > 0 && !isGenerating) {
                const selection = state.selection;

                // Only show when cursor is at the end of a text block
                if (
                  selection.empty &&
                  selection.$from.parent.isTextblock &&
                  selection.$from.parentOffset ===
                    selection.$from.parent.content.size
                ) {
                  const tooltip = document.createElement("div");
                  tooltip.className = "keyboard-shortcut-tooltip";
                  tooltip.innerHTML = `
                    <kbd class="shortcut-key">Ctrl</kbd> +
                    <kbd class="shortcut-key">K</kbd>
                    <span class="tooltip-text">Continue writing with AI</span>
                  `;

                  // Position right after the cursor
                  decorations.push(
                    Decoration.widget(selection.to, tooltip, {
                      side: 1,
                      key: "keyboard-tooltip",
                    })
                  );
                }
              }

              return DecorationSet.create(doc, decorations);
            },
          },
        }),

        // Keymap plugin handles keyboard shortcuts
        keymap({
          // Standard shortcuts
          "Mod-z": undo, // Ctrl+Z (Windows) or Cmd+Z (Mac)
          "Mod-y": redo, // Ctrl+Y (Windows) or Cmd+Y (Mac)
          "Mod-Shift-z": redo, // Ctrl+Shift+Z alternative for redo

          // Custom shortcut for AI generation
          "Mod-k": (state, dispatch, view) => {
            // Get cursor position
            const cursorPos = state.selection.from;

            // Trigger AI generation
            onContinue(cursorPos);

            // Return true to indicate we handled the keypress
            return true;
          },
        }),
      ],
    });

    // STEP 3: Create the editor view
    // EditorView is the UI representation of the editor state
    const view = new EditorView(editorRef.current, {
      state,

      // dispatchTransaction is called whenever the document changes
      dispatchTransaction(transaction) {
        // Apply the transaction to get new state
        const newState = view.state.apply(transaction);

        // Update the view with new state
        view.updateState(newState);

        // Notify parent component of the change
        onEditorStateChange(newState);
      },

      // Make editor not editable when AI is generating
      editable: () => !isGenerating,

      // Custom attributes for styling
      attributes: {
        class: "prose-editor",
      },
    });

    // Store view reference for later use
    viewRef.current = view;

    // Notify parent of initial state
    onEditorStateChange(state);

    // CLEANUP: Destroy view when component unmounts
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []); // Empty dependency array = run once on mount

  /**
   * EFFECT 2: Handle AI-generated content insertion
   * This runs whenever generatedContent changes
   */
  useEffect(() => {
    // Only insert if we have content and haven't inserted it yet
    if (!generatedContent || !viewRef.current || hasInsertedContent) return;

    const view = viewRef.current;
    const state = view.state;

    // STEP 1: Get current cursor position
    const cursorPos = state.selection.from;

    // STEP 2: Create a transaction to insert the text
    // Transactions are how you modify ProseMirror documents
    const transaction = state.tr.insertText(
      " " + generatedContent, // Add space before AI content
      cursorPos
    );

    // STEP 3: Add a mark to highlight AI-generated text
    // Marks are formatting that can be applied to text (like bold, italic)
    // We create a custom mark to highlight AI content
    const from = cursorPos + 1; // Start after the space
    const to = cursorPos + generatedContent.length + 1;

    // Store AI content info for later removal
    setAiContentInfo({
      from: from,
      to: to,
      length: generatedContent.length + 1, // Include the space
      insertPosition: cursorPos,
    });

    // Add a custom attribute to mark this as AI-generated
    // (We'll style this with CSS)
    transaction.addMark(
      from,
      to,
      state.schema.marks.em.create() // Using 'em' mark as a placeholder
    );

    // STEP 4: Apply the transaction
    view.dispatch(transaction);

    // Mark as inserted to prevent re-insertion
    setHasInsertedContent(true);
  }, [generatedContent, hasInsertedContent]);

  /**
   * EFFECT 3: Handle discard session - use undo to go back to before AI generation
   * This runs when the shouldDiscardContent flag is set to true
   */
  useEffect(() => {
    if (
      !isDiscardingRef.current &&
      machineState?.context?.shouldDiscardContent &&
      viewRef.current
    ) {
      isDiscardingRef.current = true;
      console.log("🔄 Discarding AI content using undo");

      try {
        const view = viewRef.current;

        // Use ProseMirror's undo command to go back to before AI generation
        undo(view.state, view.dispatch);

        // Clear the stored state since we're using undo
        setHasInsertedContent(false);

        // Notify the state machine that we've handled the discard
        if (send) {
          send({ type: "DISCARD_HANDLED" });
          console.log("✅ Discard completed using undo");
        }
      } catch (error) {
        console.error("Error during discard:", error);
      } finally {
        isDiscardingRef.current = false;
      }
    }
  }, [machineState?.context?.shouldDiscardContent, send]);

  /**
   * EFFECT 4: Handle accept content - remove highlighting from AI-generated text
   * This runs when the shouldAcceptContent flag is set to true
   */
  useEffect(() => {
    if (
      machineState?.context?.shouldAcceptContent &&
      aiContentInfo &&
      viewRef.current
    ) {
      console.log("✅ Accepting AI content, removing highlighting");

      const view = viewRef.current;
      const state = view.state;

      // Create a transaction to remove the highlighting (em mark) from AI content
      const transaction = state.tr.removeMark(
        aiContentInfo.from,
        aiContentInfo.to,
        state.schema.marks.em
      );

      // Apply the transaction
      view.dispatch(transaction);

      // Clear the AI content info since it's now accepted
      setAiContentInfo(null);
      setHasInsertedContent(false);

      // Reset the accept flag by sending an event
      if (send) {
        send({ type: "ACCEPT_HANDLED" });
        console.log("✅ Accept completed, highlighting removed");
      }
    }
  }, [machineState?.context?.shouldAcceptContent, aiContentInfo, send]);

  /**
   * EFFECT 5: Reset insertion flag when leaving review state
   * This allows new AI generations to be inserted
   */
  useEffect(() => {
    if (machineState && !machineState.matches("review")) {
      setHasInsertedContent(false);
    }
  }, [machineState?.value]);

  /**
   * EFFECT 6: Update editor editability based on generation state
   * Disable editing while AI is generating
   */
  useEffect(() => {
    if (!viewRef.current) return;

    // Force view to reconsider editability
    viewRef.current.setProps({
      editable: () => !isGenerating,
    });
  }, [isGenerating]);

  return (
    <div className="editor-wrapper">
      {/* Overlay shown during AI generation */}
      {isGenerating && (
        <div className="editor-overlay">
          <div className="spinner"></div>
          <p>AI is writing...</p>
        </div>
      )}

      {/* The actual editor mounts here */}
      <div
        ref={editorRef}
        className={`editor-container ${isGenerating ? "disabled" : ""}`}
      />
    </div>
  );
}

/**
 * COMPONENT EXPLANATION:
 *
 * 1. REFS (useRef):
 *    - Refs let us access DOM elements and store values that don't trigger re-renders
 *    - editorRef: Points to the <div> where ProseMirror mounts
 *    - viewRef: Stores the ProseMirror EditorView instance
 *
 * 2. EFFECTS (useEffect):
 *    - Effect 1: Initialize editor (runs once)
 *    - Effect 2: Insert AI content when it arrives
 *    - Effect 3: Reset insertion flag when state changes
 *    - Effect 4: Update editability when generation state changes
 *
 * 3. PROSEMIRROR CONCEPTS:
 *    - Schema: Defines document structure (what nodes/marks are allowed)
 *    - State: The current document content and selection
 *    - View: The UI representation of the state
 *    - Transaction: A change to the document (immutable)
 *    - Plugin: Adds functionality (history, keymaps, etc.)
 *
 * 4. DATA FLOW:
 *    User types → dispatchTransaction → new state → onEditorStateChange → parent component
 *    Parent sends generatedContent → Effect 2 → insert into editor
 */
