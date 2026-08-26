import React, { useState, useEffect } from 'react';
import { CollectorSpotlight } from '../../types';
import {
  getCachedCollectorSpotlight,
  fetchCollectorSpotlightFromSupabase,
  updateCollectorSpotlightInSupabase,
  DEFAULT_COLLECTOR_SPOTLIGHT,
} from '../../collectorSpotlight';
import { uploadImageToSupabase, supabase } from '../../supabase';
import { uploadProductImageToStorage } from '../../firebase';
import {
  Award,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Instagram,
  Eye,
  Sparkles,
  Calendar,
  Layers,
  Car,
  Crop,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Database,
} from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { convertUrlToFile } from '../../utils/imageCropUtils';

const COLLECTOR_SPOTLIGHT_SQL = `-- CREATE collector_spotlight TABLE & RLS POLICIES
CREATE TABLE IF NOT EXISTS public.collector_spotlight (
    id BIGINT PRIMARY KEY DEFAULT 1,
    collector_name TEXT NOT NULL,
    instagram_handle TEXT,
    photo_url TEXT NOT NULL,
    story_quote TEXT NOT NULL,
    featured_month TEXT NOT NULL DEFAULT 'Current Month',
    collection_size TEXT DEFAULT '500+ Castings',
    favorite_casting TEXT DEFAULT 'Nissan Skyline GT-R (BNR34) RLC',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.collector_spotlight ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public insert collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public update collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public delete collector_spotlight" ON public.collector_spotlight;

CREATE POLICY "Allow public select collector_spotlight" ON public.collector_spotlight FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert collector_spotlight" ON public.collector_spotlight FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update collector_spotlight" ON public.collector_spotlight FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete collector_spotlight" ON public.collector_spotlight FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.collector_spotlight (
    id, collector_name, instagram_handle, photo_url, story_quote, featured_month, collection_size, favorite_casting, active
) VALUES (
    1,
    'Rohan Deshmukh (@rohan_diecast_garage)',
    '@rohan_diecast_garage',
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
    'Started collecting in 2018 with a 1968 Custom Camaro. Now guarding 650+ carded pieces including rare RLC Skylines and Redline Garage bespoke custom cards displayed in UV-safe acrylic frames.',
    'August 2026',
    '650+ Carded Castings',
    'Nissan Skyline GT-R (BNR34) RLC & 71 Datsun 510',
    true
) ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_spotlight;`;

