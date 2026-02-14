import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Camera, X, Plus } from 'lucide-react';
import type { Ingredient, Category } from '../../types';
import { CATEGORIES } from '../../types';
import { useCuisine } from '../../context/CuisineContext';
import { scanInvoice } from '../../services/aiScanner';

export function Scanner() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    // Manual Entry Form State
    const [quantity, setQuantity] = useState<number>(0);
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const priceHT = quantity * unitPrice;
    const priceTTC = priceHT * 1.055;

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { ingredients, addIngredients, updateIngredientCategory } = useCuisine();

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Votre navigateur ne supporte pas l'accès à la caméra.");
            return;
        }

        try {
            // First try environment camera (back camera)
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            setIsCameraOpen(true);
        } catch (err) {
            console.warn("Environment camera failed, trying user camera...", err);
            try {
                // Fallback to any available camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setCameraStream(stream);
                setIsCameraOpen(true);
            } catch (fallbackErr) {
                console.error("Error accessing camera:", fallbackErr);
                alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            }
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "captured-invoice.jpg", { type: "image/jpeg" });
                        processFile(file);
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };



    const processFile = async (_file: File) => {
        setIsProcessing(true);
        console.log("Analyzing file:", _file.name);

        try {
            const extractedItems = await scanInvoice(_file);
            if (extractedItems && extractedItems.length > 0) {
                addIngredients(extractedItems);
            } else {
                alert("Aucun ingrédient détecté ou format invalide.");
            }
        } catch (error: any) {
            console.error("Erreur scan:", error);
            if (error.message.includes("Clé API Gemini manquante")) {
                alert("Veuillez configurer votre clé API Gemini (VITE_GEMINI_API_KEY) dans le fichier .env");
            } else {
                alert("Erreur lors de l'analyse : " + error.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    useEffect(() => {
        if (isCameraOpen && videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [isCameraOpen, cameraStream]);

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Overlay */}
            {/* Manual Entry Overlay */}
            {isManualEntryOpen && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-dark-bg flex flex-col rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-dark-card">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">Saisie Manuelle</h3>
                        <button
                            onClick={() => setIsManualEntryOpen(false)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);

                                const finalPriceHT = priceHT;
                                const finalPriceTTC = priceTTC;

                                const newItem: Ingredient = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: formData.get('name') as string,
                                    category: null,
                                    quantity: quantity,
                                    unit: (formData.get('unit') as 'kg' | 'g' | 'l' | 'u') || 'kg',
                                    price: finalPriceTTC,
                                    priceHT: finalPriceHT,
                                    priceTTC: finalPriceTTC,
                                    origin: formData.get('origin') as string,
                                    isBio: formData.get('isBio') === 'on',
                                    isEgalim: formData.get('isEgalim') === 'on',
                                    unitPrice: unitPrice
                                };

                                addIngredients([newItem]);
                                setIsManualEntryOpen(false);
                                setQuantity(0);
                                setUnitPrice(0);
                            }}
                            className="flex flex-col gap-4"
                        >
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Désignation / Produit</label>
                                <input name="name" required className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm" placeholder="Ex: Pommes de terre" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="quantity"
                                        required
                                        value={quantity || ''}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Unité</label>
                                    <select name="unit" className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm">
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="l">l</option>
                                        <option value="u">u</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Prix Unitaire HT (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="unitPrice"
                                        value={unitPrice || ''}
                                        onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Total HT (€)</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={priceHT.toFixed(2)}
                                        className="w-full p-2 rounded border border-gray-300 bg-gray-100 text-gray-500 text-sm font-mono cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Total TTC (+5.5%)</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={priceTTC.toFixed(2)}
                                        className="w-full p-2 rounded border border-gray-300 bg-gray-100 text-gray-500 text-sm font-mono cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Origine</label>
                                <input name="origin" className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-sm" placeholder="Ex: France" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                                    <input type="checkbox" name="isBio" className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produit BIO 🌿</span>
                                </label>
                                <label className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                                    <input type="checkbox" name="isEgalim" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loi EGALIM ⚖️</span>
                                </label>
                            </div>

                            <button type="submit" className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                                Ajouter l'article
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {
                isCameraOpen && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center rounded-xl overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

                        <div className="absolute bottom-6 flex gap-6 items-center">
                            <button
                                onClick={stopCamera}
                                className="p-3 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <button
                                onClick={capturePhoto}
                                className="p-5 bg-white rounded-full border-4 border-gray-300 hover:border-blue-500 transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-transparent" />
                                {/* Visual capture button styling */}
                                <span className="sr-only">Prendre photo</span>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Drop Zone */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                    }
                }}
            />
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative
          ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-600 bg-gray-50 dark:bg-dark-bg'
                    }
        `}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Analyse par IA en cours...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-white dark:bg-dark-card rounded-full shadow-sm mb-3">
                            <Upload className="text-blue-500" size={24} />
                        </div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                            Cliquez pour importer ou glissez une facture
                        </p>
                        <div className="flex items-center gap-2 my-2 text-gray-400">
                            <span className="h-px bg-gray-300 dark:bg-gray-700 w-12"></span>
                            <span className="text-xs uppercase">OU</span>
                            <span className="h-px bg-gray-300 dark:bg-gray-700 w-12"></span>
                        </div>
                        <div className="flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={startCamera}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                            >
                                <Camera size={16} />
                                Prendre une photo
                            </button>
                            <button
                                onClick={() => setIsManualEntryOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm transition-colors"
                            >
                                <Plus size={16} />
                                Saisie Manuelle
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                {ingredients.length > 0 && (
                    <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-500 mb-1">
                        Articles détectés ({ingredients.length})
                    </div>
                )}

                {ingredients.map(item => (
                    <div key={item.id} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-200">{item.name}</h3>
                                <p className="text-xs text-gray-500">{item.quantity} {item.unit} • {item.price.toFixed(2)}€</p>
                            </div>
                            <div className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                {item.unitPrice.toFixed(2)}€ / {item.unit}
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="mt-1">
                            <select
                                value={item.category || ''}
                                onChange={(e) => updateIngredientCategory(item.id, e.target.value as Category)}
                                className={`w-full p-2 rounded text-sm border focus:ring-2 focus:ring-blue-500 outline-none transition-colors
                  ${item.category
                                        ? 'border-blue-200 bg-blue-50/50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                        : 'border-gray-200 bg-gray-50 text-gray-500 dark:bg-dark-bg dark:border-dark-border'
                                    }`}
                            >
                                <option value="" disabled>Choisir une catégorie...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}

                {ingredients.length === 0 && !isProcessing && (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                        Aucun article scanné
                    </div>
                )}
            </div>
        </div>
    );
}
