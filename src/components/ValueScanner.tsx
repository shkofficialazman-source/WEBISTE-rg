import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  ShieldCheck,
  Tag,
  ArrowRight,
  WifiOff,
  Image as ImageIcon,
  CheckCircle2,
  Crosshair,
  TrendingUp,
  Search,
  Sliders,
  History,
  Info,
  Car,
  ChevronRight,
  Flame,
  Award,
  Zap,
  ArrowLeft,
  X
} from 'lucide-react';

export interface ScanResultData {
  isHotWheelsOrDiecast: boolean;
  carModelName: string;
  brand?: string;
  seriesAndYear: string;
  categoryType: string;
  conditionAssessment: string;
  estimatedValueMinINR: number;
  estimatedValueMaxINR: number;
  reasoningTags?: string[];
  valueExplanation: string;
  collectorTip: string;
  confidenceLevel: string;
}

export type ScannerErrorType =
  | 'network_timeout'
  | 'quota_exceeded'
  | 'service_busy'
  | 'internal_api_error'
  | 'invalid_input'
  | 'unrecognized_car'
  | 'general';

interface ValueScannerProps {
  onNavigate?: (route: string) => void;
}

const SAMPLE_PRESETS = [
  {
    name: '1971 Datsun 510 Wagon ($TH)',
    brand: 'Hot Wheels',
    condition: 'Mint on Card (Carded)',
    category: 'Super Treasure Hunt ($TH)',
    desc: 'Spectraflame green with Real Riders 4-spoke wheels and gold flame card logo.',
  },
  {
    name: 'Nissan Skyline GT-R (BNR34) Nismo',
    brand: 'Mini GT',
    condition: 'Sealed Box / Acrylic Case',
    category: 'Mini GT Collector Grade',
    desc: 'Bayside Blue collector grade #344 with authentic decals and rubber wheels.',
  },
  {
    name: 'Porsche 911 GT3 RS',
    brand: 'Hot Wheels',
    condition: 'Mint on Card (Carded)',
    category: 'Premium / Real Riders',
    desc: 'Car Culture: Deutschland Design with metal base and full racing livery.',
  },
  {
    name: 'Volkswagen T1 Deluxe Bus',
    brand: 'Majorette',
    condition: 'Mint on Card (Carded)',
    category: 'Majorette Deluxe / Vintage',
    desc: 'Opening rear engine hatch, working suspension, and vintage collector metal box.',
  },
];

const compressImageForAI = async (
  source: string | File,
  maxDimension = 1400,
  quality = 0.88
): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement, fallbackData: string, mime = 'image/jpeg') => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: fallbackData, mimeType: mime });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: compressedDataUrl, mimeType: 'image/jpeg' });
      } catch (err) {
        console.warn('[ValueScanner] Canvas compression fallback:', err);
        resolve({ base64: fallbackData, mimeType: mime });
      }
    };

    if (typeof source === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processImage(img, source);
      img.onerror = () => resolve({ base64: source, mimeType: 'image/jpeg' });
      img.src = source;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const mime = source.type || 'image/jpeg';
      const img = new Image();
      img.onload = () => processImage(img, dataUrl, mime);
      img.onerror = () => resolve({ base64: dataUrl, mimeType: mime });
      img.src = dataUrl;
    };
    reader.onerror = () => {
      reject(new Error('Unable to read selected photo file.'));
    };
    reader.readAsDataURL(source);
  });
};

