// Inventory management module
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class InventoryManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.editingProductId = null;
    }

    // Update inventory display
    updateInventoryDisplay(searchTerm = '') {
        const inventoryList = document.getElementById('inventoryList');
        const inventory = this.storage.getInventory();

        // Filter inventory based on search term
        let filteredInventory = inventory;
        if (searchTerm) {
            filteredInventory = inventory.filter(product =>
                product.Product.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filteredInventory.length === 0) {
            if (searchTerm) {
                inventoryList.innerHTML = '<div class="inventory-empty"><p>No products found matching your search.</p></div>';
            } else {
                inventoryList.innerHTML = '<div class="inventory-empty" id="inventoryEmpty"><p>No products in inventory. Add products or import from CSV.</p></div>';
            }
        } else {
            inventoryList.innerHTML = '';

            // Sort inventory: products with quantity > 0 first (sorted by name), then products with quantity = 0 (sorted by name)
            const sortedInventory = [...filteredInventory].sort((a, b) => {
                // First, separate by quantity (0 vs non-0)
                if (a.Quantity_g === 0 && b.Quantity_g > 0) return 1;
                if (a.Quantity_g > 0 && b.Quantity_g === 0) return -1;
                // Then sort by name within each group
                return a.Product.localeCompare(b.Product);
            });

            sortedInventory.forEach(product => {
                const item = this.createInventoryItemElement(product);
                inventoryList.appendChild(item);
            });
        }

        this.updateBrowseProductsList();
    }

    // Create inventory item element
    createInventoryItemElement(product) {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <div class="inventory-item-info">
                <div class="inventory-item-name">${product.Product}</div>
                <div class="inventory-item-nutrients">
                    ${Math.round(product.Calories_100g * 10) / 10} kcal | ${Math.round(product.Protein_100g * 10) / 10}g protein | 
                    ${Math.round(product.Fat_100g * 10) / 10}g fat | ${Math.round(product.Carbs_100g * 10) / 10}g carbs | ${Math.round(product.Fiber_100g * 10) / 10}g fiber
                </div>
            </div>
            <div class="inventory-item-quantity">${Math.round(product.Quantity_g * 10) / 10}g</div>
            <div class="inventory-item-actions">
                <button class="edit-btn" onclick="inventoryManager.editProduct('${product.id}')">Edit</button>
                <button class="delete-btn" onclick="inventoryManager.deleteProduct('${product.id}')">Delete</button>
            </div>
        `;
        return div;
    }

    // Update browse products list
    updateBrowseProductsList() {
        const browseList = document.getElementById('browseProductsList');
        const inventory = this.storage.getInventory();
        browseList.innerHTML = '';

        // Sort inventory: products with quantity > 0 first (sorted by name), then products with quantity = 0 (sorted by name)
        const sortedInventory = [...inventory].sort((a, b) => {
            // First, separate by quantity (0 vs non-0)
            if (a.Quantity_g === 0 && b.Quantity_g > 0) return 1;
            if (a.Quantity_g > 0 && b.Quantity_g === 0) return -1;
            // Then sort by name within each group
            return a.Product.localeCompare(b.Product);
        });

        sortedInventory.forEach(product => {
            const item = document.createElement('div');
            item.className = 'browse-product-item';
            item.innerHTML = `
                <div class="browse-product-name">${product.Product} (${product.Quantity_g}g available)</div>
                <input type="number" class="quick-quantity" id="quick-${product.id}" value="100" min="1">
                <button class="quick-add-btn" onclick="mealPlanningManager.quickAddProduct('${product.id}')">Add</button>
            `;
            browseList.appendChild(item);
        });
    }

    // Handle inventory search
    handleInventorySearch(event) {
        const searchTerm = event.target.value.trim();
        this.updateInventoryDisplay(searchTerm);
    }

    // Show add product modal
    showAddProductModal() {
        this.editingProductId = null;
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productModal').style.display = 'block';
    }

    // Close product modal
    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        this.editingProductId = null;
    }

    // Edit product
    editProduct(productId) {
        const inventory = this.storage.getInventory();
        const product = inventory.find(p => p.id === productId);
        if (!product) return;

        this.editingProductId = productId;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productName').value = product.Product;
        document.getElementById('productQuantity').value = product.Quantity_g;
        document.getElementById('productCalories').value = product.Calories_100g;
        document.getElementById('productProtein').value = product.Protein_100g;
        document.getElementById('productFat').value = product.Fat_100g;
        document.getElementById('productCarbs').value = product.Carbs_100g;
        document.getElementById('productFiber').value = product.Fiber_100g;
        document.getElementById('productModal').style.display = 'block';
    }

    // Save product
    saveProduct() {
        const product = {
            id: this.editingProductId || Utils.generateId(),
            Product: document.getElementById('productName').value,
            Quantity_g: parseFloat(document.getElementById('productQuantity').value),
            Calories_100g: parseFloat(document.getElementById('productCalories').value),
            Protein_100g: parseFloat(document.getElementById('productProtein').value),
            Fat_100g: parseFloat(document.getElementById('productFat').value),
            Carbs_100g: parseFloat(document.getElementById('productCarbs').value),
            Fiber_100g: parseFloat(document.getElementById('productFiber').value)
        };

        if (this.editingProductId) {
            this.storage.updateProduct(this.editingProductId, product);
        } else {
            this.storage.addProduct(product);
        }

        this.updateInventoryDisplay();
        this.closeProductModal();
    }

    // Delete product
    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.storage.deleteProduct(productId);
            this.updateInventoryDisplay();
        }
    }

    // Import inventory from CSV
    importInventory(event) {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedProducts = results.data.map(row => ({
                    ...row,
                    id: Utils.generateId()
                }));

                // Add imported products to existing inventory
                const inventory = this.storage.getInventory();
                const newInventory = [...inventory, ...importedProducts];
                this.storage.inventory = newInventory;
                this.storage.saveToLocalStorage();
                this.updateInventoryDisplay();

                alert(`Successfully imported ${importedProducts.length} products`);
            },
            error: (error) => {
                alert('Error importing file: ' + error.message);
            }
        });

        // Clear the file input
        event.target.value = '';
    }

    // Export inventory to CSV
    exportInventory() {
        const inventory = this.storage.getInventory();
        if (inventory.length === 0) {
            alert('No products to export');
            return;
        }

        // Remove id field for export
        const exportData = inventory.map(({ id, ...rest }) => rest);
        const csv = Papa.unparse(exportData);
        Utils.downloadCSV(csv, 'inventory.csv');
    }
} 