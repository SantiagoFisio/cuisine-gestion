import { useState } from 'react';
import type { MenuStructure, MenuItem, DishComponent } from '../../types';
import { DishCompositionModal } from '../modals/DishCompositionModal';
import { useCuisine } from '../../context/CuisineContext';

interface MenuGridProps {
    structure: MenuStructure;
}

export function MenuGrid({ structure }: MenuGridProps) {
    const { menuItems, updateMenuItem, currentWeek } = useCuisine();

    // Modal State
    const [isDishModalOpen, setIsDishModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ day: string, component: string } | null>(null);

    const getKey = (day: string, component: string) => `${day}-${component}`;

    const handleCellClick = (day: string, component: string) => {
        setSelectedCell({ day, component });
        setIsDishModalOpen(true);
    };

    const handleSaveDish = (dishName: string, components: DishComponent[]) => {
        if (!selectedCell) return;
        const key = getKey(selectedCell.day, selectedCell.component);

        const prevItem = menuItems[key] || {
            id: key,
            day: selectedCell.day,
            component: selectedCell.component,
            dishName: '',
            components: [],
            headcount: ''
        };

        const newItem: MenuItem = {
            ...prevItem,
            dishName,
            components
        };

        updateMenuItem(key, newItem);
        setIsDishModalOpen(false);
    };

    // Helper for direct headcount update without opening modal
    const handleHeadcountChange = (day: string, component: string, value: string) => {
        const key = getKey(day, component);
        const prevItem = menuItems[key] || {
            id: key,
            day,
            component,
            dishName: '',
            components: [],
            headcount: ''
        };

        updateMenuItem(key, { ...prevItem, headcount: value === '' ? '' : Number(value) });
    };

    return (
        <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card shadow-sm">
            <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-gray-100 dark:bg-dark-card border-b border-gray-300 dark:border-dark-border">
                        <th className="p-3 text-left w-48 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-card sticky left-0 z-10 border-r border-gray-300 dark:border-dark-border">
                            Composantes
                        </th>
                        {structure.days.map((day, index) => {
                            // Calculate date for this column
                            // Monday is index 0
                            const currentMondayDate = new Date(currentWeek);
                            const columnDate = new Date(currentMondayDate);
                            columnDate.setDate(currentMondayDate.getDate() + index);

                            const formattedDate = columnDate.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit'
                            });

                            return (
                                <th key={day} className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-dark-border min-w-[200px]">
                                    <div className="flex flex-col items-center">
                                        <span>{day}</span>
                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{formattedDate}</span>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {structure.components.map((component, compIndex) => (
                        <tr key={component} className={compIndex % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50 dark:bg-[#2C2E33]'}>
                            {/* Row Header */}
                            <td className="p-3 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-border border-r border-gray-300 dark:border-dark-border sticky left-0 bg-inherit z-10">
                                {component}
                            </td>

                            {/* Grid Cells */}
                            {structure.days.map(day => {
                                const key = getKey(day, component);
                                const item = menuItems[key];
                                const hasDish = item && (item.dishName || (item.components && item.components.length > 0));

                                return (
                                    <td key={key} className="p-2 border-b border-gray-200 dark:border-dark-border border-r border-gray-300 dark:border-dark-border align-top h-32 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex flex-col gap-2 h-full">
                                            {/* Dish Display Area */}
                                            <div
                                                onClick={() => handleCellClick(day, component)}
                                                className={`flex-1 p-2 border rounded text-sm cursor-pointer transition-all relative group
                                                    ${hasDish
                                                        ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20'
                                                        : 'border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                                                    }`}
                                            >
                                                {hasDish ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-blue-800 dark:text-blue-300 line-clamp-2">{item.dishName}</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.components?.map((comp, i) => (
                                                                <span key={i} className="text-[10px] bg-white dark:bg-dark-card px-1 rounded border border-blue-100 dark:border-blue-900 text-gray-600 dark:text-gray-400 truncate max-w-full">
                                                                    {comp.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="mt-auto pt-1 text-right">
                                                            {item.components && item.components.length > 0 && (
                                                                <span className="text-xs font-mono text-green-600 dark:text-green-400">
                                                                    {(item.components.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0)).toFixed(2)}€
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-2xl font-light">+</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Headcount Input */}
                                            <div className={`flex items-center gap-2 justify-end ${hasDish ? '' : 'invisible'}`}>
                                                <span className="text-[10px] font-semibold text-gray-500 uppercase">Eff.</span>
                                                <input
                                                    type="number"
                                                    className="w-14 p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg rounded text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                                    placeholder="0"
                                                    value={item?.headcount || ''}
                                                    onChange={(e) => handleHeadcountChange(day, component, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Dish Composition Modal */}
            {selectedCell && (
                <DishCompositionModal
                    isOpen={isDishModalOpen}
                    onClose={() => setIsDishModalOpen(false)}
                    day={selectedCell.day}
                    componentCategory={selectedCell.component}
                    initialDishName={menuItems[getKey(selectedCell.day, selectedCell.component)]?.dishName || ''}
                    initialComponents={menuItems[getKey(selectedCell.day, selectedCell.component)]?.components || []}
                    onSave={handleSaveDish}
                />
            )}
        </div>
    );
}
