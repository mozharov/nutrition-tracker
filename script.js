// Global variables
let inventory = [];
let history = [];
let selectedProducts = [];
let currentDate = new Date();
let editingProductId = null;
let customProductCounter = 0;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeEventListeners();
    updateDateDisplay();
    updateInventoryDisplay();
    updateDailyStats();
    updateDailyItemsList();
});

// Load data from localStorage
function loadFromLocalStorage() {
    const savedInventory = localStorage.getItem('nutritionInventory');
    const savedHistory = localStorage.getItem('nutritionHistory');
    
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }
    
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        migrateHistoryData(); // Add nutritional data to old entries
        cleanOldHistoryEntries();
    }
}

// Migrate old history entries to include nutritional data
function migrateHistoryData() {
    let migrated = false;
    history = history.map(entry => {
        // Check if entry already has nutritional data
        if (entry.Calories_100g !== undefined) {
            return entry;
        }
        
        // Try to find product in inventory to get nutritional data
        const product = inventory.find(p => p.Product === entry.Product);
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
        saveToLocalStorage();
        console.log('Migrated history entries to include nutritional data');
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('nutritionInventory', JSON.stringify(inventory));
    localStorage.setItem('nutritionHistory', JSON.stringify(history));
}

// Clean entries older than 5 days
function cleanOldHistoryEntries() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const before = history.length;
    history = history.filter(entry => {
        const entryDate = new Date(entry.Date);
        return entryDate >= fiveDaysAgo;
    });
    
    if (before !== history.length) {
        saveToLocalStorage();
        console.log(`Cleaned ${before - history.length} old history entries`);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Product form submission
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });
    
    // Import inventory file selection
    document.getElementById('inventoryImportFile').addEventListener('change', handleInventoryImport);
    
    // Import history file selection
    document.getElementById('historyImportFile').addEventListener('change', handleHistoryImport);
    
    // Search box
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    
    // Inventory search box
    document.getElementById('inventorySearchBox').addEventListener('input', handleInventorySearch);
    
    // Close modal on outside click
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProductModal();
        }
    });
}

// Tab switching
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
};

// Inventory Management Functions
function updateInventoryDisplay(searchTerm = '') {
    const inventoryList = document.getElementById('inventoryList');
    
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
            const item = createInventoryItemElement(product);
            inventoryList.appendChild(item);
        });
    }
    
    updateBrowseProductsList();
}

// Handle inventory search
function handleInventorySearch(event) {
    const searchTerm = event.target.value.trim();
    updateInventoryDisplay(searchTerm);
}

