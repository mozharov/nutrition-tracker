# Nutrition Tracker

An application for tracking nutrition with the ability to manage product inventory, plan meals, and keep a consumption history.

## Project Structure

### Main Files
- `index.html` - main HTML page
- `styles.css` - application styles
- `script.js.backup` - backup copy of the original monolithic script

### The `scripts/` Folder - Modular Architecture

#### Main Modules:
- **`app.js`** - main application file, initializes all modules
- **`ui.js`** - UI and event management, coordination between modules
- **`storage.js`** - localStorage and data management
- **`utils.js`** - utility functions (ID generation, formatting, calculations)
- **`inventory.js`** - product inventory management
- **`mealPlanning.js`** - meal planning
- **`dailySummary.js`** - daily summary and statistics
- **`history.js`** - consumption history management

## Architecture

### Modular Structure
The application is divided into logical modules, each responsible for a specific functionality:

1. **StorageManager** (`storage.js`) - centralized data management
2. **InventoryManager** (`inventory.js`) - CRUD operations for products
3. **MealPlanningManager** (`mealPlanning.js`) - product selection and planning
4. **DailySummaryManager** (`dailySummary.js`) - displaying daily statistics
5. **HistoryManager** (`history.js`) - import/export of history
6. **UIManager** (`ui.js`) - UI and event coordination
7. **Utils** (`utils.js`) - common utilities

### Advantages of the New Architecture:
- **Modularity**: each module is responsible for its own area
- **Reusability**: common functions are moved to Utils
- **Testability**: each module can be tested separately
- **Scalability**: easy to add new features
- **Readability**: code is divided into logical blocks

## Usage

1. Open `index.html` in your browser
2. Add products to the inventory
3. Use meal planning to select products
4. View daily statistics
5. Export data if necessary

## Technologies

- HTML5
- CSS3
- JavaScript ES6+ (modules)
- PapaParse for working with CSV
- localStorage for data storage 