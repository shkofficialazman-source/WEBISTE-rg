import { supabase } from './supabase';
import { CollectorSpotlight } from './types';

const COLLECTOR_STORAGE_KEY = 'rg_collector_spotlight_v1';

export const DEFAULT_COLLECTOR_SPOTLIGHT: CollectorSpotlight = {
  id: 'collector-featured-current',
  collectorName: 'Rohan Deshmukh (@rohan_diecast_garage)',
  instagramHandle: '@rohan_diecast_garage',
  photoUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
  storyQuote: 'Started collecting in 2018 with a 1968 Custom Camaro. Now guarding 650+ carded pieces including rare RLC Skylines and Redline Garage bespoke custom cards displayed in UV-safe acrylic frames.',
  featuredMonth: 'August 2026',
  collectionSize: '650+ Carded Castings',
  favoriteCasting: 'Nissan Skyline GT-R (BNR34) RLC & 71 Datsun 510',
  active: true,
  updatedAt: new Date().toISOString(),
};

export const getCachedCollectorSpotlight = (): CollectorSpotlight => {
  try {
    const raw = localStorage.getItem(COLLECTOR_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COLLECTOR_STORAGE_KEY, JSON.stringify(DEFAULT_COLLECTOR_SPOTLIGHT));
      return DEFAULT_COLLECTOR_SPOTLIGHT;
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.collectorName ? parsed : DEFAULT_COLLECTOR_SPOTLIGHT;
  } catch {
    return DEFAULT_COLLECTOR_SPOTLIGHT;
  }
};

export const saveCachedCollectorSpotlight = (data: CollectorSpotlight) => {
  try {
    localStorage.setItem(COLLECTOR_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache collector spotlight:', err);
  }
};

export const fetchCollectorSpotlightFromSupabase = async (): Promise<CollectorSpotlight> => {
  const cached = getCachedCollectorSpotlight();
  try {
    const { data, error } = await supabase
      .from('collector_spotlight')
      .select('*')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return cached;
    }

    const spotlight: CollectorSpotlight = {
      id: String(data.id || 'featured'),
      collectorName: data.collector_name || data.collectorName || cached.collectorName,
      instagramHandle: data.instagram_handle || data.instagramHandle || cached.instagramHandle,
      photoUrl: data.photo_url || data.photoUrl || cached.photoUrl,
      storyQuote: data.story_quote || data.storyQuote || cached.storyQuote,
      featuredMonth: data.featured_month || data.featuredMonth || cached.featuredMonth,
      collectionSize: data.collection_size || data.collectionSize || cached.collectionSize,
      favoriteCasting: data.favorite_casting || data.favoriteCasting || cached.favoriteCasting,
      active: data.active !== undefined ? Boolean(data.active) : true,
      updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
    };

    saveCachedCollectorSpotlight(spotlight);
    return spotlight;
  } catch (err) {
    console.warn('Supabase fetch collector spotlight notice:', err);
    return cached;
  }
};

export const updateCollectorSpotlightInSupabase = async (
  spotlightData: CollectorSpotlight
): Promise<CollectorSpotlight> => {
  const updatedData: CollectorSpotlight = {
    ...spotlightData,
    updatedAt: new Date().toISOString(),
  };

  saveCachedCollectorSpotlight(updatedData);

  try {
    const payload = {
      collector_name: updatedData.collectorName,
      instagram_handle: updatedData.instagramHandle || null,
      photo_url: updatedData.photoUrl,
      story_quote: updatedData.storyQuote,
      featured_month: updatedData.featuredMonth,
      collection_size: updatedData.collectionSize || null,
      favorite_casting: updatedData.favoriteCasting || null,
      active: updatedData.active,
      updated_at: updatedData.updatedAt,
    };

    // Try upserting to collector_spotlight table in Supabase
    const { data, error } = await supabase
      .from('collector_spotlight')
      .upsert([{ id: 1, ...payload }])
      .select();

    if (error) {
      console.warn('Supabase collector_spotlight table notice:', error.message);
      // Even if table does not yet exist in PostgreSQL, the resilient local cache guarantees instant persistence
    } else if (data && data[0]) {
      updatedData.id = String(data[0].id);
    }
  } catch (err: any) {
    console.warn('Supabase update collector spotlight exception:', err);
  }

  return updatedData;
};