export const ValueScanner: React.FC<ValueScannerProps> = ({ onNavigate }) => {
  // Input states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [modelNameInput, setModelNameInput] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Hot Wheels');
  const [selectedCondition, setSelectedCondition] = useState<string>('Mint on Card (Carded)');
  const [notesInput, setNotesInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'photo' | 'manual'>('photo');

  // Scanner status states
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string>('Initializing Gemini Neural Appraiser...');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ScannerErrorType | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // History of session scans
  const [scanHistory, setScanHistory] = useState<Array<{ timestamp: number; result: ScanResultData; image?: string | null }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('redline_scanner_history');
      if (saved) {
        setScanHistory(JSON.parse(saved).slice(0, 6));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveToHistory = (result: ScanResultData, img?: string | null) => {
    try {
      const updated = [{ timestamp: Date.now(), result, image: img || null }, ...scanHistory.filter(h => h.result.carModelName !== result.carModelName)].slice(0, 6);
      setScanHistory(updated);
      localStorage.setItem('redline_scanner_history', JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid photo (JPG, PNG, or WEBP).');
      setErrorType('invalid_input');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Photo file size is too large (max 25MB).');
      setErrorType('invalid_input');
      return;
    }

    setErrorMessage(null);
    setErrorType(null);
    setScanResult(null);
    setCurrentFileName(file.name);

    try {
      const { base64, mimeType } = await compressImageForAI(file, 1200, 0.85);
      setSelectedImage(base64);
      triggerScan({ imageBase64: base64, mimeType, fileName: file.name });
    } catch (err: any) {
      console.error('[ValueScanner] Image compression error:', err);
      setErrorMessage('Failed to read image file. Please try selecting another photo.');
      setErrorType('invalid_input');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const triggerScan = async (params: {
    imageBase64?: string | null;
    mimeType?: string;
    fileName?: string;
    modelName?: string;
    brand?: string;
    condition?: string;
    notes?: string;
  }) => {
    setIsScanning(true);
    setErrorMessage(null);
    setErrorType(null);
    setScanResult(null);

    const img = params.imageBase64 || selectedImage;
    const model = params.modelName || modelNameInput;
    const brand = params.brand || selectedBrand;
    const condition = params.condition || selectedCondition;
    const notes = params.notes || notesInput;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const timer1 = setTimeout(() => setScanningStatus('Detecting casting lines, tampos & card series...'), 1200);
    const timer2 = setTimeout(() => setScanningStatus('Analyzing rarity tier & Indian secondary market demand...'), 2600);
    const timer3 = setTimeout(() => setScanningStatus('Computing fair collector valuation range in INR (₹)...'), 4200);

    try {
      let response: Response;
      try {
        response = await fetch('/api/gemini/scan-hotwheels', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ 
            imageBase64: img || undefined,
            mimeType: params.mimeType || 'image/jpeg',
            fileName: params.fileName || currentFileName || 'car-scan.jpg',
            modelName: model.trim() || undefined,
            brand,
            condition,
            notes,
            timestamp: Date.now(),
          }),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') throw fetchErr;
        // Fallback to /api/scan-car
        response = await fetch('/api/scan-car', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: img || undefined,
            mimeType: params.mimeType || 'image/jpeg',
            modelName: model.trim() || undefined,
            brand,
            condition,
            notes,
            timestamp: Date.now(),
          }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Valuation service encountered an issue. Please try again.');
      }

      const result: ScanResultData = data.data;
      setScanResult(result);
      saveToHistory(result, img);
    } catch (err: any) {
      console.error('[ValueScanner] Scan error:', err);
      let msg = err.message || 'Failed to value car. Please try again with clear details or a photo.';
      let type: ScannerErrorType = 'general';

      if (err.name === 'AbortError' || msg.toLowerCase().includes('timeout')) {
        type = 'network_timeout';
        msg = 'Scan request timed out. Please tap "Retry Scan".';
      }
      setErrorType(type);
      setErrorMessage(msg);
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsScanning(false);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setModelNameInput(preset.name);
    setSelectedBrand(preset.brand);
    setSelectedCondition(preset.condition);
    setNotesInput(preset.desc);
    setActiveTab('manual');
    triggerScan({
      modelName: preset.name,
      brand: preset.brand,
      condition: preset.condition,
      notes: preset.desc,
      imageBase64: null,
    });
  };

  const generateWhatsAppSellUrl = () => {
    if (!scanResult) return '#';
    const text = encodeURIComponent(
      `Hello Redline Garage Concierge! I appraised a die-cast model on your AI Value Scanner:\n\n` +
      `🚗 Model: ${scanResult.carModelName}\n` +
      `🏷️ Brand: ${scanResult.brand || selectedBrand}\n` +
      `📅 Series/Year: ${scanResult.seriesAndYear}\n` +
      `📦 Condition: ${scanResult.conditionAssessment || selectedCondition}\n` +
      `💰 AI Valuation: ₹${scanResult.estimatedValueMinINR.toLocaleString('en-IN')} - ₹${scanResult.estimatedValueMaxINR.toLocaleString('en-IN')}\n\n` +
      `I am interested in selling / consigning this piece to Redline Garage. How do we proceed?`
    );
    return `https://wa.me/8431294886?text=${text}`;
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCurrentFileName(null);
    setScanResult(null);
    setErrorMessage(null);
    setErrorType(null);
    setModelNameInput('');
    setNotesInput('');
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-dark-grid">
      {/* Background Neon Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-sky-600/10 via-red-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Value Scanner</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans uppercase">
              AI Die-Cast <span className="text-sky-400">Value Scanner</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-sans">
              Instant Indian secondary market valuation &amp; rarity analysis powered by Gemini AI. Scan your Hot Wheels, Mini GT, Majorette, and CCA models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Zap className="w-3 h-3 text-sky-400 animate-pulse" />
              <span>Gemini 3.7 Vision Engine</span>
            </span>
          </div>
        </div>

        {/* Scanner HUD Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          
          {/* Mode Switcher Tabs */}
          {!scanResult && (
            <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-950/60 p-1.5 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`py-3 px-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'photo'
                    ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Photo / Camera Scan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-3 px-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search by Model Name</span>
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8">
            
            {/* VIEW 1: Input / Form Controls */}
            {!scanResult && (
              <div className="space-y-6">
                
                {/* Mode A: Photo Upload / Live Camera */}
                {activeTab === 'photo' && !selectedImage && (
                  <div className="space-y-5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="btn-press bg-sky-500 hover:bg-sky-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-sky-500/10"
                      >
                        <Camera className="w-4 h-4 text-zinc-950" />
                        <span>Take Live Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-press bg-zinc-800 hover:bg-zinc-750 text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-xl border border-zinc-700 flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-sky-400" />
                        <span>Upload From Device</span>
                      </button>
                    </div>

                    {/* Drag & Drop Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                        isDragging
                          ? 'border-sky-500 bg-sky-950/30 shadow-inner'
                          : 'border-zinc-700 hover:border-sky-500/60 bg-zinc-950/60'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sky-400 shadow-md">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
                          Drop blister card or loose die-cast photo here
                        </div>
                        <div className="text-[11px] text-zinc-400 font-sans">
                          Clear front-view of casting, card series, or chassis markings (JPG, PNG, WEBP)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode B: Manual Description / Text Search */}
                {activeTab === 'manual' && (
                  <div className="space-y-5">
                    {/* Model Name Input */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
                        Die-Cast Model &amp; Casting Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={modelNameInput}
                          onChange={(e) => setModelNameInput(e.target.value)}
                          placeholder="e.g. 1971 Datsun 510 Wagon Super Treasure Hunt ($TH) or Nissan GT-R R34..."
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-4 py-3.5 text-sm font-sans text-white placeholder-zinc-500 outline-hidden transition-colors"
                        />
                        {modelNameInput && (
                          <button
                            type="button"
                            onClick={() => setModelNameInput('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Brand & Condition Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                      {/* Brand Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
                          Brand / Manufacturer
                        </label>
                        <select
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-sky-500 rounded-xl px-3.5 py-3 text-xs font-mono text-white outline-hidden cursor-pointer"
                        >
                          <option value="Hot Wheels">Hot Wheels (Mattel)</option>
                          <option value="Mini GT">Mini GT (TSM-Model)</option>
                          <option value="Majorette">Majorette (European)</option>
                          <option value="CCA">CCA / Custom Casting</option>
                          <option value="Inno64 / Pop Race">Inno64 / Pop Race / Kaido House</option>
                          <option value="Matchbox">Matchbox</option>
                          <option value="Other 1:64">Other 1:64 Scale Model</option>
                        </select>
                      </div>

                      {/* Condition Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
                          Model Condition
                        </label>
                        <select
                          value={selectedCondition}
                          onChange={(e) => setSelectedCondition(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-sky-500 rounded-xl px-3.5 py-3 text-xs font-mono text-white outline-hidden cursor-pointer"
                        >
                          <option value="Mint on Card (Carded)">Mint on Card (MOC / Carded Blister)</option>
                          <option value="Sealed Box / Acrylic Case">Sealed Box / Acrylic Case (Mint Boxed)</option>
                          <option value="Loose — Near Mint">Loose — Near Mint (Clean axles, no paint chips)</option>
                          <option value="Loose — Minor Playwear">Loose — Minor Wear (Slight rub/tampos wear)</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                        Specific Details / Variations (Optional)
                      </label>
                      <input
                        type="text"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="e.g. Spectraflame paint, Real Riders rubber wheels, Short card, Special chase number..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs font-sans text-white placeholder-zinc-600 outline-hidden"
                      />
                    </div>

                    {/* Submit Valuation Button */}
                    <button
                      type="button"
                      disabled={isScanning || !modelNameInput.trim()}
                      onClick={() => triggerScan({ modelName: modelNameInput, brand: selectedBrand, condition: selectedCondition, notes: notesInput })}
                      className="w-full btn-press bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
                    >
                      <Sparkles className="w-4 h-4 text-zinc-950" />
                      <span>Estimate Valuation &amp; Rarity</span>
                    </button>
                  </div>
                )}

                {/* Common / Sample Presets */}
                <div className="pt-4 border-t border-zinc-800 text-left space-y-2.5">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>Quick Valuation Demos:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-left bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="text-sky-400 font-bold">[{preset.brand}]</span>
                        <span className="truncate max-w-[180px] sm:max-w-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: Scanning Loading State / HUD */}
            {isScanning && (
              <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-2 border-sky-500/30 border-t-sky-400 border-r-red-500 animate-spin" />
                  <div className="absolute inset-3 rounded-full bg-zinc-950 flex items-center justify-center text-sky-400">
                    <Crosshair className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-sm font-bold text-white tracking-widest uppercase flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>{scanningStatus}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-sans">
                    Consulting Indian collector sales databases, Hot Wheels wikis &amp; verified die-cast transaction records...
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: Scan Results & Detailed Breakdown */}
            {scanResult && !isScanning && (
              <div className="space-y-6 animate-fade-in text-left">
                
                {/* Result Hero Header with Large Valuation */}
                <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-sky-500/30 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2.5 py-0.5 rounded">
                          {scanResult.categoryType || 'Collector 1:64 Model'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {scanResult.brand || selectedBrand}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                        {scanResult.carModelName}
                      </h2>
                      <div className="text-xs font-mono text-zinc-400">
                        {scanResult.seriesAndYear}
                      </div>
                    </div>

                    <div className="sm:text-right bg-zinc-900/80 sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-zinc-800">
                      <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                        Estimated Indian Secondary Value
                      </div>
                      <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-tight">
                        ₹{scanResult.estimatedValueMinINR.toLocaleString('en-IN')} – ₹{scanResult.estimatedValueMaxINR.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center sm:justify-end gap-1.5 text-[10px] font-mono text-zinc-400 pt-1">
                        <TrendingUp className="w-3 h-3 text-sky-400" />
                        <span>Confidence: <strong className="text-sky-400 font-bold">{scanResult.confidenceLevel}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reasoning Badges / Highlights */}
                {scanResult.reasoningTags && scanResult.reasoningTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider">Valuation Drivers:</span>
                    {scanResult.reasoningTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300"
                      >
                        <Tag className="w-3 h-3 text-sky-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Visual Viewfinder if photo was uploaded */}
                {selectedImage && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="sm:col-span-4 aspect-4/3 rounded-lg overflow-hidden bg-black flex items-center justify-center relative border border-zinc-800">
                      <img src={selectedImage} alt="Analyzed Die-Cast" className="w-full h-full object-contain" />
                      <div className="absolute bottom-1 right-1 font-mono text-[8px] bg-zinc-950/80 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">
                        DIAGNOSTIC PASSED
                      </div>
                    </div>
                    <div className="sm:col-span-8 space-y-1.5 font-mono text-xs">
                      <div className="text-zinc-500 text-[10px] uppercase font-bold">Assessed Condition</div>
                      <div className="text-zinc-200 font-sans leading-relaxed">{scanResult.conditionAssessment}</div>
                    </div>
                  </div>
                )}

                {/* Detailed Collector Analysis & Explanation */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5" />
                    <span>Appraisal Breakdown &amp; Market Context</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                    {scanResult.valueExplanation}
                  </p>
                  {scanResult.collectorTip && (
                    <div className="mt-3 pt-3 border-t border-zinc-850 flex items-start gap-2 text-xs text-amber-300 font-sans bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                      <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold font-mono uppercase text-[10px] text-amber-400 block">Collector Tip:</strong>
                        <span>{scanResult.collectorTip}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={generateWhatsAppSellUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-press bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider py-4 px-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Sell / Consign on WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleReset}
                    className="btn-press bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-mono text-xs font-bold uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Scan Another Model</span>
                  </button>
                </div>

              </div>
            )}

            {/* Error Display */}
            {errorMessage && !isScanning && (
              <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-xl space-y-3 text-left">
                <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4" />
                  <span>Scan Issue Encountered</span>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">{errorMessage}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => triggerScan({})}
                    className="btn-press bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Retry Valuation
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-press bg-zinc-800 text-zinc-300 font-mono text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Clear &amp; Try New Model
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Previous Scans / Valuation History */}
        {scanHistory.length > 0 && (
          <div className="border border-zinc-850 bg-zinc-900/50 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                <History className="w-4 h-4 text-sky-400" />
                <span>Recent Appraisals in this Session</span>
              </div>
              <button
                onClick={() => {
                  setScanHistory([]);
                  localStorage.removeItem('redline_scanner_history');
                }}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 uppercase cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scanHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setScanResult(item.result)}
                  className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-sky-500/40 rounded-xl transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-sky-400 font-bold uppercase">{item.result.brand || 'Diecast'}</span>
                    <span className="text-emerald-400 font-bold">₹{item.result.estimatedValueMinINR} - ₹{item.result.estimatedValueMaxINR}</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                    {item.result.carModelName}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                    {item.result.seriesAndYear}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