function createInventoryItemElement(product) {
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
            <button class="edit-btn" onclick="editProduct('${product.id}')">Edit</button>
            <button class="delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
    `;
    return div;
}

// Product Modal Functions
window.showAddProductModal = function() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').style.display = 'block';
};

window.closeProductModal = function() {
    document.getElementById('productModal').style.display = 'none';
    editingProductId = null;
};

window.editProduct = function(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = product.Product;
    document.getElementById('productQuantity').value = product.Quantity_g;
    document.getElementById('productCalories').value = product.Calories_100g;
    document.getElementById('productProtein').value = product.Protein_100g;
    document.getElementById('productFat').value = product.Fat_100g;
    document.getElementById('productCarbs').value = product.Carbs_100g;
    document.getElementById('productFiber').value = product.Fiber_100g;
    document.getElementById('productModal').style.display = 'block';
};

function saveProduct() {
    const product = {
        id: editingProductId || generateId(),
        Product: document.getElementById('productName').value,
        Quantity_g: parseFloat(document.getElementById('productQuantity').value),
        Calories_100g: parseFloat(document.getElementById('productCalories').value),
        Protein_100g: parseFloat(document.getElementById('productProtein').value),
        Fat_100g: parseFloat(document.getElementById('productFat').value),
        Carbs_100g: parseFloat(document.getElementById('productCarbs').value),
        Fiber_100g: parseFloat(document.getElementById('productFiber').value)
    };
    
    if (editingProductId) {
        const index = inventory.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            inventory[index] = product;
        }
    } else {
        inventory.push(product);
    }
    
    saveToLocalStorage();
    updateInventoryDisplay();
    closeProductModal();
}

window.deleteProduct = function(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        inventory = inventory.filter(p => p.id !== productId);
        saveToLocalStorage();
        updateInventoryDisplay();
    }
};

// Delete history item
window.deleteHistoryItem = function(historyId) {
    if (confirm('Are you sure you want to delete this item from history?')) {
        history = history.filter(h => h.id !== historyId);
        saveToLocalStorage();
        updateDailyStats();
        updateDailyItemsList();
        updateNutrientsPreview();
    }
};

// Import/Export Functions
window.importInventory = function() {
    document.getElementById('inventoryImportFile').click();
};

function handleInventoryImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            const importedProducts = results.data.map(row => ({
                ...row,
                id: generateId()
            }));
            
            // Add imported products to existing inventory
            inventory = [...inventory, ...importedProducts];
            saveToLocalStorage();
            updateInventoryDisplay();
            
            alert(`Successfully imported ${importedProducts.length} products`);
        },
        error: function(error) {
            alert('Error importing file: ' + error.message);
        }
    });
    
    // Clear the file input
    event.target.value = '';
}

window.exportInventory = function() {
    if (inventory.length === 0) {
        alert('No products to export');
        return;
    }
    
    // Remove id field for export
    const exportData = inventory.map(({id, ...rest}) => rest);
    const csv = Papa.unparse(exportData);
    downloadCSV(csv, 'inventory.csv');
};

window.importHistory = function() {
    document.getElementById('historyImportFile').click();
};

function handleHistoryImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data.length === 0) {
                alert('No data found in the file');
                return;
            }
            
            // Validate that the imported data has the required fields
            const requiredFields = ['Date', 'Product', 'Quantity_g'];
            const firstRow = results.data[0];
            const missingFields = requiredFields.filter(field => !(field in firstRow));
            
            if (missingFields.length > 0) {
                alert(`Missing required fields: ${missingFields.join(', ')}`);
                return;
            }
            
            // Check if nutritional data is included
            const hasNutritionData = 'Calories_100g' in firstRow;
            
            // Replace history with imported data
            history = results.data.map(row => ({
                ...row,
                id: generateId(),
                // Ensure numeric values for nutritional data
                Calories_100g: parseFloat(row.Calories_100g) || 0,
                Protein_100g: parseFloat(row.Protein_100g) || 0,
                Fat_100g: parseFloat(row.Fat_100g) || 0,
                Carbs_100g: parseFloat(row.Carbs_100g) || 0,
                Fiber_100g: parseFloat(row.Fiber_100g) || 0
            }));
            
            cleanOldHistoryEntries();
            saveToLocalStorage();
            updateDailyStats();
            updateDailyItemsList();
            updateNutrientsPreview();
            
            let message = `Successfully imported ${results.data.length} history entries`;
            if (hasNutritionData) {
                message += ' with nutritional data';
            } else {
                message += ' (no nutritional data found - will use current inventory values)';
            }
            alert(message);
        },
        error: function(error) {
            alert('Error importing history: ' + error.message);
        }
    });
    
    // Clear the file input
    event.target.value = '';
}

window.exportHistory = function() {
    if (history.length === 0) {
        alert('No history to export');
        return;
    }
    
    // Remove id field for export, but keep all nutritional data
    const exportData = history.map(({id, ...rest}) => rest);
    const csv = Papa.unparse(exportData);
    
    // Generate filename with current date
    const today = new Date();
    const dateStr = formatDate(today);
    const filename = `nutrition_history_${dateStr}.csv`;
    
    downloadCSV(csv, filename);
};

window.clearOldHistory = function() {
    if (confirm('Are you sure you want to clear all history entries older than 5 days?')) {
        cleanOldHistoryEntries();
        updateDailyStats();
        updateDailyItemsList();
        alert('Old history entries cleared');
    }
};

// Meal Planning Functions
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    const productList = document.getElementById('productList');
    
    if (searchTerm.length < 2) {
        productList.style.display = 'none';
        return;
    }
    
    const matches = inventory.filter(product => 
        product.Product.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
    
    productList.innerHTML = '';
    
    if (matches.length > 0) {
        matches.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.textContent = product.Product;
            item.onclick = () => addToSelected(product);
            productList.appendChild(item);
        });
        productList.style.display = 'block';
    } else {
        productList.style.display = 'none';
    }
}

function updateBrowseProductsList() {
    const browseList = document.getElementById('browseProductsList');
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
            <button class="quick-add-btn" onclick="quickAddProduct('${product.id}')">Add</button>
        `;
        browseList.appendChild(item);
    });
}

window.quickAddProduct = function(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = parseInt(document.getElementById(`quick-${productId}`).value) || 100;
    addToSelected(product, quantity);
};

