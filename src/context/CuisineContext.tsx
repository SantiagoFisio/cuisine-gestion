import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ingredient, Recipe, Category, MenuItem } from '../types';

interface CuisineContextType {
    ingredients: Ingredient[];
    addIngredients: (newIngredients: Ingredient[]) => void;
    updateIngredientCategory: (id: string, category: Category) => void;

    recipes: Recipe[];
    addRecipe: (recipe: Recipe) => void;
    removeRecipe: (id: string) => void;

    studentCount: number;
    setStudentCount: (count: number) => void;

    // Menu Management
    currentWeek: string; // ISO Date of the Monday
    changeWeek: (date: string) => void;
    menuItems: Record<string, MenuItem>; // Items for the CURRENT week
    updateMenuItem: (key: string, item: MenuItem) => void;

    // Local Memory for auto-categorization
    itemMemory: Record<string, Category>;
    saveToMemory: (name: string, category: Category) => void;
}

const CuisineContext = createContext<CuisineContextType | undefined>(undefined);

// Helper to get Monday of the current week
const getMonday = (d: Date) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

export function CuisineProvider({ children }: { children: React.ReactNode }) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [studentCount, setStudentCount] = useState<number>(100);
    const [itemMemory, setItemMemory] = useState<Record<string, Category>>({});

    // WEEKLY MENU STATE
    const [currentWeek, setCurrentWeek] = useState<string>(getMonday(new Date()));
    // Storage: { "2023-10-23": { "Lundi-Entrée": { ... } } }
    const [weeklyMenus, setWeeklyMenus] = useState<Record<string, Record<string, MenuItem>>>({});

    // Load persistence
    useEffect(() => {
        const savedMemory = localStorage.getItem('cuisine_memory');
        const savedRecipes = localStorage.getItem('cuisine_recipes');
        const savedWeeklyMenus = localStorage.getItem('cuisine_weekly_menus');
        const oldFlatMenu = localStorage.getItem('cuisine_menu_items'); // Legacy support

        if (savedMemory) setItemMemory(JSON.parse(savedMemory));
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));

        if (savedWeeklyMenus) {
            setWeeklyMenus(JSON.parse(savedWeeklyMenus));
        } else if (oldFlatMenu) {
            // MIGRATION: Move old flat menu to current week
            const currentMonday = getMonday(new Date());
            setWeeklyMenus({ [currentMonday]: JSON.parse(oldFlatMenu) });
        }
    }, []);

    // Save recipes on change
    useEffect(() => {
        localStorage.setItem('cuisine_recipes', JSON.stringify(recipes));
    }, [recipes]);

    // Save weekly menus on change
    useEffect(() => {
        if (Object.keys(weeklyMenus).length > 0) {
            localStorage.setItem('cuisine_weekly_menus', JSON.stringify(weeklyMenus));
        }
    }, [weeklyMenus]);

    const saveToMemory = (name: string, category: Category) => {
        const newMemory = { ...itemMemory, [name.toLowerCase()]: category };
        setItemMemory(newMemory);
        localStorage.setItem('cuisine_memory', JSON.stringify(newMemory));
    };

    const addIngredients = (newIngredients: Ingredient[]) => {
        // Auto-categorize based on memory
        const processed = newIngredients.map(item => ({
            ...item,
            category: item.category || itemMemory[item.name.toLowerCase()] || null
        }));
        setIngredients(prev => [...prev, ...processed]);
    };

    const updateIngredientCategory = (id: string, category: Category) => {
        setIngredients(prev => prev.map(item => {
            if (item.id === id) {
                saveToMemory(item.name, category);
                return { ...item, category };
            }
            return item;
        }));
    };

    const addRecipe = (recipe: Recipe) => {
        setRecipes(prev => [...prev, recipe]);
    };

    const removeRecipe = (id: string) => {
        setRecipes(prev => prev.filter(r => r.id !== id));
    };

    // Update Menu Item for CURRENT WEEK
    const updateMenuItem = (key: string, item: MenuItem) => {
        setWeeklyMenus(prev => ({
            ...prev,
            [currentWeek]: {
                ...(prev[currentWeek] || {}),
                [key]: item
            }
        }));
    };

    const changeWeek = (date: string) => {
        setCurrentWeek(date);
    };

    return (
        <CuisineContext.Provider value={{
            ingredients,
            addIngredients,
            updateIngredientCategory,
            recipes,
            addRecipe,
            removeRecipe,
            studentCount,
            setStudentCount,
            currentWeek,
            changeWeek,
            menuItems: weeklyMenus[currentWeek] || {}, // Expose only current week
            updateMenuItem,
            itemMemory,
            saveToMemory
        }}>
            {children}
        </CuisineContext.Provider>
    );
}

export function useCuisine() {
    const context = useContext(CuisineContext);
    if (context === undefined) {
        throw new Error('useCuisine must be used within a CuisineProvider');
    }
    return context;
}
