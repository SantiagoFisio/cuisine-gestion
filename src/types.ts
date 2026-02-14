export type Category = 'ENTREE' | 'PLAT' | 'ACCOMPAGNEMENT' | 'SAUCE' | 'DESSERT' | 'AUTRE';

export const CATEGORIES: Category[] = ['ENTREE', 'PLAT', 'ACCOMPAGNEMENT', 'SAUCE', 'DESSERT', 'AUTRE'];

export interface Ingredient {
    id: string;
    name: string;
    category: Category | null;
    quantity: number;
    unit: 'kg' | 'g' | 'l' | 'u';
    price: number;
    unitPrice: number;
    origin?: string;
    priceHT?: number;
    priceTTC?: number;
    isBio?: boolean;
    isEgalim?: boolean;
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: { item: Ingredient; qty: number }[];
    totalCost: number;
}

export interface MenuStructure {
    id: string;
    name: string;
    days: string[];
    components: string[];
}

export interface DishComponent {
    ingredientId: string;
    name: string;
    quantity: number;
    unitCost: number;
}

export interface MenuItem {
    id: string;
    day: string;
    component: string;
    dishName: string; // Keep for display/summary
    components: DishComponent[]; // Max 5 items
    headcount: number | '';
}

export const DEFAULT_STRUCTURE: MenuStructure = {
    id: 'struct-1',
    name: 'Scolaire Classique',
    days: ['Lundi', 'Mardi', 'Jeudi', 'Vendredi'],
    components: ['Entrée', 'Plat protidique', 'Accompagnement', 'Produit laitier', 'Dessert']
};
