import { useState } from 'react';
import { Scanner } from './modules/scanner/Scanner';
import { Recipes } from './modules/recipes/Recipes';
import { Analysis } from './modules/analysis/Analysis';
import { Package, ChefHat, BarChart3, Moon, Sun } from 'lucide-react';

import { CuisineProvider } from './context/CuisineContext';

function App() {
  console.log("App.tsx: Rendering...");
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'recipes' | 'analysis'>('scanner');

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <CuisineProvider>
      <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-300 font-sans`}>
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center bg-white dark:bg-dark-card sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight leading-none">CuisineGestion<span className="text-blue-500">Analyseur</span></h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">by</span>
                <img src="/logo.png" alt="Brigade Digitale" className="h-4 w-auto object-contain" />
              </div>
            </div>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-gray-600 dark:text-gray-400"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Tab Navigation & Content */}
        <main className="p-6 h-[calc(100vh-80px)] flex flex-col gap-4">

          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-dark-card rounded-lg w-fit border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'scanner' ? 'bg-white dark:bg-dark-bg shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <Package size={18} /> Scanner
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'recipes' ? 'bg-white dark:bg-dark-bg shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <ChefHat size={18} /> Recettes / Menu
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-white dark:bg-dark-bg shadow text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <BarChart3 size={18} /> Analyse
            </button>
          </div>

          {/* Module Content */}
          <div className="flex-1 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden p-6 relative">
            {activeTab === 'scanner' && <Scanner />}
            {activeTab === 'recipes' && <Recipes />}
            {activeTab === 'analysis' && <Analysis />}
          </div>

        </main>
      </div>
    </CuisineProvider>
  );
}

export default App;
