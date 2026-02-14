import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { MenuStructure } from '../../types';

interface StructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    structure: MenuStructure;
    onSave: (newStructure: MenuStructure) => void;
}

const AVAILABLE_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const AVAILABLE_COMPONENTS = ['Entrée', 'Plat protidique', 'Accompagnement', 'Produit laitier', 'Dessert', 'Goûter', 'Pain'];

export function StructureModal({ isOpen, onClose, structure, onSave }: StructureModalProps) {
    if (!isOpen) return null;

    const [localStructure, setLocalStructure] = useState<MenuStructure>(structure);

    const toggleDay = (day: string) => {
        const currentDays = localStructure.days;
        let newDays: string[];

        if (currentDays.includes(day)) {
            newDays = currentDays.filter(d => d !== day);
        } else {
            newDays = [...currentDays, day].sort((a, b) => {
                return AVAILABLE_DAYS.indexOf(a) - AVAILABLE_DAYS.indexOf(b);
            });
        }
        setLocalStructure({ ...localStructure, days: newDays });
    };

    const toggleComponent = (component: string) => {
        const currentComponents = localStructure.components;
        let newComponents: string[];

        if (currentComponents.includes(component)) {
            newComponents = currentComponents.filter(c => c !== component);
        } else {
            newComponents = [...currentComponents, component];
        }
        setLocalStructure({ ...localStructure, components: newComponents });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Modifier la structure de menu</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Days Selection */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Jours actifs</h3>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${localStructure.days.includes(day)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-dark-bg text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-border'
                                        }`}
                                >
                                    {day}
                                    {localStructure.days.includes(day) && <Check size={14} className="inline ml-1.5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Components Selection */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Composantes du repas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_COMPONENTS.map(component => (
                                <label key={component} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-dark-bg"
                                        checked={localStructure.components.includes(component)}
                                        onChange={() => toggleComponent(component)}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{component}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-dark-bg px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-dark-border">
                        Annuler
                    </button>
                    <button
                        onClick={() => onSave(localStructure)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