function addToSelected(product, quantity = 100) {
    const existing = selectedProducts.find(p => p.productId === product.id);
    
    if (existing) {
        existing.quantity += quantity;
    } else {
        selectedProducts.push({
            productId: product.id,
            product: product.Product,
            quantity: quantity
        });
    }
    
    updateSelectedProductsDisplay();
    updateNutrientsPreview();
    
    // Clear search
    document.getElementById('searchBox').value = '';
    document.getElementById('productList').style.display = 'none';
}

window.addCustomProduct = function() {
    const name = document.getElementById('customProductName').value.trim();
    const quantity = parseFloat(document.getElementById('customQuantity').value) || 100;
    const calories = parseFloat(document.getElementById('customCalories').value) || 0;
    const protein = parseFloat(document.getElementById('customProtein').value) || 0;
    const fat = parseFloat(document.getElementById('customFat').value) || 0;
    const carbs = parseFloat(document.getElementById('customCarbs').value) || 0;
    const fiber = parseFloat(document.getElementById('customFiber').value) || 0;
    
    if (!name) {
        alert('Please enter a product name');
        return;
    }
    
    // Create a temporary custom product
    const customProduct = {
        id: 'custom_' + customProductCounter++,
        Product: name,
        Quantity_g: quantity,
        Calories_100g: calories,
        Protein_100g: protein,
        Fat_100g: fat,
        Carbs_100g: carbs,
        Fiber_100g: fiber,
        isCustom: true
    };
    
    // Add to selected products
    selectedProducts.push({
        productId: customProduct.id,
        product: customProduct.Product,
        quantity: quantity,
        customData: customProduct
    });
    
    updateSelectedProductsDisplay();
    updateNutrientsPreview();
    
    // Clear form
    document.getElementById('customProductName').value = '';
    document.getElementById('customQuantity').value = '100';
    document.getElementById('customCalories').value = '';
    document.getElementById('customProtein').value = '';
    document.getElementById('customFat').value = '';
    document.getElementById('customCarbs').value = '';
    document.getElementById('customFiber').value = '';
};

window.importProductList = function() {
    const textarea = document.getElementById('importTextarea');
    const lines = textarea.value.split('\n');
    let addedCount = 0;
    let notFound = [];
    
    lines.forEach(line => {
        const match = line.match(/^(.+?)\s*[-–—]\s*(\d+)/);
        if (match) {
            const productName = match[1].trim();
            const quantity = parseInt(match[2]);
            
            const product = inventory.find(p => 
                p.Product.toLowerCase().includes(productName.toLowerCase()) ||
                productName.toLowerCase().includes(p.Product.toLowerCase())
            );
            
            if (product) {
                addToSelected(product, quantity);
                addedCount++;
            } else {
                notFound.push({name: productName, quantity: quantity});
            }
        }
    });
    
    textarea.value = '';
    
    const resultDiv = document.getElementById('importResult');
    if (addedCount > 0 || notFound.length > 0) {
        let html = '';
        if (addedCount > 0) {
            html += `<strong>✅ Added: ${addedCount} products</strong><br>`;
        }
        if (notFound.length > 0) {
            html += '<br><strong>❌ Not found:</strong><br>';
            notFound.forEach(item => {
                html += `• ${item.name} - ${item.quantity}g<br>`;
            });
        }
        
        resultDiv.innerHTML = html;
        resultDiv.className = notFound.length > 0 ? 'import-result warning' : 'import-result success';
        resultDiv.style.display = 'block';
        
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }
};

function updateSelectedProductsDisplay() {
    const container = document.getElementById('selectedProducts');
    
    if (selectedProducts.length === 0) {
        container.innerHTML = '<div class="empty-state">No products selected</div>';
        document.getElementById('applyBtn').disabled = true;
    } else {
        container.innerHTML = '';
        selectedProducts.forEach((item, index) => {
            let product;
            let isCustom = false;
            
            if (item.customData) {
                product = item.customData;
                isCustom = true;
            } else {
                product = inventory.find(p => p.id === item.productId);
                if (!product) return;
            }
            
            const div = document.createElement('div');
            div.className = 'selected-item';
            div.innerHTML = `
                <div class="selected-item-info">
                    ${item.product} ${isCustom ? '<span class="custom-indicator">Custom</span>' : `(${product.Quantity_g}g available)`}
                </div>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                       onchange="updateQuantity(${index}, this.value)">
                <span>g</span>
                <button class="remove-btn" onclick="removeSelected(${index})">Remove</button>
            `;
            container.appendChild(div);
        });
        document.getElementById('applyBtn').disabled = false;
    }
}