export const CollectorSpotlightTab: React.FC = () => {
  const [spotlight, setSpotlight] = useState<CollectorSpotlight>(getCachedCollectorSpotlight);
  const [formData, setFormData] = useState<CollectorSpotlight>(getCachedCollectorSpotlight);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingReCrop, setIsPreparingReCrop] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Cropper modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    // Check if table exists in Supabase
    supabase.from('collector_spotlight').select('id').limit(1).then(({ error }) => {
      if (isMounted) {
        if (error && (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache'))) {
          setTableExists(false);
        } else {
          setTableExists(true);
        }
      }
    });

    fetchCollectorSpotlightFromSupabase().then((data) => {
      if (isMounted) {
        setSpotlight(data);
        setFormData(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyMigrationSql = () => {
    navigator.clipboard.writeText(COLLECTOR_SPOTLIGHT_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 4000);
  };


  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ text: 'Please choose a valid image file (JPG, PNG, WEBP).', type: 'error' });
      return;
    }

    setPendingCropFiles([file]);
    setCropModalOpen(true);
    const fileInput = document.getElementById('collectorPhotoInput') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleReCropPhoto = async () => {
    const currentUrl = formData.photoUrl || DEFAULT_COLLECTOR_SPOTLIGHT.photoUrl;
    if (!currentUrl) return;

    try {
      setIsPreparingReCrop(true);
      const file = await convertUrlToFile(currentUrl, 'collector_spotlight.jpg');
      setPendingCropFiles([file]);
      setCropModalOpen(true);
    } catch (err: any) {
      console.error('Failed to prepare collector photo for re-cropping:', err);
      setStatusMessage({
        text: 'Could not load photo for re-cropping. Please upload a fresh photo.',
        type: 'error',
      });
    } finally {
      setIsPreparingReCrop(false);
    }
  };

  const handleCropComplete = async (croppedFiles: File[]) => {
    if (croppedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);

      const file = croppedFiles[0];
      let downloadUrl = '';
      try {
        downloadUrl = await uploadImageToSupabase(file, 'products');
      } catch (err) {
        console.warn('Supabase storage upload notice:', err);
      }

      if (!downloadUrl) {
        downloadUrl = await uploadProductImageToStorage(file);
      }

      if (downloadUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: downloadUrl }));
        setStatusMessage({ text: 'Collector photo cropped and uploaded successfully!', type: 'success' });
      } else {
        setStatusMessage({ text: 'Failed to upload photo to storage. Check network.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatusMessage({ text: 'Failed to upload photo: ' + (err?.message || 'Check connection'), type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.collectorName.trim()) {
      setStatusMessage({ text: 'Collector name is required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const saved = await updateCollectorSpotlightInSupabase(formData);
      setSpotlight(saved);
      setFormData(saved);
      setStatusMessage({ text: 'Collector of the Month updated successfully and live on homepage!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update spotlight:', err);
      setStatusMessage({ text: 'Error saving spotlight: ' + (err?.message || 'Database error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xs border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-red-600" />
            <span>Community Spotlight Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase font-mono tracking-tight text-white">
            Collector of the Month
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Feature an outstanding Indian die-cast collector, their showcase garage, and their collector story on the storefront.
          </p>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-mono text-zinc-300 flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-red-500" />
          <span>Active Period: <strong>{formData.featuredMonth || 'Current Month'}</strong></span>
        </div>
      </div>

      {/* Supabase Schema Status & Setup Banner */}
      {tableExists === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs font-mono space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supabase Database Notice: `collector_spotlight` Table Pending Creation</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMigrationSql}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Migration'}</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open SQL Editor</span>
              </a>
            </div>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            The application is currently preserving your edits in local storage cache. To enable real-time PostgreSQL synchronization across all devices and browsers, copy the migration SQL and execute it in your Supabase SQL Editor.
          </p>
        </div>
      )}

      {tableExists === true && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold">Supabase PostgreSQL Connected: `public.collector_spotlight` Active</span>
          </div>
          <span className="text-[10px] text-emerald-600 hidden sm:inline">Row Level Security Enabled</span>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Form Editor & Live Storefront Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Editor (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-base font-black uppercase font-mono text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Edit Spotlight Details</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Collector Name & Featured Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Collector Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.collectorName}
                  onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
                  placeholder="e.g. Rohan Deshmukh"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Featured Month / Edition <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.featuredMonth}
                  onChange={(e) => setFormData({ ...formData, featuredMonth: e.target.value })}
                  placeholder="e.g. August 2026"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Instagram Handle & Collection Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Instagram Handle
                </label>
                <div className="relative">
                  <Instagram className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.instagramHandle || ''}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    placeholder="@rohan_diecast_garage"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Collection Size
                </label>
                <input
                  type="text"
                  value={formData.collectionSize || ''}
                  onChange={(e) => setFormData({ ...formData, collectionSize: e.target.value })}
                  placeholder="e.g. 650+ Carded Castings"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Favorite Casting */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                Favorite Casting / Holy Grail
              </label>
              <input
                type="text"
                value={formData.favoriteCasting || ''}
                onChange={(e) => setFormData({ ...formData, favoriteCasting: e.target.value })}
                placeholder="e.g. Nissan Skyline GT-R (BNR34) RLC & 71 Datsun 510"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
              />
            </div>

            {/* Photo Upload & URL */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="block text-[10px] uppercase font-bold text-zinc-600">
                Collector / Garage Photo
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  id="collectorPhotoInput"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => document.getElementById('collectorPhotoInput')?.click()}
                    disabled={isUploading || isPreparingReCrop}
                    className="flex-1 sm:flex-initial bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold font-mono inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 border border-zinc-200"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-red-600" />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReCropPhoto}
                    disabled={isUploading || isPreparingReCrop || !formData.photoUrl}
                    title="Crop or adjust framing of current photo"
                    className="bg-zinc-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-zinc-700 px-3 py-2.5 rounded-xl text-xs font-bold font-mono inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 border border-zinc-200"
                  >
                    {isPreparingReCrop ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <Crop className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>Crop</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="Or paste external photo URL..."
                  className="w-full sm:flex-1 bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Story / Quote */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                Collector Story / Quote <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.storyQuote}
                onChange={(e) => setFormData({ ...formData, storyQuote: e.target.value })}
                placeholder="Describe how they started collecting, favorite memories, or display advice..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl p-3 text-xs focus:outline-hidden font-sans leading-relaxed"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
              <span className="text-xs font-bold text-zinc-800">
                Display Spotlight on Homepage ({formData.active ? 'Active / Visible' : 'Hidden'})
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer font-mono uppercase text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Spotlight</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Storefront Card Preview (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-700 uppercase flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-red-600" />
              <span>Live Storefront Preview</span>
            </span>
            <span className="text-[10px] text-zinc-400">White/Black/Red Theme</span>
          </div>

          {/* Preview Card */}
          <div className="bg-white border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-xl font-sans">
            {/* Header Ribbon */}
            <div className="bg-zinc-900 text-white px-5 py-3 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-red-500" />
                <span className="font-black uppercase tracking-wider text-white">Collector of the Month</span>
              </div>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                {formData.featuredMonth || 'Featured'}
              </span>
            </div>

            {/* Photo */}
            <div className="aspect-video w-full relative bg-zinc-100 overflow-hidden border-b border-zinc-200 group">
              <img
                src={formData.photoUrl || DEFAULT_COLLECTOR_SPOTLIGHT.photoUrl}
                alt={formData.collectorName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Quick Crop Button on preview */}
              <button
                type="button"
                onClick={handleReCropPhoto}
                disabled={isPreparingReCrop || isUploading}
                title="Crop / Re-frame Photo"
                className="absolute top-2 right-2 bg-black/70 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition opacity-90 group-hover:opacity-100 shadow-md cursor-pointer"
              >
                <Crop className="w-3 h-3 text-amber-300" />
                <span>Crop Photo</span>
              </button>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="font-black text-lg sm:text-xl font-mono leading-tight">
                  {formData.collectorName || 'Collector Name'}
                </div>
                {formData.instagramHandle && (
                  <div className="text-xs text-red-400 font-mono flex items-center gap-1 mt-0.5">
                    <Instagram className="w-3 h-3" />
                    <span>{formData.instagramHandle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Collection</span>
                  <span className="font-bold text-zinc-900">{formData.collectionSize || '500+ Castings'}</span>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Holy Grail</span>
                  <span className="font-bold text-zinc-900 truncate block">{formData.favoriteCasting || 'Nissan Skyline R34'}</span>
                </div>
              </div>

              {/* Quote */}
              <div className="bg-zinc-50 border-l-4 border-red-600 p-3 rounded-r-xl font-sans text-xs text-zinc-700 italic leading-relaxed">
                "{formData.storyQuote || 'Collector story will be showcased here...'}"
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Universal Image Cropper Modal for Collector Photo */}
      <ImageCropperModal
        isOpen={cropModalOpen}
        files={pendingCropFiles}
        defaultAspectRatio="4:3"
        title="Crop Collector Spotlight Photo"
        subtitle="Frame your collector portrait or diecast garage showcase (4:3 / 16:9 recommended)."
        onClose={() => {
          setCropModalOpen(false);
          setPendingCropFiles([]);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
