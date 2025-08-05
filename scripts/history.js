// History management module
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class HistoryManager {
    constructor(storageManager) {
        this.storage = storageManager;
    }

    // Import history from CSV
    importHistory(event) {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
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
                const newHistory = results.data.map(row => ({
                    ...row,
                    id: Utils.generateId(),
                    // Ensure numeric values for nutritional data
                    Calories_100g: parseFloat(row.Calories_100g) || 0,
                    Protein_100g: parseFloat(row.Protein_100g) || 0,
                    Fat_100g: parseFloat(row.Fat_100g) || 0,
                    Carbs_100g: parseFloat(row.Carbs_100g) || 0,
                    Fiber_100g: parseFloat(row.Fiber_100g) || 0
                }));

                this.storage.history = newHistory;
                this.storage.cleanOldHistoryEntries();
                this.storage.saveToLocalStorage();

                let message = `Successfully imported ${results.data.length} history entries`;
                if (hasNutritionData) {
                    message += ' with nutritional data';
                } else {
                    message += ' (no nutritional data found - will use current inventory values)';
                }
                alert(message);
            },
            error: (error) => {
                alert('Error importing history: ' + error.message);
            }
        });

        // Clear the file input
        event.target.value = '';
    }

    // Export history to CSV
    exportHistory() {
        const history = this.storage.getHistory();
        if (history.length === 0) {
            alert('No history to export');
            return;
        }

        // Remove id field for export, but keep all nutritional data
        const exportData = history.map(({ id, ...rest }) => rest);
        const csv = Papa.unparse(exportData);

        // Generate filename with current date
        const today = new Date();
        const dateStr = Utils.formatDate(today);
        const filename = `nutrition_history_${dateStr}.csv`;

        Utils.downloadCSV(csv, filename);
    }

    // Clear old history entries
    clearOldHistory() {
        if (confirm('Are you sure you want to clear all history entries older than 5 days?')) {
            this.storage.cleanOldHistoryEntries();
            alert('Old history entries cleared');
        }
    }
} 