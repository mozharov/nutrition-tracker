// Main application file
import { UIManager } from './ui.js';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Create and initialize UI manager
    window.uiManager = new UIManager();
    window.uiManager.initialize();
}); 