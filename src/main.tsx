import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'

// Initialize Capacitor plugins for mobile
if (Capacitor.isNativePlatform()) {
  StatusBar.setBackgroundColor({ color: '#8b5cf6' });
  StatusBar.setStyle({ style: Style.Dark });
  
  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open');
  });
  
  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
