// Daily summary module
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class DailySummaryManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentDate = new Date();
    }

    // Update date display
    updateDateDisplay() {
        document.getElementById('currentDate').textContent = Utils.formatDate(this.currentDate);

        // Disable next button if current date is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const current = new Date(this.currentDate);
        current.setHours(0, 0, 0, 0);

        document.getElementById('nextDateBtn').disabled = current >= today;
    }

    // Change date
    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.updateDateDisplay();
        this.updateDailyStats();
        this.updateDailyItemsList();
    }

    // Calculate daily nutrients
    calculateDailyNutrients() {
        const history = this.storage.getHistory();
        const inventory = this.storage.getInventory();
        const dateStr = Utils.formatDate(this.currentDate);
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

    // Update daily stats
    updateDailyStats() {
        const nutrients = this.calculateDailyNutrients();

        document.getElementById('dailyCalories').textContent = Math.round(nutrients.calories);
        document.getElementById('dailyProtein').textContent = Math.round(nutrients.protein);
        document.getElementById('dailyFat').textContent = Math.round(nutrients.fat);
        document.getElementById('dailyCarbs').textContent = Math.round(nutrients.carbs);
        document.getElementById('dailyFiber').textContent = Math.round(nutrients.fiber);

        // Calculate and display percentages
        if (nutrients.protein > 0 || nutrients.fat > 0 || nutrients.carbs > 0) {
            const percentages = Utils.calculateMacroPercentages(nutrients);
            document.getElementById('dailyProteinPercent').textContent = `${percentages.protein}%`;
            document.getElementById('dailyFatPercent').textContent = `${percentages.fat}%`;
            document.getElementById('dailyCarbsPercent').textContent = `${percentages.carbs}%`;
        } else {
            document.getElementById('dailyProteinPercent').textContent = '';
            document.getElementById('dailyFatPercent').textContent = '';
            document.getElementById('dailyCarbsPercent').textContent = '';
        }
    }

    // Update daily items list
    updateDailyItemsList() {
        const history = this.storage.getHistory();
        const dateStr = Utils.formatDate(this.currentDate);
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
                        <button class="delete-btn" onclick="dailySummaryManager.deleteHistoryItem('${item.id}')">Delete</button>
                    </div>
                    <div class="daily-item-nutrients">
                        ${calories} kcal | ${protein}g protein | ${fat}g fat | ${carbs}g carbs | ${fiber}g fiber
                    </div>
                `;
                container.appendChild(div);
            });
        }
    }

    // Delete history item
    deleteHistoryItem(historyId) {
        if (confirm('Are you sure you want to delete this item from history?')) {
            this.storage.deleteHistoryEntry(historyId);
            this.updateDailyStats();
            this.updateDailyItemsList();
        }
    }

    // Get current date
    getCurrentDate() {
        return this.currentDate;
    }

    // Set current date
    setCurrentDate(date) {
        this.currentDate = date;
        this.updateDateDisplay();
        this.updateDailyStats();
        this.updateDailyItemsList();
    }
} 