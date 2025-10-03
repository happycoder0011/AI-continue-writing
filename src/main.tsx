/**
 * MAIN ENTRY POINT
 * 
 * This file is the entry point for the React application.
 * It renders the root App component into the DOM.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Get the root element from index.html
const rootElement = document.getElementById('root')!

// Create a React root and render the app
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
