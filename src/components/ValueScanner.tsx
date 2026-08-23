import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, AlertCircle, RefreshCw, CheckCircle2, MessageCircle, HelpCircle, ShieldCheck, Tag, Info, ArrowRight, Flame, WifiOff, Clock, Server, AlertTriangle, Cpu } from 'lucide-react';

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
 * Resizes and compresses image on client side using HTML5 Canvas to max 1024px, JPEG quality 0.82
 * Prevents network drops, timeouts, and multi-megabyte payloads.
 */
const compressImageForAI = async (source: string | File, maxDimension = 1024, quality = 0.82): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const onImageLoaded = () => {
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
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(source);
    }
  });
};

interface SampleHotWheels {
  name: string;
  subtitle: string;
  image: string;
  badge?: string;
  resultData: ScanResultData;
}

const SAMPLE_HOTWHEELS: SampleHotWheels[] = [
  {
    name: '2024 Aston Martin Vantage GT3',
    subtitle: 'Exoticars 9/10 • 125/250',
    image: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?q=80&w=800&auto=format&fit=crop',
    badge: 'Exoticars',
    resultData: {
      isHotWheelsOrDiecast: true,
      carModelName: '2024 Aston Martin Vantage GT3',
      seriesAndYear: '2026 Hot Wheels Mainline #125 / Exoticars 9/10',
      categoryType: 'Mainline / Exoticars GT3 Race Spec',
      conditionAssessment: 'Mint on Card (MOC) - Sealed Blister',
      estimatedValueMinINR: 179,
      estimatedValueMaxINR: 499,
      valueExplanation: 'Brand-new 2024 Aston Martin Vantage GT3 casting in crisp white livery with lime green race aero striping and aggressive rear GT wing. Highly sought after by endurance & GT3 motorsport collectors.',
      collectorTip: 'Keep blister card uncreased. As a fresh debut casting in the Exoticars series, pristine cards command a solid premium among sports car enthusiasts.',
      confidenceLevel: '99% Confident (Verified Casting Match)',
    },
  },
  {
    name: "'70 Custom Plymouth Road Runner",
    subtitle: 'Fast & Furious • Screen Time 7/10',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=800&auto=format&fit=crop',
    badge: 'Fast & Furious',
    resultData: {
      isHotWheelsOrDiecast: true,
      carModelName: "'70 Custom Plymouth Road Runner",
      seriesAndYear: '2026 HW Screen Time 7/10 (#221/250)',
      categoryType: 'HW Screen Time / Fast & Furious Licensed',
      conditionAssessment: 'Mint on Card (MOC) - Factory Sealed',
      estimatedValueMinINR: 299,
      estimatedValueMaxINR: 799,
      valueExplanation: 'Dominic Toretto inspired 1970 Plymouth Road Runner in iconic Metalflake Hemi Orange with satin black hood scoop and deep dish chrome 5-spokes.',
      collectorTip: 'Fast & Furious movie licensed castings command quick liquidity and strong secondary collector demand across India.',
      confidenceLevel: '99% Confident (Screen Time Licensed)',
    },
  },
  {
    name: "'98 Honda Prelude",
    subtitle: 'Factory Fresh 5/5 • 138/250',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    badge: 'Factory Fresh',
    resultData: {
      isHotWheelsOrDiecast: true,
      carModelName: "'98 Honda Prelude",
      seriesAndYear: '2026 Hot Wheels Factory Fresh 5/5 (#138/250)',
      categoryType: 'Mainline / Factory Fresh JDM',
      conditionAssessment: 'Mint on Card (MOC) - Ryu Asada Tribute',
      estimatedValueMinINR: 249,
      estimatedValueMaxINR: 650,
      valueExplanation: '5th Gen BB5 Honda Prelude in metallic emerald teal. Designed by legendary master designer Ryu Asada, featuring detailed headlights, glass moonroof, and silver 5-spoke wheels.',
      collectorTip: 'JDM Factory Fresh models have exceptionally high collector velocity; consider placing in a blister clamshell protector.',
      confidenceLevel: '98% Confident (JDM Mainline Verified)',
    },
  },
];

