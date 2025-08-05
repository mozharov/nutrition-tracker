// Meal planning module
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class MealPlanningManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.selectedProducts = [];
        this.customProductCounter = 0;
    }

    // Handle search
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        const productList = document.getElementById('productList');
        const inventory = this.storage.getInventory();

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
                item.onclick = () => this.addToSelected(product);
                productList.appendChild(item);
            });
            productList.style.display = 'block';
        } else {
            productList.style.display = 'none';
        }
    }

    // Quick add product
    quickAddProduct(productId) {
        const inventory = this.storage.getInventory();
        const product = inventory.find(p => p.id === productId);
        if (!product) return;

        const quantity = parseInt(document.getElementById(`quick-${productId}`).value) || 100;
        this.addToSelected(product, quantity);
    }

    // Add to selected products
    addToSelected(product, quantity = 100) {
        const existing = this.selectedProducts.find(p => p.productId === product.id);

        if (existing) {
            existing.quantity += quantity;
        } else {
            this.selectedProducts.push({
                productId: product.id,
                product: product.Product,
                quantity: quantity
            });
        }

        this.updateSelectedProductsDisplay();
        this.updateNutrientsPreview();

        // Clear search
        document.getElementById('searchBox').value = '';
        document.getElementById('productList').style.display = 'none';
    }

    // Add custom product
    addCustomProduct() {
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
            id: 'custom_' + this.customProductCounter++,
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
        this.selectedProducts.push({
            productId: customProduct.id,
            product: customProduct.Product,
            quantity: quantity,
            customData: customProduct
        });

        this.updateSelectedProductsDisplay();
        this.updateNutrientsPreview();

        // Clear form
        document.getElementById('customProductName').value = '';
        document.getElementById('customQuantity').value = '100';
        document.getElementById('customCalories').value = '';
        document.getElementById('customProtein').value = '';
        document.getElementById('customFat').value = '';
        document.getElementById('customCarbs').value = '';
        document.getElementById('customFiber').value = '';
    }

    // Import product list from text
    importProductList() {
        const textarea = document.getElementById('importTextarea');
        const lines = textarea.value.split('\n');
        let addedCount = 0;
        let notFound = [];
        const inventory = this.storage.getInventory();

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
                    this.addToSelected(product, quantity);
                    addedCount++;
                } else {
                    notFound.push({ name: productName, quantity: quantity });
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
    }

    // Update selected products display
    updateSelectedProductsDisplay() {
        const container = document.getElementById('selectedProducts');
        const inventory = this.storage.getInventory();

        if (this.selectedProducts.length === 0) {
            container.innerHTML = '<div class="empty-state">No products selected</div>';
            document.getElementById('applyBtn').disabled = true;
        } else {
            container.innerHTML = '';
            this.selectedProducts.forEach((item, index) => {
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
                           onchange="mealPlanningManager.updateQuantity(${index}, this.value)">
                    <span>g</span>
                    <button class="remove-btn" onclick="mealPlanningManager.removeSelected(${index})">Remove</button>
                `;
                container.appendChild(div);
            });
            document.getElementById('applyBtn').disabled = false;
        }
    }

    // Update quantity
    updateQuantity(index, value) {
        this.selectedProducts[index].quantity = parseInt(value) || 0;
        this.updateNutrientsPreview();
    }

    // Remove selected product
    removeSelected(index) {
        this.selectedProducts.splice(index, 1);
        this.updateSelectedProductsDisplay();
        this.updateNutrientsPreview();
    }

    // Update nutrients preview
    updateNutrientsPreview() {
        const inventory = this.storage.getInventory();
        const selected = Utils.calculateNutrients(this.selectedProducts, inventory);
        const daily = this.calculateDailyNutrients();
        const combined = {
            calories: selected.calories + daily.calories,
            protein: selected.protein + daily.protein,
            fat: selected.fat + daily.fat,
            carbs: selected.carbs + daily.carbs,
            fiber: selected.fiber + daily.fiber
        };

        document.getElementById('selectedNutrients').textContent = Utils.formatNutrients(selected, true);
        document.getElementById('dailyTotalNutrients').textContent = Utils.formatNutrients(daily, true);
        document.getElementById('combinedNutrients').textContent = Utils.formatNutrients(combined, true, true);
    }

    // Calculate daily nutrients
    calculateDailyNutrients() {
        const history = this.storage.getHistory();
        const inventory = this.storage.getInventory();
        const currentDate = new Date();
        const dateStr = Utils.formatDate(currentDate);
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

    // Apply changes
    applyChanges() {
        if (this.selectedProducts.length === 0) return;

        const dateStr = Utils.formatDate(new Date());
        const history = this.storage.getHistory();
        const inventory = this.storage.getInventory();

        // Update inventory quantities (skip custom products)
        this.storage.updateInventoryQuantities(this.selectedProducts);

        // Add to history with complete nutritional info
        // First, check existing history entries for today to combine identical products
        const todayHistory = history.filter(h => h.Date === dateStr);

        this.selectedProducts.forEach(item => {
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
                    this.storage.addHistoryEntry({
                        id: Utils.generateId(),
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

        // Clear selected products
        this.selectedProducts = [];

        // Update displays
        this.updateSelectedProductsDisplay();
        this.updateNutrientsPreview();

        alert('Changes applied successfully!');
    }

    // Clear selected products
    clearSelectedProducts() {
        this.selectedProducts = [];
        this.updateSelectedProductsDisplay();
        this.updateNutrientsPreview();
    }
} 