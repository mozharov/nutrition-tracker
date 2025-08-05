// Storage management module
export class StorageManager {
    constructor() {
        this.inventory = [];
        this.history = [];
    }

    // Load data from localStorage
    loadFromLocalStorage() {
        const savedInventory = localStorage.getItem('nutritionInventory');
        const savedHistory = localStorage.getItem('nutritionHistory');

        if (savedInventory) {
            this.inventory = JSON.parse(savedInventory);
        }

        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
            this.migrateHistoryData();
            this.cleanOldHistoryEntries();
        }
    }

    // Save data to localStorage
    saveToLocalStorage() {
        localStorage.setItem('nutritionInventory', JSON.stringify(this.inventory));
        localStorage.setItem('nutritionHistory', JSON.stringify(this.history));
    }

    // Migrate old history entries to include nutritional data
    migrateHistoryData() {
        let migrated = false;
        this.history = this.history.map(entry => {
            // Check if entry already has nutritional data
            if (entry.Calories_100g !== undefined) {
                return entry;
            }

            // Try to find product in inventory to get nutritional data
            const product = this.inventory.find(p => p.Product === entry.Product);
            if (product) {
                migrated = true;
                return {
                    ...entry,
                    Calories_100g: product.Calories_100g || 0,
                    Protein_100g: product.Protein_100g || 0,
                    Fat_100g: product.Fat_100g || 0,
                    Carbs_100g: product.Carbs_100g || 0,
                    Fiber_100g: product.Fiber_100g || 0
                };
            }

            // If product not found in inventory, add zero values
            migrated = true;
            return {
                ...entry,
                Calories_100g: 0,
                Protein_100g: 0,
                Fat_100g: 0,
                Carbs_100g: 0,
                Fiber_100g: 0
            };
        });

        if (migrated) {
            this.saveToLocalStorage();
            console.log('Migrated history entries to include nutritional data');
        }
    }

    // Clean entries older than 5 days
    cleanOldHistoryEntries() {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const before = this.history.length;
        this.history = this.history.filter(entry => {
            const entryDate = new Date(entry.Date);
            return entryDate >= fiveDaysAgo;
        });

        if (before !== this.history.length) {
            this.saveToLocalStorage();
            console.log(`Cleaned ${before - this.history.length} old history entries`);
        }
    }

    // Get inventory
    getInventory() {
        return this.inventory;
    }

    // Get history
    getHistory() {
        return this.history;
    }

    // Add product to inventory
    addProduct(product) {
        this.inventory.push(product);
        this.saveToLocalStorage();
    }

    // Update product in inventory
    updateProduct(productId, updatedProduct) {
        const index = this.inventory.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.inventory[index] = updatedProduct;
            this.saveToLocalStorage();
        }
    }

    // Delete product from inventory
    deleteProduct(productId) {
        this.inventory = this.inventory.filter(p => p.id !== productId);
        this.saveToLocalStorage();
    }

    // Add entry to history
    addHistoryEntry(entry) {
        this.history.push(entry);
        this.saveToLocalStorage();
    }

    // Delete history entry
    deleteHistoryEntry(historyId) {
        this.history = this.history.filter(h => h.id !== historyId);
        this.saveToLocalStorage();
    }

    // Update inventory quantities
    updateInventoryQuantities(selectedProducts) {
        selectedProducts.forEach(item => {
            if (!item.customData) {
                const product = this.inventory.find(p => p.id === item.productId);
                if (product) {
                    product.Quantity_g = Math.max(0, product.Quantity_g - item.quantity);
                }
            }
        });
        this.saveToLocalStorage();
    }
} 