export const ValueScanner: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string>('Analyzing... this may take a moment');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ScannerErrorType | null>(null);
  const [rawDiagnosticError, setRawDiagnosticError] = useState<string | null>(null);
  const [showDiagnosticTrace, setShowDiagnosticTrace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.warn('[ValueScanner] Invalid file uploaded:', { fileName: file.name, type: file.type });
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      setErrorType('invalid_input');
      return;
    }

    setErrorMessage(null);
    setErrorType(null);
    setScanResult(null);

    try {
      setScanningStatus('Optimizing image for AI valuation...');
      setIsScanning(true);
      const compressedBase64 = await compressImageForAI(file, 1024, 0.82);
      setSelectedImage(compressedBase64);
      triggerScan(compressedBase64);
    } catch (err) {
      console.warn('[ValueScanner] Compression notice, falling back to direct upload:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        triggerScan(base64);
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

  const handleSelectSample = async (sample: typeof SAMPLE_HOTWHEELS[0]) => {
    setSelectedImage(sample.image);
    setErrorMessage(null);
    setErrorType(null);
    setScanResult(null);
    setIsScanning(true);
    setScanningStatus('Identifying casting details & series tampos...');

    try {
      const compressed = await compressImageForAI(sample.image, 1024, 0.82);
      await triggerScan(compressed, sample.resultData);
    } catch {
      setTimeout(() => {
        setScanResult(sample.resultData);
        setIsScanning(false);
      }, 1200);
    }
  };

  const triggerScan = async (imageBase64: string, fallbackSampleData?: ScanResultData) => {
    setIsScanning(true);
    setErrorMessage(null);
    setErrorType(null);
    setRawDiagnosticError(null);
    setShowDiagnosticTrace(false);
    setScanningStatus('Analyzing... this may take a moment');

    console.log('[ValueScanner Client Request]:', {
      timestamp: new Date().toISOString(),
      payloadLength: imageBase64.length,
      isBase64DataUrl: imageBase64.startsWith('data:image/'),
      targetEndpoint: '/api/gemini/scan-hotwheels',
    });

    // Dynamic friendly status updates if server takes a moment
    const statusTimer1 = setTimeout(() => {
      setScanningStatus('Reading casting tampos & wheel specifications...');
    }, 2500);

    const statusTimer2 = setTimeout(() => {
      setScanningStatus('Cross-referencing Indian collector marketplace pricing...');
    }, 5500);

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
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Extract raw response text first for full diagnostic transparency
      let data: any = null;
      let rawText = '';
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error('[ValueScanner Non-JSON Raw API Response Received]:', {
          httpStatus: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          rawTextSnippet: rawText.slice(0, 300),
          jsonErr,
          timestamp: new Date().toISOString(),
        });
      }

      // CRITICAL REQUIREMENT: Log full response object and error status to console BEFORE any UI messages
      console.log('[ValueScanner Gemini API Full Response Object]:', {
        httpStatus: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        parsedPayload: data,
        rawTextLength: rawText.length,
        timestamp: new Date().toISOString(),
      });

      // Handle non-200 or failure payloads with granular error classification
      if (!response.ok || !data?.success) {
        let resolvedErrorType: ScannerErrorType = 'general';
        let resolvedErrorMessage = '';

        if (response.status === 504 || data?.errorType === 'network_timeout') {
          resolvedErrorType = 'network_timeout';
          resolvedErrorMessage = 'The scan request timed out while communicating with the valuation server. Please tap "Retry Scan Now".';
        } else if (response.status === 429 || data?.errorType === 'quota_exceeded') {
          resolvedErrorType = 'quota_exceeded';
          resolvedErrorMessage = 'Scanner is temporarily at capacity (Gemini API quota limit reached). Shared quota across the AI Pit Crew Chatbot, Card Stylizer, and Scanner has reached rate limit.';
        } else if (response.status === 503 || response.status === 502 || data?.errorType === 'service_busy') {
          resolvedErrorType = 'service_busy';
          resolvedErrorMessage = 'Gemini AI vision services are currently experiencing high traffic. Please tap "Retry Scan Now" in a few seconds.';
        } else if (response.status === 400 || data?.errorType === 'invalid_input') {
          resolvedErrorType = 'invalid_input';
          resolvedErrorMessage = data?.error || 'Uploaded image could not be processed. Please try another photo.';
        } else if (response.status === 500 || data?.errorType === 'internal_api_error') {
          resolvedErrorType = 'internal_api_error';
          resolvedErrorMessage = data?.error || 'Internal AI engine error occurred while appraising this car.';
        } else {
          resolvedErrorType = data?.errorType || 'general';
          resolvedErrorMessage = data?.error || `API returned status ${response.status} (${response.statusText || 'Error'}).`;
        }

        // Log full error details to console BEFORE UI state update
        console.error('[ValueScanner Gemini API Error Status & Object]:', {
          httpStatus: response.status,
          statusText: response.statusText,
          errorType: resolvedErrorType,
          errorMessage: resolvedErrorMessage,
          rawError: data?.rawError || rawText,
          isApiKeyConfigured: data?.isApiKeyConfigured,
          apiKeySource: data?.apiKeySource,
          elapsedMs: data?.elapsedMs,
          timestamp: new Date().toISOString(),
        });

        if (fallbackSampleData) {
          setScanResult(fallbackSampleData);
          setErrorMessage(null);
          return;
        }

        setErrorType(resolvedErrorType);
        setRawDiagnosticError(
          data?.rawError
            ? `[HTTP ${response.status}] ${data.rawError}`
            : `HTTP ${response.status} ${response.statusText}: ${rawText.slice(0, 180)}`
        );
        throw new Error(resolvedErrorMessage);
      }

      // Success
      console.log('[ValueScanner Gemini API Scan Succeeded]:', {
        modelUsed: data.modelUsed,
        isAiLive: data.isAiLive,
        isApiKeyConfigured: data.isApiKeyConfigured,
        apiKeySource: data.apiKeySource,
        elapsedMs: data.elapsedMs,
        carIdentified: data.data?.carModelName,
        timestamp: new Date().toISOString(),
      });

      setScanResult(data.data);
    } catch (err: any) {
      console.error('[ValueScanner Client Caught Scan Exception]:', {
        errorName: err.name,
        message: err.message,
        isAbort: err.name === 'AbortError',
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });

      if (fallbackSampleData) {
        setScanResult(fallbackSampleData);
        setErrorMessage(null);
        return;
      }

      let msg = err.message || 'Failed to scan image. Please try again with a brighter, centered photo.';
      let type: ScannerErrorType = 'general';

      if (err.name === 'AbortError' || msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout')) {
        type = 'network_timeout';
        msg = 'Scan request timed out. Please tap "Retry Scan Now" to retry.';
      } else if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('capacity')) {
        type = 'quota_exceeded';
      } else if (msg.toLowerCase().includes('busy') || msg.toLowerCase().includes('503') || msg.toLowerCase().includes('high traffic') || msg.toLowerCase().includes('demand')) {
        type = 'service_busy';
      } else if (msg.toLowerCase().includes('internal') || msg.toLowerCase().includes('500') || msg.toLowerCase().includes('engine error')) {
        type = 'internal_api_error';
      } else if (msg.toLowerCase().includes('identify') || msg.toLowerCase().includes('recognize') || msg.toLowerCase().includes('blurry')) {
        type = 'unrecognized_car';
      }

      setErrorType(type);
      setErrorMessage(msg);
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="scanner" className="py-20 bg-zinc-950 text-white relative overflow-hidden border-t border-b border-red-900/30">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Title & Eyebrow */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Die-Cast Valuation Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-white">
            Scan Your <span className="text-red-500">Hot Wheels</span> Car
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            Snap or upload a photo of any Hot Wheels scale model (carded blister pack or loose). Our server-side Gemini intelligence will identify the exact casting, series release, condition, and estimated secondary market collector value in Indian Rupees (INR).
          </p>
        </div>

        {/* Main Scanner Container */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          {!selectedImage ? (
            /* Upload Screen */
            <div className="space-y-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Drag & Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="border-2 border-dashed border-zinc-700 hover:border-red-500 bg-zinc-950/60 hover:bg-zinc-950/90 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white font-sans uppercase">
                    Take Photo or Click to Upload Car
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Supports JPG, PNG, WEBP • Works on blister packs or loose die-cast cars
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase px-6 py-3 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File</span>
                </button>
              </div>

              {/* Sample test cars */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Or Try Instant Demo Cars:
                  </span>
                  <span className="text-[11px] text-red-400 font-mono">Click any sample below</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SAMPLE_HOTWHEELS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample)}
                      className="bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/60 p-3 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer group min-h-[44px] relative overflow-hidden"
                    >
                      <img
                        src={sample.image}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg border border-zinc-700 group-hover:border-red-500 transition-colors shrink-0"
                      />
                      <div className="overflow-hidden flex-1 min-w-0">
                        {sample.badge && (
                          <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/40 px-1.5 py-0.2 rounded-sm mb-0.5">
                            {sample.badge}
                          </span>
                        )}
                        <div className="text-xs font-bold text-white truncate font-sans">{sample.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">{sample.subtitle}</div>
                      </div>
                    </button>
                  ))}
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
                      Examining car casting silhouettes, card graphics, tampo liveries, and secondary market valuations.
                    </p>
                  </div>
                </div>
              ) : errorMessage ? (
                /* Granular Differentiated Error State */
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
                          <div className="text-zinc-500 pt-1 border-t border-zinc-900">
                            Hostinger Production Notice: If deploying on Hostinger, ensure <span className="text-zinc-300 font-bold">GEMINI_API_KEY</span> is set in Hostinger hPanel → Node.js App → Environment Variables, or via a root <span className="text-zinc-300 font-bold">.env</span> file.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {errorType === 'quota_exceeded' && (
                    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-left text-xs font-mono text-amber-300/90 space-y-1">
                      <div className="font-bold text-[11px] uppercase flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Shared Gemini API Quota Notice:</span>
                      </div>
                      <div className="text-[11px] text-amber-200/80">
                        The AI Chatbot, Blister Card Stylizer, and Value Scanner share requests per minute (RPM). Please pause for a few seconds before retrying.
                      </div>
                    </div>
                  )}

                  {errorType === 'unrecognized_car' && (
                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-left text-xs font-mono text-zinc-400 space-y-1">
                      <div className="text-zinc-200 font-bold text-[11px] uppercase">📸 Pro Scanning Tips:</div>
                      <div>• Place car flat on a solid, well-lit surface</div>
                      <div>• Frame the full blister card or side profile of the vehicle</div>
                      <div>• Avoid heavy glare or shadows over the wheels & tampo art</div>
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
                      Try Another Photo
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
                      Scan Another Photo
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
                        <span>Scan Another Car</span>
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
                            <span>Estimate generated by AI based on general market trends. Actual resale value may vary.</span>
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
