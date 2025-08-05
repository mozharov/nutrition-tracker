// Utility functions module
export class Utils {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Format date to YYYY-MM-DD
    static formatDate(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    // Download CSV file
    static downloadCSV(csv, filename) {
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

    // Calculate nutrients for given items
    static calculateNutrients(items, inventory) {
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

    // Calculate macro percentages
    static calculateMacroPercentages(nutrients) {
        // Calculate calories from each macronutrient
        const proteinCalories = nutrients.protein * 4;
        const fatCalories = nutrients.fat * 9;
        const carbCalories = nutrients.carbs * 4;

        // Total calories from macros (might differ slightly from reported calories)
        const totalMacroCalories = proteinCalories + fatCalories + carbCalories;

        // Calculate percentages
        const percentages = {
            protein: totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0,
            fat: totalMacroCalories > 0 ? Math.round((fatCalories / totalMacroCalories) * 100) : 0,
            carbs: totalMacroCalories > 0 ? Math.round((carbCalories / totalMacroCalories) * 100) : 0
        };

        return percentages;
    }

    // Format nutrients display
    static formatNutrients(nutrients, roundToWhole = false, includePercentages = false) {
        let result;

        if (roundToWhole) {
            // Round to whole numbers for planning and daily totals
            result = `${Math.round(nutrients.calories)} kcal | ${Math.round(nutrients.protein)}g protein | ${Math.round(nutrients.fat)}g fat | ${Math.round(nutrients.carbs)}g carbs | ${Math.round(nutrients.fiber)}g fiber`;
        } else {
            // Keep 1 decimal place for other displays
            result = `${nutrients.calories} kcal | ${nutrients.protein}g protein | ${nutrients.fat}g fat | ${nutrients.carbs}g carbs | ${nutrients.fiber}g fiber`;
        }

        if (includePercentages && (nutrients.protein > 0 || nutrients.fat > 0 || nutrients.carbs > 0)) {
            const percentages = this.calculateMacroPercentages(nutrients);
            result += ` | P:${percentages.protein}% F:${percentages.fat}% C:${percentages.carbs}%`;
        }

        return result;
    }
} 