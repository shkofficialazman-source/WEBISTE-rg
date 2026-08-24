import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Tag,
  Info,
  ArrowRight,
  Flame,
  WifiOff,
  Clock,
  Server,
  AlertTriangle,
  Cpu,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface ScanResultData {
  isHotWheelsOrDiecast: boolean;
  carModelName: string;
  seriesAndYear: string;
  categoryType: string;
  conditionAssessment: string;
  estimatedValueMinINR: number;
  estimatedValueMaxINR: number;
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

/**
 * Resizes and optimizes user-uploaded photos on the client side using HTML5 Canvas.
 * Caps maximum dimension at 1200px and encodes as 85% JPEG to prevent payload bloat,
 * ensuring fast transmission to the Gemini API while preserving fine tampo & wheel details.
 */
const compressImageForAI = async (
  source: string | File,
  maxDimension = 1200,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement, fallbackData: string) => {
      try {
        let { width, height } = img;
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
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackData);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('[ValueScanner] Canvas compression issue, falling back to original data:', err);
        resolve(fallbackData);
      }
    };

    if (typeof source === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processImage(img, source);
      img.onerror = () => resolve(source);
      img.src = source;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => processImage(img, dataUrl);
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => {
      reject(new Error('Unable to read selected photo file.'));
    };
    reader.readAsDataURL(source);
  });
};

