import { useState } from 'react';
import { useCuisine } from '../../context/CuisineContext';
import { Plus, Trash2, Save, Calendar, BookOpen, Settings } from 'lucide-react';
import type { Ingredient, MenuStructure } from '../../types';
import { DEFAULT_STRUCTURE } from '../../types';
import { MenuGrid } from '../../components/grid/MenuGrid';
import { StructureModal } from '../../components/modals/StructureModal';

export function Recipes() {
    const { ingredients, addRecipe, recipes, removeRecipe, currentWeek, changeWeek, menuItems } = useCuisine();

    const exportToCSV = () => {
        const headers = ['Date', 'Jour', 'Composante', 'Plat', 'Coût Portion', 'Ingrédients'].join(',');

        const rows = Object.values(menuItems).map(item => {
            const ingredientsList = item.components?.map(c => c.name).join('; ') || '';
            const cost = item.components?.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0) || 0;
            return [
                currentWeek,
                item.day,
                item.component,
                `"${item.dishName}"`, // Quote to handle commas in names
                cost.toFixed(2),
                `"${ingredientsList}"`
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `menu_semaine_${currentWeek}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Tab State: 'library' | 'menu'
    const [activeTab, setActiveTab] = useState<'library' | 'menu'>('menu'); // Default to Menu

    // Menu Structure State
    const [structure, setStructure] = useState<MenuStructure>(DEFAULT_STRUCTURE);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

    // Recipe Form State
    const [recipeName, setRecipeName] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState<{ item: Ingredient, qty: number }[]>([]);
    const [currentIngredientId, setCurrentIngredientId] = useState('');
    const [currentQty, setCurrentQty] = useState<number>(1);

    const handleAddIngredient = () => {
        const ingredient = ingredients.find(i => i.id === currentIngredientId);
        if (ingredient) {
            setSelectedIngredients(prev => [...prev, { item: ingredient, qty: currentQty }]);
            setCurrentIngredientId('');
            setCurrentQty(1);
        }
    };

    const calculateTotalCost = (ings: { item: Ingredient, qty: number }[]) => {
        return ings.reduce((total, { item, qty }) => total + (item.unitPrice * qty), 0);
    };

    const handleSaveRecipe = () => {
        if (!recipeName || selectedIngredients.length === 0) return;

        addRecipe({
            id: Math.random().toString(36).substr(2, 9),
            name: recipeName,
            ingredients: selectedIngredients,
            totalCost: calculateTotalCost(selectedIngredients)
        });

        setRecipeName('');
        setSelectedIngredients([]);
        // Optionally switch to library tab to see it
        setActiveTab('library');
    };

    const recipeCost = calculateTotalCost(selectedIngredients);

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'menu' ? 'bg-white dark:bg-dark-card shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Calendar size={16} /> Planificateur
                </button>
                <button
                    onClick={() => setActiveTab('library')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-white dark:bg-dark-card shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <BookOpen size={16} /> Recettes
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">

                {/* VIEW: MENU PLANNER */}
                {activeTab === 'menu' && (
                    <div className="flex flex-col gap-4">

                        {/* Week Navigation & Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-card p-4 rounded-lg border border-gray-100 dark:border-dark-border shadow-sm">

                            {/* Week Navigator */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const d = new Date(currentWeek);
                                        d.setDate(d.getDate() - 7);
                                        changeWeek(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    ←
                                </button>

                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                                        Semaine du
                                    </span>
                                    <input
                                        type="date"
                                        value={currentWeek}
                                        onChange={(e) => changeWeek(e.target.value)}
                                        className="text-sm bg-transparent border-none text-center outline-none cursor-pointer text-gray-600 dark:text-gray-400 font-mono"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const d = new Date(currentWeek);
                                        d.setDate(d.getDate() + 7);
                                        changeWeek(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    →
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors print:hidden"
                                >
                                    🖨️ Imprimer
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors border border-green-200 dark:border-green-800 print:hidden"
                                >
                                    📊 CSV
                                </button>
                                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                                <button
                                    onClick={() => setIsStructureModalOpen(true)}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 px-2 py-1 rounded transition-colors print:hidden"
                                >
                                    <Settings size={14} /> Structure
                                </button>
                            </div>
                        </div>

                        <MenuGrid structure={structure} />

                        <p className="text-xs text-gray-400 italic mt-2 print:hidden">
                            Conseil: Utilisez les boutons "+" pour ajouter des plats.
                        </p>
                    </div>
                )}

                {/* VIEW: RECIPE LIBRARY & CREATOR */}
                {activeTab === 'library' && (
                    <div className="flex flex-col gap-6">
                        {/* Create Recipe Form */}
                        <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-100 dark:border-dark-border space-y-3">
                            <h3 className="font-semibold text-sm uppercase text-gray-500">Nouvelle Recette</h3>

                            <input
                                type="text"
                                placeholder="Nom du plat (ex: Boeuf Bourguignon)"
                                value={recipeName}
                                onChange={(e) => setRecipeName(e.target.value)}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card focus:ring-2 focus:ring-blue-500 outline-none"
                            />

                            <div className="flex gap-2">
                                <select
                                    value={currentIngredientId}
                                    onChange={(e) => setCurrentIngredientId(e.target.value)}
                                    className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card"
                                >
                                    <option value="">Ajouter un ingrédient...</option>
                                    {ingredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unitPrice.toFixed(2)}€/{ing.unit})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={currentQty}
                                    onChange={(e) => setCurrentQty(Number(e.target.value))}
                                    className="w-20 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card"
                                    min="0.1"
                                    step="0.1"
                                />
                                <button
                                    onClick={handleAddIngredient}
                                    disabled={!currentIngredientId}
                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {selectedIngredients.length > 0 && (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {selectedIngredients.map((ing, idx) => (
                                        <div key={idx} className="flex justify-between text-sm bg-white dark:bg-dark-card p-2 rounded border dark:border-gray-700">
                                            <span>{ing.item.name} x {ing.qty} {ing.item.unit}</span>
                                            <span className="font-mono">{(ing.item.unitPrice * ing.qty).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold text-blue-600 border-t pt-2 mt-2">
                                        <span>Coût Total Recette:</span>
                                        <span>{recipeCost.toFixed(2)}€</span>
                                    </div>
                                    <button
                                        onClick={handleSaveRecipe}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Save size={16} /> Enregistrer la Recette
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Recipes List */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm uppercase text-gray-500">Recettes Créées ({recipes.length})</h3>
                            {recipes.length === 0 && <div className="text-gray-400 text-xs italic">Aucune recette enregistrée.</div>}

                            {recipes.map(recipe => (
                                <div key={recipe.id} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-200">{recipe.name}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {recipe.ingredients.map((ing, i) => (
                                                    <span key={i} className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                                        {ing.item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeRecipe(recipe.id)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <span className="text-sm text-gray-500">Coût unitaire</span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{recipe.totalCost.toFixed(2)}€</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <StructureModal
                isOpen={isStructureModalOpen}
                onClose={() => setIsStructureModalOpen(false)}
                structure={structure}
                onSave={(newStructure) => {
                    setStructure(newStructure);
                    setIsStructureModalOpen(false);
                }}
            />
        </div>
    );
}
