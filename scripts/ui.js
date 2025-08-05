// UI management module
import { StorageManager } from './storage.js';
import { InventoryManager } from './inventory.js';
import { MealPlanningManager } from './mealPlanning.js';
import { DailySummaryManager } from './dailySummary.js';
import { HistoryManager } from './history.js';

export class UIManager {
    constructor() {
        this.storage = new StorageManager();
        this.inventoryManager = new InventoryManager(this.storage);
        this.mealPlanningManager = new MealPlanningManager(this.storage);
        this.dailySummaryManager = new DailySummaryManager(this.storage);
        this.historyManager = new HistoryManager(this.storage);

        // Make managers globally available for onclick handlers
        window.inventoryManager = this.inventoryManager;
        window.mealPlanningManager = this.mealPlanningManager;
        window.dailySummaryManager = this.dailySummaryManager;
        window.historyManager = this.historyManager;
    }

    // Initialize the app
    initialize() {
        this.storage.loadFromLocalStorage();
        this.initializeEventListeners();
        this.updateAllDisplays();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Product form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.inventoryManager.saveProduct();
        });

        // Import inventory file selection
        document.getElementById('inventoryImportFile').addEventListener('change', (e) => {
            this.inventoryManager.importInventory(e);
        });

        // Import history file selection
        document.getElementById('historyImportFile').addEventListener('change', (e) => {
            this.historyManager.importHistory(e);
        });

        // Search box
        document.getElementById('searchBox').addEventListener('input', (e) => {
            this.mealPlanningManager.handleSearch(e);
        });

        // Inventory search box
        document.getElementById('inventorySearchBox').addEventListener('input', (e) => {
            this.inventoryManager.handleInventorySearch(e);
        });

        // Close modal on outside click
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.inventoryManager.closeProductModal();
            }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            const searchBox = document.getElementById('searchBox');
            const productList = document.getElementById('productList');

            if (!searchBox.contains(e.target) && !productList.contains(e.target)) {
                productList.style.display = 'none';
            }
        });
    }

    // Update all displays
    updateAllDisplays() {
        this.dailySummaryManager.updateDateDisplay();
        this.inventoryManager.updateInventoryDisplay();
        this.dailySummaryManager.updateDailyStats();
        this.dailySummaryManager.updateDailyItemsList();
        this.mealPlanningManager.updateNutrientsPreview();
    }

    // Tab switching
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    // Global functions for HTML onclick handlers
    static showAddProductModal() {
        window.inventoryManager.showAddProductModal();
    }

    static closeProductModal() {
        window.inventoryManager.closeProductModal();
    }

    static switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    static importInventory() {
        document.getElementById('inventoryImportFile').click();
    }

    static exportInventory() {
        window.inventoryManager.exportInventory();
    }

    static importHistory() {
        document.getElementById('historyImportFile').click();
    }

    static exportHistory() {
        window.historyManager.exportHistory();
    }

    static clearOldHistory() {
        window.historyManager.clearOldHistory();
    }

    static addCustomProduct() {
        window.mealPlanningManager.addCustomProduct();
    }

    static importProductList() {
        window.mealPlanningManager.importProductList();
    }

    static applyChanges() {
        window.mealPlanningManager.applyChanges();
        // Update displays after applying changes
        window.uiManager.updateAllDisplays();
    }

    static changeDate(days) {
        window.dailySummaryManager.changeDate(days);
    }
}

// Make global functions available
window.showAddProductModal = UIManager.showAddProductModal;
window.closeProductModal = UIManager.closeProductModal;
window.switchTab = UIManager.switchTab;
window.importInventory = UIManager.importInventory;
window.exportInventory = UIManager.exportInventory;
window.importHistory = UIManager.importHistory;
window.exportHistory = UIManager.exportHistory;
window.clearOldHistory = UIManager.clearOldHistory;
window.addCustomProduct = UIManager.addCustomProduct;
window.importProductList = UIManager.importProductList;
window.applyChanges = UIManager.applyChanges;
window.changeDate = UIManager.changeDate; 