window.updateQuantity = function(index, value) {
    selectedProducts[index].quantity = parseInt(value) || 0;
    updateNutrientsPreview();
};

window.removeSelected = function(index) {
    selectedProducts.splice(index, 1);
    updateSelectedProductsDisplay();
    updateNutrientsPreview();
};

function updateNutrientsPreview() {
    const selected = calculateNutrients(selectedProducts);
    const daily = calculateDailyNutrients();
    const combined = {
        calories: selected.calories + daily.calories,
        protein: selected.protein + daily.protein,
        fat: selected.fat + daily.fat,
        carbs: selected.carbs + daily.carbs,
        fiber: selected.fiber + daily.fiber
    };
    
    document.getElementById('selectedNutrients').textContent = formatNutrients(selected, true);
    document.getElementById('dailyTotalNutrients').textContent = formatNutrients(daily, true);
    document.getElementById('combinedNutrients').textContent = formatNutrients(combined, true);
}

function calculateNutrients(items) {
    let totals = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0
    };
    
    items.forEach(item => {
        let product;
        
        // Check if it's a custom product
        if (item.customData) {
            product = item.customData;
        } else {
            product = inventory.find(p => p.id === item.productId);
        }
        
        if (product) {
            const multiplier = item.quantity / 100;
            totals.calories += Math.round((product.Calories_100g || 0) * multiplier);
            totals.protein += (product.Protein_100g || 0) * multiplier;
            totals.fat += (product.Fat_100g || 0) * multiplier;
            totals.carbs += (product.Carbs_100g || 0) * multiplier;
            totals.fiber += (product.Fiber_100g || 0) * multiplier;
        }
    });
    
    // Round to 1 decimal
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fiber = Math.round(totals.fiber * 10) / 10;
    
    return totals;
}

function formatNutrients(nutrients, roundToWhole = false) {
    if (roundToWhole) {
        // Round to whole numbers for planning and daily totals
        return `${Math.round(nutrients.calories)} kcal | ${Math.round(nutrients.protein)}g protein | ${Math.round(nutrients.fat)}g fat | ${Math.round(nutrients.carbs)}g carbs | ${Math.round(nutrients.fiber)}g fiber`;
    } else {
        // Keep 1 decimal place for other displays
        return `${nutrients.calories} kcal | ${nutrients.protein}g protein | ${nutrients.fat}g fat | ${nutrients.carbs}g carbs | ${nutrients.fiber}g fiber`;
    }
}

window.applyChanges = function() {
    if (selectedProducts.length === 0) return;
    
    const dateStr = formatDate(currentDate);
    
    // Update inventory quantities (skip custom products)
    selectedProducts.forEach(item => {
        if (!item.customData) {
            const product = inventory.find(p => p.id === item.productId);
            if (product) {
                product.Quantity_g = Math.max(0, product.Quantity_g - item.quantity);
            }
        }
    });
    
    // Add to history with complete nutritional info
    // First, check existing history entries for today to combine identical products
    const todayHistory = history.filter(h => h.Date === dateStr);
    
    selectedProducts.forEach(item => {
        let nutritionData;
        let productName = item.product;
        
        if (item.customData) {
            // Custom product - use its data
            nutritionData = item.customData;
            productName = item.product + ' (Custom)';
        } else {
            // Regular product from inventory
            nutritionData = inventory.find(p => p.id === item.productId);
        }
        
        if (nutritionData) {
            // Check if this product already exists in today's history with same nutritional values
            const existingEntry = todayHistory.find(h => 
                h.Product === productName &&
                h.Calories_100g === nutritionData.Calories_100g &&
                h.Protein_100g === nutritionData.Protein_100g &&
                h.Fat_100g === nutritionData.Fat_100g &&
                h.Carbs_100g === nutritionData.Carbs_100g &&
                h.Fiber_100g === nutritionData.Fiber_100g
            );
            
            if (existingEntry) {
                // Update existing entry by adding quantities
                existingEntry.Quantity_g += item.quantity;
            } else {
                // Add new entry
                history.push({
                    id: generateId(),
                    Date: dateStr,
                    Product: productName,
                    Quantity_g: item.quantity,
                    // Store nutritional values per 100g for future reference
                    Calories_100g: nutritionData.Calories_100g,
                    Protein_100g: nutritionData.Protein_100g,
                    Fat_100g: nutritionData.Fat_100g,
                    Carbs_100g: nutritionData.Carbs_100g,
                    Fiber_100g: nutritionData.Fiber_100g
                });
            }
        }
    });
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Clear selected products
    selectedProducts = [];
    
    // Update displays
    updateInventoryDisplay();
    updateSelectedProductsDisplay();
    updateNutrientsPreview();
    updateDailyStats();
    updateDailyItemsList();
    
    alert('Changes applied successfully!');
};

