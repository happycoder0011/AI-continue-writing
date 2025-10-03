/**
 * MAIN APP COMPONENT
 *
 * This is the root component that brings everything together:
 * - XState machine for state management
 * - ProseMirror editor for text editing
 * - Radix UI components for the interface
 * - AI service for content generation
 *
 * Think of this as the "conductor" of an orchestra - it coordinates
 * all the different parts to work together harmoniously.
 */

import { useMachine } from "@xstate/react";
import { Theme } from "@radix-ui/themes";
import { editorMachine } from "./machines/editorMachine";
import { Editor } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/StatusBar";
import { AIToolbar } from "./components/AIToolbar";
import { hasValidAPIKey } from "./services/aiService";
import "@radix-ui/themes/styles.css";
import "./App.css";

/**
 * Main App Component
 *
 * This component:
 * 1. Manages the state machine
 * 2. Renders all UI components
 * 3. Handles communication between components
 * 4. Provides the Radix UI theme
 */
function App() {
  /**
   * STEP 1: Initialize State Machine
   *
   * useMachine is a React hook from XState that:
   * - Creates a state machine instance
   * - Returns [state, send] similar to useState
   * - state: Current state and context
   * - send: Function to send events to the machine
   */
  const [state, send] = useMachine(editorMachine);

  // Debug: Expose state machine to window for manual testing
  if (typeof window !== "undefined") {
    window.debugMachine = { state, send };
  }

  /**
   * STEP 2: Check API Key
   *
   * Before allowing AI features, verify API key is configured
   */
  const apiKeyConfigured = hasValidAPIKey();

  /**
   * STEP 3: Define Event Handlers
   *
   * These functions handle user actions and send events to the state machine
   */

  /**
   * Handle "Continue Writing" button click
   *
   * @param {number} cursorPosition - Where to insert AI content
   */
  const handleContinue = (cursorPosition) => {
    // Check if API key is configured
    if (!apiKeyConfigured) {
      alert(
        "Please configure your OpenAI API key.\n\n" +
          "Create a .env file in the project root with:\n" +
          "VITE_OPENAI_API_KEY=your_key_here"
      );
      return;
    }

    // Send event to state machine
    // The machine will transition to 'generating' state

    send({
      type: "CONTINUE_CLICK",
      cursorPosition: cursorPosition || 0,
    });

    // Log state after send (this might still show old state due to async nature)
    setTimeout(() => {}, 100);
  };

  /**
   * Handle editor state changes
   *
   * @param {EditorState} editorState - New ProseMirror state
   */
  const handleEditorStateChange = (editorState) => {
    // Update the state machine's context with new editor state
    send({
      type: "EDITOR_UPDATE",
      editorState,
    });
  };

  /**
   * Handle user accepting AI content
   */
  const handleAccept = () => {
    // Send USER_ACCEPT event
    // Machine will transition from 'review' to 'idle'
    send({ type: "USER_ACCEPT" });
  };

  /**
   * Handle user discarding session
   */
  const handleDiscard = () => {
    // Send USER_DISCARD event
    // This reverts to the state before AI generation
    send({ type: "USER_DISCARD" });
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    // Send RETRY event
    // Machine will transition from 'error' to 'generating'
    send({ type: "RETRY" });
  };

  /**
   * STEP 4: Extract State Information
   *
   * We check the current state to determine what to show
   */
  const isGenerating = state.matches("generating");
  const isReview = state.matches("review");
  const isError = state.matches("error");
  const generatedContent = state.context.generatedContent;
  const errorMessage = state.context.errorMessage;

  /**
   * STEP 5: Render UI
   *
   * We wrap everything in Radix Theme to provide consistent styling
   */
  return (
    <Theme appearance="light" accentColor="indigo" radius="medium">
      <div className="app-container">
        {/* 
          TOOLBAR
          Contains the "Continue Writing" button
        */}
        <Toolbar
          onContinue={handleContinue}
          isProcessing={isGenerating}
          hasError={isError}
          onRetry={handleRetry}
        />

        {/* 
          EDITOR
          The main text editing area
        */}
        <Editor
          onContinue={handleContinue}
          isGenerating={isGenerating}
          generatedContent={generatedContent}
          onEditorStateChange={handleEditorStateChange}
          machineState={state}
          send={send}
        />

        {/* 
          AI TOOLBAR
          Only shown when in 'review' state
          Provides Accept/Discard options
        */}
        {isReview && (
          <AIToolbar onAccept={handleAccept} onDiscard={handleDiscard} />
        )}

        {/* 
          STATUS BAR
          Shows current state at the bottom
        */}
        <StatusBar machineState={state} errorMessage={errorMessage} />
      </div>
    </Theme>
  );
}

export default App;

/**
 * COMPONENT ARCHITECTURE EXPLANATION:
 *
 * 1. STATE MANAGEMENT FLOW:
 *    User Action → Event → State Machine → New State → UI Update
 *
 *    Example:
 *    Click "Continue" → CONTINUE_CLICK event → 'generating' state →
 *    isGenerating=true → Editor shows overlay
 *
 * 2. COMPONENT HIERARCHY:
 *    App (state machine)
 *    ├── Toolbar (triggers AI)
 *    ├── Editor (text editing)
 *    ├── AIToolbar (review actions)
 *    └── StatusBar (state display)
 *
 * 3. PROPS VS STATE:
 *    - State: Data managed by this component (state machine)
 *    - Props: Data passed to child components
 *    - Child components are "controlled" - they don't manage their own state
 *
 * 4. EVENT FLOW:
 *    - User interacts with child component
 *    - Child calls callback prop (e.g., onContinue)
 *    - Parent (App) sends event to state machine
 *    - State machine updates state
 *    - React re-renders with new state
 *    - Child components receive new props
 *
 * 5. CONDITIONAL RENDERING:
 *    - {isReview && <AIToolbar />} - Only show AIToolbar in review state
 *    - This keeps the UI clean and contextual
 *
 * 6. THEME PROVIDER:
 *    - Radix Theme wraps the entire app
 *    - Provides consistent styling to all Radix components
 *    - Can be customized with appearance, accentColor, etc.
 */
