import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCuisine } from '../../context/CuisineContext';
import type { DishComponent } from '../../types';

interface DishCompositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dishName: string, components: DishComponent[]) => void;
    initialDishName: string;
    initialComponents: DishComponent[];
    day: string;
    componentCategory: string; // e.g., "Entrée"
}

export function DishCompositionModal({
    isOpen,
    onClose,
    onSave,
    initialDishName,
    initialComponents,
    day,
    componentCategory
}: DishCompositionModalProps) {
    if (!isOpen) return null;

    const { ingredients } = useCuisine();
    const [dishName, setDishName] = useState(initialDishName);
    const [components, setComponents] = useState<DishComponent[]>(initialComponents || []);

    // Component Form State
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [quantity, setQuantity] = useState<number>(0);

    // Reset when opening modal with new initial data
    useEffect(() => {
        setDishName(initialDishName);
        setComponents(initialComponents || []);
    }, [initialDishName, initialComponents, isOpen]);

    const handleAddComponent = () => {
        if (components.length >= 5) {
            alert("Maximum 5 composants par plat.");
            return;
        }

        const ingredient = ingredients.find(i => i.id === selectedIngredientId);
        if (!ingredient || quantity <= 0) return;

        const newComponent: DishComponent = {
            ingredientId: ingredient.id,
            name: ingredient.name,
            quantity: quantity,
            unitCost: ingredient.unitPrice
        };

        setComponents([...components, newComponent]);
        setSelectedIngredientId('');
        setQuantity(0);
    };

    const removeComponent = (index: number) => {
        const newComponents = [...components];
        newComponents.splice(index, 1);
        setComponents(newComponents);
    };

    const totalCost = components.reduce((sum, comp) => sum + (comp.quantity * comp.unitCost), 0);
    const isValid = dishName.trim() !== '' && components.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-dark-border flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Composition du Plat</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{day} - {componentCategory}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">

                    {/* Dish Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du Plat</label>
                        <input
                            type="text"
                            value={dishName}
                            onChange={(e) => setDishName(e.target.value)}
                            placeholder="ex: Salade de Carottes"
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Add Component Section */}
                    <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase flex justify-between">
                            Ajouter un composant
                            <span className={`text-xs ${components.length >= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                {components.length}/5 utilisés
                            </span>
                        </h3>

                        <div className="flex flex-col gap-3">
                            <select
                                value={selectedIngredientId}
                                onChange={(e) => setSelectedIngredientId(e.target.value)}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm"
                                disabled={components.length >= 5}
                            >
                                <option value="">Choisir un ingrédient scanné...</option>
                                {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.name} ({ing.unitPrice.toFixed(2)}€ / {ing.unit})
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={quantity || ''}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        placeholder="Qté"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm"
                                        min="0" step="0.01"
                                        disabled={components.length >= 5}
                                    />
                                    <span className="text-xs text-gray-500">
                                        {ingredients.find(i => i.id === selectedIngredientId)?.unit || 'unité'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddComponent}
                                    disabled={!selectedIngredientId || quantity <= 0 || components.length >= 5}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Components List */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Composants du plat</h3>
                        {components.length === 0 ? (
                            <div className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-dark-bg/50 rounded border border-dashed border-gray-300 dark:border-dark-border">
                                Aucun composant ajouté.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {components.map((comp, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{comp.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {comp.quantity} unité(s) × {comp.unitCost.toFixed(2)}€
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-medium text-sm text-blue-600 dark:text-blue-400">
                                                {(comp.quantity * comp.unitCost).toFixed(2)}€
                                            </span>
                                            <button
                                                onClick={() => removeComponent(idx)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Total Cost */}
                        {components.length > 0 && (
                            <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Coût Portion :</span>
                                <span className="font-bold text-xl text-green-600 dark:text-green-400">{totalCost.toFixed(2)}€</span>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-dark-bg px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-dark-border">
                        Annuler
                    </button>
                    <button
                        onClick={() => onSave(dishName, components)}
                        disabled={!isValid}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Valider le Plat
                    </button>
                </div>
            </div>
        </div>
    );
}