// Daily Summary Functions
function updateDateDisplay() {
    document.getElementById('currentDate').textContent = formatDate(currentDate);
    
    // Disable next button if current date is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);
    
    document.getElementById('nextDateBtn').disabled = current >= today;
}

window.changeDate = function(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    updateDailyStats();
    updateDailyItemsList();
};

function calculateDailyNutrients() {
    const dateStr = formatDate(currentDate);
    const dailyItems = history.filter(item => item.Date === dateStr);
    
    let totals = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0
    };
    
    dailyItems.forEach(item => {
        // Use nutritional data stored in history (if available) or fallback to inventory lookup
        let nutritionData;
        
        if (item.Calories_100g !== undefined) {
            // Use stored nutritional data from history
            nutritionData = {
                Calories_100g: item.Calories_100g,
                Protein_100g: item.Protein_100g,
                Fat_100g: item.Fat_100g,
                Carbs_100g: item.Carbs_100g,
                Fiber_100g: item.Fiber_100g
            };
        } else {
            // Fallback to inventory lookup for older history entries
            const product = inventory.find(p => p.Product === item.Product);
            if (product) {
                nutritionData = product;
            } else {
                // Product not found in inventory and no stored nutrition data
                return;
            }
        }
        
        const multiplier = item.Quantity_g / 100;
        totals.calories += Math.round((nutritionData.Calories_100g || 0) * multiplier);
        totals.protein += (nutritionData.Protein_100g || 0) * multiplier;
        totals.fat += (nutritionData.Fat_100g || 0) * multiplier;
        totals.carbs += (nutritionData.Carbs_100g || 0) * multiplier;
        totals.fiber += (nutritionData.Fiber_100g || 0) * multiplier;
    });
    
    // Round to 1 decimal
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fiber = Math.round(totals.fiber * 10) / 10;
    
    return totals;
}

function updateDailyStats() {
    const nutrients = calculateDailyNutrients();
    
    document.getElementById('dailyCalories').textContent = Math.round(nutrients.calories);
    document.getElementById('dailyProtein').textContent = Math.round(nutrients.protein);
    document.getElementById('dailyFat').textContent = Math.round(nutrients.fat);
    document.getElementById('dailyCarbs').textContent = Math.round(nutrients.carbs);
    document.getElementById('dailyFiber').textContent = Math.round(nutrients.fiber);
}

function updateDailyItemsList() {
    const dateStr = formatDate(currentDate);
    const dailyItems = history.filter(item => item.Date === dateStr);
    const container = document.getElementById('dailyItemsList');
    
    if (dailyItems.length === 0) {
        container.innerHTML = '<div class="empty-state">No items consumed today</div>';
    } else {
        container.innerHTML = '';
        dailyItems.forEach(item => {
            // Calculate total nutrients for this item
            const multiplier = item.Quantity_g / 100;
            const calories = Math.round((item.Calories_100g || 0) * multiplier);
            const protein = Math.round((item.Protein_100g || 0) * multiplier * 10) / 10;
            const fat = Math.round((item.Fat_100g || 0) * multiplier * 10) / 10;
            const carbs = Math.round((item.Carbs_100g || 0) * multiplier * 10) / 10;
            const fiber = Math.round((item.Fiber_100g || 0) * multiplier * 10) / 10;
            
            const div = document.createElement('div');
            div.className = 'daily-item';
            div.innerHTML = `
                <div class="daily-item-header">
                    <span class="daily-item-name">${item.Product}</span>
                    <span class="daily-item-quantity">${item.Quantity_g}g</span>
                    <button class="delete-btn" onclick="deleteHistoryItem('${item.id}')">Delete</button>
                </div>
                <div class="daily-item-nutrients">
                    ${calories} kcal | ${protein}g protein | ${fat}g fat | ${carbs}g carbs | ${fiber}g fiber
                </div>
            `;
            container.appendChild(div);
        });
    }
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
    const searchBox = document.getElementById('searchBox');
    const productList = document.getElementById('productList');
    
    if (!searchBox.contains(e.target) && !productList.contains(e.target)) {
        productList.style.display = 'none';
    }
});