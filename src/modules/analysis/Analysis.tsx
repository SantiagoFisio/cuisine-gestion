import { useCuisine } from '../../context/CuisineContext';
import { useState } from 'react';
import { Users, Coins, TrendingUp, Package } from 'lucide-react';
import { DEFAULT_STRUCTURE } from '../../types';

export function Analysis() {
    const { studentCount, setStudentCount, menuItems, ingredients } = useCuisine();
    const days = DEFAULT_STRUCTURE.days;
    const [analysisMode, setAnalysisMode] = useState<'MENU' | 'PURCHASES'>('MENU');

    // --- STOCK & INVENTORY CALCULATIONS ---
    const calculateInventory = () => {
        // A. Total Inputs (Achats / Scans)
        const stockInputs: Record<string, { qty: number, cost: number, unit: string }> = {};

        ingredients.forEach(ing => {
            const name = ing.name.toLowerCase();
            if (!stockInputs[name]) {
                stockInputs[name] = { qty: 0, cost: 0, unit: ing.unit };
            }
            stockInputs[name].qty += ing.quantity;
            stockInputs[name].cost += ing.price;
        });

        // B. Total Outputs (Consommation via Menus)
        // Currently limited to specific implementation logic, keeping it simple for now as per user request
        // to just show "Stock" cells.

        return { stockInputs };
    };

    const { stockInputs } = calculateInventory();

    // --- DAILY MENU ANALYSIS ---
    const dailyAnalysis = days.map(day => {
        const dayItems = Object.values(menuItems).filter(item => item.day === day);

        const totalDayCost = dayItems.reduce((acc, item) => {
            if (!item.components) return acc;
            return acc + item.components.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
        }, 0);

        const costPerStudent = studentCount > 0 ? (totalDayCost / studentCount) : 0;

        return { day, totalCost: totalDayCost, costPerStudent };
    });

    // --- BIO & EGALIM Calculation ---
    const calculateStats = (items: { isBio: boolean; isEgalim: boolean; cost: number }[]) => {
        const totalCost = items.reduce((sum, c) => sum + c.cost, 0);
        const bioCost = items.filter(c => c.isBio).reduce((sum, c) => sum + c.cost, 0);
        const egalimOnlyCost = items.filter(c => c.isEgalim && !c.isBio).reduce((sum, c) => sum + c.cost, 0);
        const totalEgalimCost = bioCost + egalimOnlyCost;

        const bioPct = totalCost > 0 ? (bioCost / totalCost) * 100 : 0;
        const egalimPct = totalCost > 0 ? (totalEgalimCost / totalCost) * 100 : 0;
        const nonBioPct = 100 - bioPct;

        return { totalCost, bioPct, egalimPct, nonBioPct };
    };

    // 1. Menu Mode Data
    const menuComponents = Object.values(menuItems).flatMap(item => item.components || []).map(comp => {
        const ingredient = ingredients.find(i => i.id === comp.ingredientId);
        return {
            cost: comp.quantity * comp.unitCost,
            isBio: ingredient?.isBio || false,
            isEgalim: ingredient?.isEgalim || false
        };
    });
    const menuStats = calculateStats(menuComponents);

    // 2. Purchases Mode Data
    const purchaseComponents = ingredients.map(ing => ({
        cost: ing.price,
        isBio: ing.isBio || false,
        isEgalim: ing.isEgalim || false
    }));
    const purchaseStats = calculateStats(purchaseComponents);

    // Active Stats based on Selection
    const activeStats = analysisMode === 'MENU' ? menuStats : purchaseStats;

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">

            {/* Header / Global Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">

                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setAnalysisMode('MENU')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === 'MENU' ? 'bg-white dark:bg-dark-card shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            Analyse Menu
                        </button>
                        <button
                            onClick={() => setAnalysisMode('PURCHASES')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === 'PURCHASES' ? 'bg-white dark:bg-dark-card shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            Achats/Stock
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-900">
                            <Users className="text-blue-500" size={20} />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Élèves / Jour</span>
                                <input
                                    type="number"
                                    value={studentCount}
                                    onChange={(e) => setStudentCount(Number(e.target.value))}
                                    className="bg-transparent font-bold text-lg text-gray-900 dark:text-white outline-none w-20"
                                />
                            </div>
                        </div>

                        <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase">Coût Total ({analysisMode === 'MENU' ? 'Menu' : 'Achats'})</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{activeStats.totalCost.toFixed(2)}€</span>
                        </div>
                    </div>
                </div>

                {/* BIO & EGALIM Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* BIO Stat */}
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-4 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-700 dark:text-green-400">BIO 🌿</span>
                            <span className="text-xl font-bold text-green-800 dark:text-green-300">{activeStats.bioPct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-green-200 dark:bg-green-800/30 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${activeStats.bioPct}%` }} />
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500">Objectif: 20% (Loi EGALIM)</p>
                    </div>

                    {/* EGALIM Stat */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-700 dark:text-blue-400">EGALIM ⚖️</span>
                            <span className="text-xl font-bold text-blue-800 dark:text-blue-300">{activeStats.egalimPct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-blue-200 dark:bg-blue-800/30 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${activeStats.egalimPct}%` }} />
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-500">Objectif: 50% (Total)</p>
                    </div>

                    {/* Non-BIO Stat */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-600 dark:text-gray-400">Non BIO</span>
                            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{activeStats.nonBioPct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400" style={{ width: `${activeStats.nonBioPct}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW STOCK VIEW */}
            {analysisMode === 'PURCHASES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Global Stock Value (La "Caisse") */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm flex flex-col items-center justify-center gap-2">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full mb-2">
                            <Coins size={32} />
                        </div>
                        <h3 className="text-gray-500 text-sm uppercase font-semibold">Valeur Totale du Stock</h3>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {activeStats.totalCost.toFixed(2)}€
                        </span>
                        <span className="text-xs text-gray-400">Somme de tous les scans/entrées</span>
                    </div>

                    {/* 2. Stock Inventory Table */}
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Package size={18} className="text-gray-500" />
                                État du Stock (Ingrédients)
                            </h3>
                        </div>
                        <div className="overflow-y-auto max-h-[300px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2">Ingrédient</th>
                                        <th className="px-4 py-2 text-right">Qté Totale</th>
                                        <th className="px-4 py-2 text-right">Valeur</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {Object.entries(stockInputs).map(([name, data]) => (
                                        <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-2 font-medium capitalize">{name}</td>
                                            <td className="px-4 py-2 text-right">
                                                {data.qty.toFixed(2)} <span className="text-xs text-gray-400">{data.unit}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono">
                                                {data.cost.toFixed(2)}€
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Dashboard - Only Show in Menu Mode */}
            {analysisMode === 'MENU' && (
                <>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mt-2">
                        <TrendingUp size={20} className="text-green-500" />
                        Analyse Hebdomadaire
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {dailyAnalysis.map((data) => (
                            <div key={data.day} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                {/* Day Header */}
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">{data.day}</h3>
                                </div>

                                {/* Cost Per Student (Main Metric) */}
                                <div className="flex flex-col items-center py-2">
                                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                        {data.costPerStudent.toFixed(2)}€
                                    </span>
                                    <span className="text-xs text-gray-400 uppercase font-medium">/ Élève</span>
                                </div>

                                {/* Total Cost Logic */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Total Menu</span>
                                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{data.totalCost.toFixed(2)}€</span>
                                </div>

                                {/* Visual Indicator of Cost */}
                                <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                                    <div
                                        className={`h-full ${data.costPerStudent > 2.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min((data.costPerStudent / 3) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Hint */}
            <div className="mt-auto bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                <Coins size={20} className="flex-shrink-0" />
                <p>
                    Le coût par élève est calculé en divisant le coût total des ingrédients utilisés dans le menu du jour par le nombre d'élèves ({studentCount}).
                </p>
            </div>
        </div>
    );
}
