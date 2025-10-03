# Implementation Guide for Beginners

This guide explains how the AI Writing Assistant works, breaking down each concept for developers new to React, XState, and ProseMirror.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management with XState](#state-management-with-xstate)
3. [ProseMirror Editor](#prosemirror-editor)
4. [Component Structure](#component-structure)
5. [Data Flow](#data-flow)
6. [Key Concepts](#key-concepts)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         App.jsx                         │
│                  (Main Coordinator)                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          XState Machine (editorMachine.js)       │  │
│  │                                                  │  │
│  │  States: idle → generating → review → idle      │  │
│  │          ↓                      ↓                │  │
│  │        error ←──────────────────┘                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Toolbar  │  │  Editor  │  │StatusBar │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                     │                                  │
│                ┌────┴────┐                            │
│                │AIToolbar│                            │
│                └─────────┘                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
                ┌───────────────┐
                │  aiService.js │
                │  (OpenAI API) │
                └───────────────┘
```

### Technology Stack

1. **React 18**: UI library for building components
2. **XState v5**: State machine for managing application state
3. **ProseMirror**: Rich text editor framework
4. **Radix UI**: Accessible UI component primitives
5. **OpenAI API**: AI content generation

## State Management with XState

### What is a State Machine?

A state machine is a way to model your application's behavior as a set of **states** and **transitions**.

Think of a traffic light:
- **States**: RED, YELLOW, GREEN
- **Transitions**: RED → GREEN (when timer expires)
- **Actions**: Turn on/off lights

### Our State Machine

```javascript
// editorMachine.js
export const editorMachine = createMachine({
  id: 'editor',
  initial: 'idle',
  states: {
    idle: {
      on: {
        CONTINUE_CLICK: 'generating',
        KEYBOARD_SHORTCUT: 'generating'
      }
    },
    generating: {
      invoke: {
        src: 'generateContent',
        onDone: { target: 'review' },
        onError: { target: 'error' }
      }
    },
    review: {
      on: {
        USER_ACCEPT: 'idle',
        USER_CLEAR: 'idle',
        USER_DISCARD: 'idle'
      }
    },
    error: {
      on: {
        RETRY: 'generating',
        DISMISS: 'idle'
      }
    }
  }
});
```

### Key Concepts

#### 1. States
- **idle**: User can type, ready for AI generation
- **generating**: AI is creating content (editor disabled)
- **review**: AI content ready, user must choose action
- **error**: Something went wrong, show error message

#### 2. Events
Events trigger transitions between states:
- `CONTINUE_CLICK`: User clicks "Continue Writing" button
- `KEYBOARD_SHORTCUT`: User presses Ctrl+Space
- `USER_ACCEPT`: User accepts AI content
- `USER_CLEAR`: User clears AI content
- `USER_DISCARD`: User discards entire session

#### 3. Context
Context is the machine's memory - data that persists across states:
```javascript
context: {
  editorState: null,        // ProseMirror state
  generatedContent: '',     // AI-generated text
  errorMessage: '',         // Error message if any
  cursorPosition: 0         // Where to insert content
}
```

#### 4. Actions
Actions are side effects that happen during transitions:
```javascript
actions: {
  applyGeneratedContent: (context, event) => {
    // Add AI content to editor
  },
  acceptContent: (context) => {
    // Remove temporary highlighting
  }
}
```

### Using the State Machine in React

```javascript
// In App.jsx
import { useMachine } from '@xstate/react';
import { editorMachine } from './machines/editorMachine';

function App() {
  // useMachine returns [state, send]
  const [state, send] = useMachine(editorMachine);
  
  // Check current state
  const isGenerating = state.matches('generating');
  
  // Send events
  const handleContinue = () => {
    send({ type: 'CONTINUE_CLICK', cursorPosition: 100 });
  };
  
  // Access context
  const content = state.context.generatedContent;
}
```

## ProseMirror Editor

### What is ProseMirror?

ProseMirror is a rich text editor framework. Unlike a simple `<textarea>`, it:
- Maintains document structure (paragraphs, headings, etc.)
- Supports formatting (bold, italic, etc.)
- Has built-in undo/redo
- Is highly extensible with plugins

### Key Concepts

#### 1. Schema
Defines what kind of content is allowed:
```javascript
const schema = new Schema({
  nodes: {
    doc: {},           // Root node
    paragraph: {},     // Paragraph
    text: {}          // Text content
  },
  marks: {
    bold: {},         // Bold formatting
    italic: {}        // Italic formatting
  }
});
```

#### 2. State
The current document content and selection:
```javascript
const state = EditorState.create({
  doc: schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('Hello world')
    ])
  ])
});
```

#### 3. View
The UI representation of the state:
```javascript
const view = new EditorView(element, {
  state,
  dispatchTransaction(transaction) {
    // Handle document changes
    const newState = view.state.apply(transaction);
    view.updateState(newState);
  }
});
```

#### 4. Transactions
Immutable changes to the document:
```javascript
// Insert text at position 10
const tr = state.tr.insertText('new text', 10);
view.dispatch(tr);
```

### Our Editor Implementation

```javascript
// Editor.jsx
export function Editor({ onContinue, isGenerating }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  
  useEffect(() => {
    // Initialize editor
    const state = EditorState.create({
      schema,
      plugins: [
        history(),           // Undo/redo
        keymap({
          'Mod-z': undo,
          'Mod-Space': () => {
            onContinue();
            return true;
          }
        })
      ]
    });
    
    const view = new EditorView(editorRef.current, {
      state,
      editable: () => !isGenerating
    });
    
    viewRef.current = view;
    
    return () => view.destroy();
  }, []);
  
  return <div ref={editorRef} />;
}
```

## Component Structure

### 1. App.jsx (Main Coordinator)

**Responsibilities:**
- Manages state machine
- Coordinates all components
- Handles events and callbacks

**Key Code:**
```javascript
function App() {
  const [state, send] = useMachine(editorMachine);
  
  const handleContinue = (cursorPos) => {
    send({ type: 'CONTINUE_CLICK', cursorPosition: cursorPos });
  };
  
  return (
    <Theme>
      <Toolbar onContinue={handleContinue} />
      <Editor isGenerating={state.matches('generating')} />
      {state.matches('review') && <AIToolbar />}
      <StatusBar machineState={state} />
    </Theme>
  );
}
```

### 2. Editor.jsx (Text Editing)

**Responsibilities:**
- Render ProseMirror editor
- Handle text input
- Insert AI-generated content
- Manage editor state

**Key Features:**
- Keyboard shortcuts (Ctrl+Z for undo, Mod+Space for AI)
- Disabled during AI generation
- Highlights AI-generated text

### 3. Toolbar.jsx (Main Controls)

**Responsibilities:**
- "Continue Writing" button
- Show keyboard shortcut hint
- Display loading state

**Props:**
```javascript
<Toolbar
  onContinue={handleContinue}  // Callback when button clicked
  isProcessing={isGenerating}   // Show loading state
  hasError={isError}            // Show error state
  onRetry={handleRetry}         // Retry after error
/>
```

### 4. AIToolbar.jsx (Review Actions)

**Responsibilities:**
- Show Accept/Clear/Discard buttons
- Only visible in 'review' state
- Floating at bottom of screen

**Props:**
```javascript
<AIToolbar
  onAccept={handleAccept}      // User accepts AI content
  onClear={handleClear}        // User clears AI content
  onDiscard={handleDiscard}    // User discards session
/>
```

### 5. StatusBar.jsx (State Display)

**Responsibilities:**
- Show current state (Ready, Generating, Review, Error)
- Display word count
- Color-coded status badges

**Props:**
```javascript
<StatusBar
  machineState={state}         // XState machine state
  errorMessage={errorMessage}  // Error message if any
/>
```

## Data Flow

### 1. User Triggers AI Generation

```
User clicks "Continue Writing"
  ↓
Toolbar.onContinue() called
  ↓
App.handleContinue() sends CONTINUE_CLICK event
  ↓
State machine transitions: idle → generating
  ↓
Machine invokes generateContent service
  ↓
aiService.generateAIContent() calls OpenAI API
  ↓
API returns generated text
  ↓
Machine transitions: generating → review
  ↓
generatedContent stored in context
  ↓
Editor.useEffect detects new content
  ↓
Editor inserts text with highlighting
  ↓
AIToolbar appears
```

### 2. User Accepts AI Content

```
User clicks "Accept All"
  ↓
AIToolbar.onAccept() called
  ↓
App.handleAccept() sends USER_ACCEPT event
  ↓
State machine transitions: review → idle
  ↓
generatedContent cleared from context
  ↓
AIToolbar disappears
  ↓
Editor removes highlighting (content stays)
```

### 3. User Types in Editor

```
User types character
  ↓
ProseMirror dispatchTransaction called
  ↓
New editor state created
  ↓
Editor.onEditorStateChange() called
  ↓
App.handleEditorStateChange() sends EDITOR_UPDATE event
  ↓
State machine updates context.editorState
  ↓
StatusBar shows updated word count
```

## Key Concepts

### 1. React Hooks

#### useState
Manages component state:
```javascript
const [count, setCount] = useState(0);
setCount(count + 1);
```

#### useEffect
Runs side effects:
```javascript
useEffect(() => {
  // Runs after render
  console.log('Component mounted');
  
  return () => {
    // Cleanup
    console.log('Component unmounted');
  };
}, []); // Empty array = run once
```

#### useRef
Stores mutable values that don't trigger re-renders:
```javascript
const editorRef = useRef(null);
// Access with editorRef.current
```

### 2. Props

Props are how parent components pass data to children:
```javascript
// Parent
<Toolbar onContinue={handleContinue} isProcessing={true} />

// Child
function Toolbar({ onContinue, isProcessing }) {
  return <button onClick={onContinue} disabled={isProcessing} />;
}
```

### 3. Callbacks

Functions passed as props to handle events:
```javascript
// Parent defines callback
const handleClick = () => {
  console.log('Button clicked!');
};

// Pass to child
<Button onClick={handleClick} />

// Child calls it
function Button({ onClick }) {
  return <button onClick={onClick}>Click me</button>;
}
```

### 4. Conditional Rendering

Show/hide components based on conditions:
```javascript
// && operator: show if true
{isGenerating && <Spinner />}

// Ternary: show A or B
{isError ? <ErrorMessage /> : <SuccessMessage />}

// Function: complex logic
{getStatusComponent()}
```

### 5. Async/Await

Handle asynchronous operations:
```javascript
async function generateContent() {
  try {
    const response = await openai.chat.completions.create({...});
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

## Common Patterns

### 1. Controlled Components

Parent component controls child's state:
```javascript
// Parent
function App() {
  const [value, setValue] = useState('');
  
  return (
    <Input 
      value={value} 
      onChange={setValue} 
    />
  );
}

// Child
function Input({ value, onChange }) {
  return (
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  );
}
```

### 2. Lifting State Up

When multiple components need the same state, move it to their common parent:
```javascript
// ❌ Bad: State in both components
function ComponentA() {
  const [data, setData] = useState('');
}
function ComponentB() {
  const [data, setData] = useState('');
}

// ✅ Good: State in parent
function Parent() {
  const [data, setData] = useState('');
  return (
    <>
      <ComponentA data={data} />
      <ComponentB data={data} />
    </>
  );
}
```

### 3. Composition

Build complex UIs from simple components:
```javascript
function Card({ children }) {
  return <div className="card">{children}</div>;
}

function App() {
  return (
    <Card>
      <h1>Title</h1>
      <p>Content</p>
    </Card>
  );
}
```

## Debugging Tips

### 1. Check State Machine

```javascript
// Log current state
console.log('Current state:', state.value);
console.log('Context:', state.context);

// Check if in specific state
console.log('Is generating?', state.matches('generating'));
```

### 2. Inspect ProseMirror

```javascript
// Log editor state
console.log('Editor state:', viewRef.current.state);
console.log('Document:', viewRef.current.state.doc.toJSON());
console.log('Selection:', viewRef.current.state.selection);
```

### 3. Monitor Events

```javascript
// Log all events sent to machine
const handleContinue = () => {
  console.log('Sending CONTINUE_CLICK event');
  send({ type: 'CONTINUE_CLICK' });
};
```

### 4. React DevTools

Install React DevTools browser extension to:
- Inspect component hierarchy
- View props and state
- Track re-renders

## Next Steps

1. **Run the app**: `npm run dev`
2. **Experiment**: Try modifying components
3. **Add features**: Implement enhancements from the roadmap
4. **Read docs**: Explore React, XState, ProseMirror documentation

## Resources

- [React Tutorial](https://react.dev/learn)
- [XState Visualizer](https://stately.ai/viz)
- [ProseMirror Examples](https://prosemirror.net/examples/)
- [Radix UI Components](https://www.radix-ui.com/primitives)