export const ValueScanner: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string>('Uploading photo to AI valuation engine...');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ScannerErrorType | null>(null);
  const [rawDiagnosticError, setRawDiagnosticError] = useState<string | null>(null);
  const [showDiagnosticTrace, setShowDiagnosticTrace] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    // Basic file validation
    if (!file.type.startsWith('image/')) {
      console.warn('[ValueScanner] Invalid file uploaded:', { fileName: file.name, type: file.type });
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WEBP).');
      setErrorType('invalid_input');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('The photo file size is too large (max 25MB). Please choose a smaller photo.');
      setErrorType('invalid_input');
      return;
    }

    setErrorMessage(null);
    setErrorType(null);
    setScanResult(null);

    try {
      setScanningStatus('Optimizing photo resolution for AI appraisal...');
      setIsScanning(true);
      const optimizedBase64 = await compressImageForAI(file, 1200, 0.85);
      setSelectedImage(optimizedBase64);
      triggerScan(optimizedBase64);
    } catch (err: any) {
      console.warn('[ValueScanner] Optimization warning, falling back to direct reader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        triggerScan(base64);
      };
      reader.onerror = () => {
        setIsScanning(false);
        setErrorMessage('Failed to read image file. Please try selecting the photo again.');
        setErrorType('invalid_input');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const triggerScan = async (imageBase64: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    setErrorType(null);
    setRawDiagnosticError(null);
    setShowDiagnosticTrace(false);
    setScanningStatus('Connecting to Gemini AI Valuation Service...');

    console.log('[ValueScanner Real Photo Scan Request Initiated]:', {
      timestamp: new Date().toISOString(),
      payloadLength: imageBase64.length,
      isDataUrl: imageBase64.startsWith('data:image/'),
      targetEndpoint: '/api/gemini/scan-hotwheels',
    });

    // Dynamic progressive status updates for user engagement
    const timer1 = setTimeout(() => {
      setScanningStatus('Examining casting silhouette, rooflines & blister card...');
    }, 1800);

    const timer2 = setTimeout(() => {
      setScanningStatus('Detecting tampo liveries, wheel specifications & series badges...');
    }, 4200);

    const timer3 = setTimeout(() => {
      setScanningStatus('Checking Indian secondary collector market valuation ranges...');
    }, 7500);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/gemini/scan-hotwheels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read raw response text for diagnostic transparency
      let data: any = null;
      let rawText = '';
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error('[ValueScanner Non-JSON Raw API Response]:', {
          httpStatus: response.status,
          statusText: response.statusText,
          rawSnippet: rawText.slice(0, 300),
          jsonErr,
        });
      }

      console.log('[ValueScanner Gemini API Response]:', {
        httpStatus: response.status,
        statusText: response.statusText,
        ok: response.ok,
        parsedPayload: data,
        timestamp: new Date().toISOString(),
      });

      // Handle non-200 or failure payloads
      if (!response.ok || !data?.success) {
        let resolvedErrorType: ScannerErrorType = 'general';
        let resolvedErrorMessage = '';

        if (response.status === 504 || data?.errorType === 'network_timeout') {
          resolvedErrorType = 'network_timeout';
          resolvedErrorMessage = 'The scan request timed out while communicating with the valuation server. Please tap "Retry Scan Now".';
        } else if (response.status === 429 || data?.errorType === 'quota_exceeded') {
          resolvedErrorType = 'quota_exceeded';
          resolvedErrorMessage = 'Gemini API quota limit reached. Please wait a moment and tap "Retry Scan Now".';
        } else if (response.status === 503 || response.status === 502 || data?.errorType === 'service_busy') {
          resolvedErrorType = 'service_busy';
          resolvedErrorMessage = 'Gemini AI vision services are currently experiencing high traffic. Please retry in a few moments.';
        } else if (response.status === 400 || data?.errorType === 'invalid_input') {
          resolvedErrorType = 'invalid_input';
          resolvedErrorMessage = data?.error || 'Uploaded photo could not be processed. Please try another clear photo.';
        } else if (response.status === 500 || data?.errorType === 'internal_api_error') {
          resolvedErrorType = 'internal_api_error';
          resolvedErrorMessage = data?.error || 'Internal AI engine error occurred while appraising this car.';
        } else {
          resolvedErrorType = data?.errorType || 'general';
          resolvedErrorMessage = data?.error || `API returned status ${response.status} (${response.statusText || 'Error'}).`;
        }

        console.error('[ValueScanner Scan Error]:', {
          httpStatus: response.status,
          errorType: resolvedErrorType,
          errorMessage: resolvedErrorMessage,
          rawError: data?.rawError || rawText,
        });

        setErrorType(resolvedErrorType);
        setRawDiagnosticError(
          data?.rawError
            ? `[HTTP ${response.status}] ${data.rawError}`
            : `HTTP ${response.status} ${response.statusText}: ${rawText.slice(0, 180)}`
        );
        throw new Error(resolvedErrorMessage);
      }

      // Success payload
      console.log('[ValueScanner Photo Appraisal Completed]:', {
        modelUsed: data.modelUsed,
        carIdentified: data.data?.carModelName,
        category: data.data?.categoryType,
        estimatedINR: `₹${data.data?.estimatedValueMinINR} - ₹${data.data?.estimatedValueMaxINR}`,
        elapsedMs: data.elapsedMs,
      });

      setScanResult(data.data);
    } catch (err: any) {
      console.error('[ValueScanner Scan Exception]:', {
        errorName: err.name,
        message: err.message,
        isAbort: err.name === 'AbortError',
      });

      let msg = err.message || 'Failed to scan image. Please try again with a brighter, well-lit photo.';
      let type: ScannerErrorType = 'general';

      if (err.name === 'AbortError' || msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout')) {
        type = 'network_timeout';
        msg = 'Scan request timed out. Please tap "Retry Scan Now".';
      } else if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('capacity')) {
        type = 'quota_exceeded';
      } else if (msg.toLowerCase().includes('busy') || msg.toLowerCase().includes('503') || msg.toLowerCase().includes('traffic')) {
        type = 'service_busy';
      } else if (msg.toLowerCase().includes('internal') || msg.toLowerCase().includes('500')) {
        type = 'internal_api_error';
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

  const handleRetryCurrentPhoto = () => {
    if (selectedImage) {
      triggerScan(selectedImage);
    }
  };

  const generateWhatsAppSellUrl = () => {
    if (!scanResult) return '#';
    const text = encodeURIComponent(
      `Hello Redline Garage! 🚗💨\nI scanned a Hot Wheels car with your AI Value Scanner and would like to inquire about selling / consigning it:\n\n` +
      `• *Car Model:* ${scanResult.carModelName}\n` +
      `• *Series / Year:* ${scanResult.seriesAndYear}\n` +
      `• *Type:* ${scanResult.categoryType}\n` +
      `• *Estimated Value:* ₹${scanResult.estimatedValueMinINR} - ₹${scanResult.estimatedValueMaxINR}\n` +
      `• *Condition Notes:* ${scanResult.conditionAssessment}\n\n` +
      `Could you let me know if Redline Garage is interested in purchasing this casting?`
    );
    return `https://wa.me/8431294886?text=${text}`;
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    setErrorType(null);
    setRawDiagnosticError(null);
    setShowDiagnosticTrace(false);
    setIsScanning(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <section id="scanner" className="py-20 bg-zinc-950 text-white relative overflow-hidden border-t border-b border-red-900/30">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Die-Cast Valuation Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-white">
            Scan Your <span className="text-red-500">Hot Wheels</span> Car
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            Upload or take a photo of your carded blister pack or loose die-cast car. Our Gemini AI engine will inspect the casting, series, tampo details, and estimate fair market collector value in Indian Rupees (₹).
          </p>
        </div>

        {/* Scanner Body Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          {!selectedImage ? (
            /* Upload Screen (Enforces Real Photo Upload) */
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Hidden File & Camera Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
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

              {/* Top Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold uppercase px-6 py-4 rounded-2xl shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[56px] group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Take Live Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-sm font-bold uppercase px-6 py-4 rounded-2xl border border-zinc-700 hover:border-zinc-500 transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[56px] group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Upload className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Choose from Gallery</span>
                </button>
              </div>

              {/* Drag & Drop Target Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-3.5 ${
                  isDragging
                    ? 'border-red-500 bg-red-950/30 scale-[1.01]'
                    : 'border-zinc-700 hover:border-red-500/80 bg-zinc-950/70 hover:bg-zinc-950/90'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isDragging
                    ? 'bg-red-600 text-white scale-110'
                    : 'bg-zinc-800/80 border border-zinc-700 text-zinc-400 group-hover:text-red-400 group-hover:border-red-500/40'
                }`}>
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-bold text-white font-sans uppercase tracking-tight">
                    {isDragging ? 'Drop Your Photo Here to Scan' : 'Or Drag & Drop Die-Cast Photo Here'}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Supports JPG, PNG, WEBP • Works on sealed blister cards or loose cars
                  </p>
                </div>
              </div>

              {/* Scanning Best Practices Tip Box */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400" />
                  <span>How to get the most accurate appraisal:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono text-zinc-400">
                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5">
                    <span className="text-zinc-200 font-semibold block mb-0.5">1. Bright Lighting</span>
                    Ensure good lighting on the blister card or car paint finish.
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5">
                    <span className="text-zinc-200 font-semibold block mb-0.5">2. Visible Tampos & Card</span>
                    Keep car logos, collector numbers, or card art in clear view.
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5">
                    <span className="text-zinc-200 font-semibold block mb-0.5">3. Avoid Heavy Glare</span>
                    Angle your camera slightly to minimize plastic blister reflections.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Scanning & Result Screen */
            <div className="space-y-8">
              {isScanning ? (
                /* Scanning Loading State with Live Status */
                <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-red-500 shadow-2xl bg-zinc-950">
                    <img
                      src={selectedImage}
                      alt="Scanning Target"
                      className="w-full h-full object-cover filter brightness-75"
                    />
                    {/* Animated Laser Scanner Bar */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-bounce"></div>
                    <div className="absolute inset-0 bg-red-600/10 pointer-events-none"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-red-500 font-mono text-sm font-bold uppercase tracking-wider">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{scanningStatus}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono max-w-sm">
                      Examining casting silhouette, packaging card tampos, wheel variations, and collector market pricing.
                    </p>
                  </div>
                </div>
              ) : errorMessage ? (
                /* Error Recovery State */
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto shadow-xl">
                  <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                    errorType === 'network_timeout'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : errorType === 'quota_exceeded'
                      ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                      : errorType === 'service_busy'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : errorType === 'internal_api_error'
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {errorType === 'network_timeout' ? (
                      <WifiOff className="w-7 h-7" />
                    ) : errorType === 'quota_exceeded' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : errorType === 'service_busy' ? (
                      <Clock className="w-7 h-7" />
                    ) : errorType === 'internal_api_error' ? (
                      <Server className="w-7 h-7" />
                    ) : (
                      <AlertCircle className="w-7 h-7" />
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white uppercase font-sans tracking-tight">
                      {errorType === 'network_timeout'
                        ? 'Network Request Timed Out'
                        : errorType === 'quota_exceeded'
                        ? 'Gemini API Quota Limit Reached'
                        : errorType === 'service_busy'
                        ? 'AI Vision Servers In High Demand'
                        : errorType === 'internal_api_error'
                        ? 'Internal AI Engine Error'
                        : errorType === 'invalid_input'
                        ? 'Invalid Image Format'
                        : errorType === 'unrecognized_car'
                        ? 'Hot Wheels Model Unclear'
                        : 'Scan Inconclusive'}
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>

                  {/* Technical Diagnostic Trace Inspector */}
                  {rawDiagnosticError && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDiagnosticTrace(!showDiagnosticTrace)}
                        className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 underline transition cursor-pointer"
                      >
                        {showDiagnosticTrace ? 'Hide Technical Diagnostic Trace' : 'View Technical Diagnostic Trace'}
                      </button>
                      {showDiagnosticTrace && (
                        <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-left font-mono text-[10px] text-zinc-400 max-h-32 overflow-y-auto space-y-1.5 break-words">
                          <div className="text-red-400 font-bold uppercase flex items-center justify-between">
                            <span>Diagnostic Trace Log:</span>
                            <span className="text-[9px] text-zinc-500">{errorType?.toUpperCase()}</span>
                          </div>
                          <div className="text-zinc-300">{rawDiagnosticError}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {errorType === 'quota_exceeded' && (
                    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-left text-xs font-mono text-amber-300/90 space-y-1">
                      <div className="font-bold text-[11px] uppercase flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Shared Gemini API Notice:</span>
                      </div>
                      <div className="text-[11px] text-amber-200/80">
                        Please pause for a few seconds before retrying the appraisal scan.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {(errorType === 'service_busy' || errorType === 'quota_exceeded' || errorType === 'network_timeout' || errorType === 'internal_api_error') && (
                      <button
                        onClick={handleRetryCurrentPhoto}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl transition cursor-pointer min-h-[44px] flex items-center gap-2 shadow-lg shadow-amber-600/20"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry Scan Now</span>
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold uppercase px-5 py-3 rounded-xl transition cursor-pointer min-h-[44px] border border-zinc-700"
                    >
                      Choose Another Photo
                    </button>
                  </div>
                </div>
              ) : scanResult && !scanResult.isHotWheelsOrDiecast ? (
                /* Unrecognized / Non-Diecast Guidance Screen */
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 max-w-lg mx-auto shadow-xl animate-fade-in">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <HelpCircle className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase font-sans tracking-tight">
                      Die-Cast Vehicle Not Detected
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                      {scanResult.valueExplanation || 'Our AI vision model could not clearly identify a Hot Wheels or die-cast car in this image.'}
                    </p>
                  </div>

                  {/* Photo tips box */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 text-left text-xs font-mono text-zinc-400 space-y-2">
                    <div className="text-zinc-200 font-bold text-xs uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-400" />
                      <span>Tips for an accurate appraisal:</span>
                    </div>
                    <ul className="space-y-1 pl-1 text-[11px] text-zinc-400">
                      <li>• Take a bright, well-lit photo of your Hot Wheels blister card or loose car.</li>
                      <li>• Keep the car or packaging centered and in sharp focus.</li>
                      <li>• Avoid heavy flash glare or reflective plastic reflections over the tampos.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl transition cursor-pointer min-h-[44px] shadow-lg shadow-red-600/20"
                    >
                      Take / Upload New Photo
                    </button>
                  </div>
                </div>
              ) : scanResult ? (
                /* Successful Results Card */
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Scanned Photo Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="aspect-4/3 rounded-2xl overflow-hidden border-2 border-zinc-700 bg-zinc-950 relative shadow-xl">
                        <img
                          src={selectedImage}
                          alt="Scanned Car"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow-md">
                          {scanResult.categoryType}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-zinc-300 font-mono text-[10px] px-2 py-0.5 rounded border border-white/20">
                          Confidence: {scanResult.confidenceLevel}
                        </div>
                      </div>

                      <button
                        onClick={handleReset}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold uppercase py-2.5 rounded-xl transition border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Scan Another Car Photo</span>
                      </button>
                    </div>

                    {/* Right: Detailed Appraisal Breakdown */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Car Identification */}
                      <div className="space-y-1 pb-4 border-b border-zinc-800">
                        <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                          {scanResult.seriesAndYear}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight font-sans">
                          {scanResult.carModelName}
                        </h3>
                      </div>

                      {/* Valuation Box */}
                      <div className="bg-gradient-to-r from-red-950/60 to-zinc-900 border border-red-500/40 rounded-2xl p-5 shadow-lg space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase">
                          <span>Estimated Secondary Market Value:</span>
                          <span className="text-red-400 font-bold">INR (₹)</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
                          <span className="text-red-500">₹{scanResult.estimatedValueMinINR.toLocaleString('en-IN')}</span>
                          <span className="text-zinc-500 text-2xl font-light">–</span>
                          <span className="text-white">₹{scanResult.estimatedValueMaxINR.toLocaleString('en-IN')}</span>
                        </div>

                        {/* AI Valuation Disclaimer */}
                        <div className="pt-2 border-t border-red-900/40">
                          <div className="flex items-start gap-1.5 text-[11px] text-zinc-400 font-mono">
                            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                            <span>Estimate generated by AI based on collector market trends. Actual resale value may vary based on buyer and condition.</span>
                          </div>
                        </div>
                      </div>

                      {/* Observations & Condition */}
                      <div className="space-y-3">
                        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-1.5">
                          <div className="text-xs font-mono text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Condition Assessment</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-light">
                            {scanResult.conditionAssessment}
                          </p>
                        </div>

                        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-1.5">
                          <div className="text-xs font-mono text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-blue-400" />
                            <span>Collector Valuation Rationale</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-light">
                            {scanResult.valueExplanation}
                          </p>
                        </div>

                        {scanResult.collectorTip && (
                          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 space-y-1.5">
                            <div className="text-xs font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-amber-400" />
                              <span>Pro Collector Fact</span>
                            </div>
                            <p className="text-xs text-amber-200 leading-relaxed font-light">
                              {scanResult.collectorTip}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Sell to Redline WhatsApp CTA */}
                      <div className="pt-3">
                        <a
                          href={generateWhatsAppSellUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 min-h-[44px]"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Sell this to Redline Garage (WhatsApp Inquire)</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
