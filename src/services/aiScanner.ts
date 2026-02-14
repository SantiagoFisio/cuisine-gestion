
import type { Ingredient } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export async function scanInvoice(file: File): Promise<Ingredient[]> {
    if (!API_KEY) {
        console.warn("Missing VITE_GEMINI_API_KEY. Using mock data.");
        // Fallback or error
        throw new Error("Clé API Gemini manquante. Veuillez configurer VITE_GEMINI_API_KEY dans le fichier .env");
    }

    // Convert file to Base64
    const base64Image = await fileToGenerativePart(file);

    const prompt = `
        Analyse cette image de facture ou de liste d'inventaire alimentaire.
        Extrais chaque ingrédient ou produit alimentaire trouvé sous forme d'une liste JSON stricte.
        
        Pour chaque élément, retourne un objet avec les propriétés suivantes :
        - name: Nom du produit (string)
        - quantity: Quantité numérique (number). Si vide, mets 1.
        - unit: Unité parmi 'kg', 'g', 'l', 'u' (string). Convertis si nécessaire (ex: 'ml' -> 'l', 'pièce' -> 'u').
        - price: Prix TOTAL TTC de la ligne (number).
        - unitPrice: Prix unitaire HT si disponible, sinon calcule-le (number).
        - origin: Origine du produit si indiquée (ex: France, Espagne), sinon vide (string).
        - isBio: true si le produit est indiqué BIO ou Agriculture Biologique, sinon false (boolean).
        - isEgalim: true si le produit respecte la loi EGALIM (Label Rouge, AOP/AOC, HVE, Pêche Durable, ou Bio), sinon false (boolean).
        
        IMPORTANT:
        - Retourne UNIQUEMENT le JSON brut, sans balises markdown (\`\`\`json).
        - Le JSON doit être un tableau d'objets : [{...}, {...}]
    `;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: file.type, data: base64Image } }
            ]
        }]
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Erreur API Gemini: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("Réponse vide de l'IA.");
        }

        // Clean markdown code blocks if present
        const cleanedText = textResponse.replace(/^```json/g, '').replace(/^```/g, '').trim();

        const items = JSON.parse(cleanedText);

        // Post-process items to ensure they match Ingredient interface
        return items.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: item.name || "Produit inconnu",
            category: null, // User will categorize
            quantity: Number(item.quantity) || 1,
            unit: ['kg', 'g', 'l', 'u'].includes(item.unit) ? item.unit : 'u',
            price: Number(item.price) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            origin: item.origin || "",
            priceHT: Number(item.unitPrice) * (Number(item.quantity) || 1), // Approx
            priceTTC: Number(item.price) || 0,
            isBio: !!item.isBio,
            isEgalim: !!item.isEgalim
        }));

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
}

function fileToGenerativePart(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
