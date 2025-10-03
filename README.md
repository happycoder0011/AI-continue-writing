# AI Writing Assistant

An intelligent writing assistant that uses AI to continue your text seamlessly. Built with React, XState, ProseMirror, and Radix UI.

## Features

- ✍️ **AI-Powered Writing**: Continue your text with AI-generated content
- ⌨️ **Keyboard Shortcuts**: Quick access with Ctrl+Space (or Cmd+Space on Mac)
- 🎨 **Rich Text Editor**: Powered by ProseMirror with formatting support
- 🔄 **State Management**: Robust state handling with XState
- 🎯 **Content Control**: Accept, clear, or discard AI suggestions
- 📱 **Responsive Design**: Works on desktop and mobile
- ♿ **Accessible**: Built with Radix UI for WCAG compliance

## Tech Stack

- **React 18**: Modern UI library with hooks
- **XState v5**: State machine for predictable state management
- **ProseMirror**: Powerful rich text editor framework
- **Radix UI**: Accessible, unstyled UI primitives
- **OpenAI API**: GPT-4 for content generation
- **Vite**: Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chronicle_assignment_sheetal_singh
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173`

## Usage

### Basic Writing

1. Start typing in the editor
2. Click "Continue Writing" or press `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (Mac)
3. Wait for AI to generate content
4. Review the highlighted AI-generated text
5. Choose an action:
   - **Accept All**: Keep the AI content
   - **Clear All**: Remove the AI content
   - **Discard Session**: Revert to before AI generation

### Keyboard Shortcuts

- `Ctrl+Space` / `Cmd+Space`: Trigger AI generation
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo

## Project Structure

```
src/
├── components/
│   ├── Editor.jsx        # ProseMirror editor component
│   ├── Editor.css        # Editor styles
│   ├── Toolbar.jsx       # Main toolbar with Continue button
│   ├── StatusBar.jsx     # Status indicator at bottom
│   └── AIToolbar.jsx     # Floating toolbar for AI actions
├── machines/
│   └── editorMachine.js  # XState state machine
├── services/
│   └── aiService.js      # OpenAI API integration
├── App.jsx               # Main application component
└── App.css               # Global styles
```

## State Machine

The application uses XState to manage states:

```
idle → generating → review → idle
  ↓                    ↓
error ←──────────────┘
```

- **idle**: Ready for user input
- **generating**: AI is creating content
- **review**: AI content ready for user action
- **error**: Something went wrong

## Code Comments

All code files include extensive comments explaining:
- What each function does
- Why certain approaches were chosen
- How different parts interact
- React and JavaScript concepts for beginners

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## Security Notes

⚠️ **Important**: This demo stores the API key in the frontend for simplicity. In production:

1. Never expose API keys in frontend code
2. Use a backend server to make API calls
3. Implement proper authentication
4. Add rate limiting

## Future Enhancements

- [ ] Local AI fallback with transformers.js
- [ ] Multiple AI model selection
- [ ] Customizable AI parameters (temperature, max tokens)
- [ ] Export to Markdown/PDF
- [ ] Dark mode support
- [ ] Collaborative editing
- [ ] Version history with branching

## Learning Resources

- [React Documentation](https://react.dev/)
- [XState Documentation](https://xstate.js.org/)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Radix UI](https://www.radix-ui.com/)
- [OpenAI API](https://platform.openai.com/docs)

## License

MIT

## Author

Sheetal Singh
