import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './Variables.css';   // The single source of truth for colors
import './Base.css';        // Global resets for buttons, inputs, and fonts
import './Animations.css';  // Standardized transitions and fades
import './GlobalHelpers.css'; // Utility classes (margins, centering, etc.)
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
