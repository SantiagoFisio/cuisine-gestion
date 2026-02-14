import { useCuisine } from '../../context/CuisineContext';
import { useState } from 'react';
import { Users, Coins, TrendingUp } from 'lucide-react';
import { DEFAULT_STRUCTURE } from '../../types';

export function Analysis() {
    const { studentCount, setStudentCount, menuItems, ingredients } = useCuisine();
    const days = DEFAULT_STRUCTURE.days;
    const [analysisMode, setAnalysisMode] = useState<'MENU' | 'PURCHASES'>('MENU');

    // Calculate Costs per Day
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
    // Helper to calculate stats from a list of items (either menu components or raw ingredients)
    const calculateStats = (items: { isBio: boolean; isEgalim: boolean; cost: number }[]) => {
        const totalCost = items.reduce((sum, c) => sum + c.cost, 0);
        const bioCost = items.filter(c => c.isBio).reduce((sum, c) => sum + c.cost, 0);
        // User formula: EGALIM includes BIO + EGALIM
        // If an item is BOTH (unlikely but possible), filter logic handles it. 
        // Assuming 'isEgalim' tag is for "Egalim (Non-Bio)". If 'isEgalim' implies "Compliant" generic, we need to be careful.
        // Usually: Bio IS Egalim. So Cost(Bio) + Cost(OtherEgalim).
        const egalimOnlyCost = items.filter(c => c.isEgalim && !c.isBio).reduce((sum, c) => sum + c.cost, 0);
        const totalEgalimCost = bioCost + egalimOnlyCost;

        const bioPct = totalCost > 0 ? (bioCost / totalCost) * 100 : 0;
        const egalimPct = totalCost > 0 ? (totalEgalimCost / totalCost) * 100 : 0;
        const nonBioPct = 100 - bioPct; // User formula: Total - Bio

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
        cost: ing.price, // Total price of the scanned item
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
                            Analyse Achats
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

            {/* Daily Dashboard - Only Show in Menu Mode */}
            {analysisMode === 'MENU' ? (
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
            ) : (
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                    <p>L'analyse des achats se base sur l'ensemble du stock scanné ou saisi.</p>
                </div>
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
