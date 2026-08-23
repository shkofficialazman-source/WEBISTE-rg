import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { FirestoreOrder } from './types';

// Workspace Google Scopes requested
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Initialize app with applet config for OAuth client
const appletApp = getApps().length === 0 ? initializeApp(firebaseAppletConfig) : getApp();
const workspaceAuth = getAuth(appletApp);

// Memory cache for Google OAuth token
let cachedWorkspaceAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  autoSyncOnCheckout: boolean;
  lastSyncedAt?: string;
}

const STORAGE_KEY_CONFIG = 'rg_google_sheets_config';

export const getSavedSheetConfig = (): GoogleSheetConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveSheetConfig = (config: GoogleSheetConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save Google Sheets config:', err);
  }
};

export const clearSheetConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  } catch (err) {
    console.warn('Failed to clear Google Sheets config:', err);
  }
};

/**
 * Initialize auth listener to keep track of user and token state in memory
 */
export const initWorkspaceAuth = (
  onSuccess?: (user: User, token: string | null) => void,
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(workspaceAuth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (onSuccess) onSuccess(user, cachedWorkspaceAccessToken);
    } else {
      cachedWorkspaceAccessToken = null;
      cachedGoogleUser = null;
      if (onSignedOut) onSignedOut();
    }
  });
};

/**
 * Trigger popup sign in with Google to grant Google Sheets & Drive access
 */
export const signInWithGoogleForSheets = async (): Promise<{ user: User; accessToken: string }> => {
  const provider = new GoogleAuthProvider();
  for (const scope of WORKSPACE_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });

  try {
    const result = await signInWithPopup(workspaceAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('No access token returned from Google Auth. Please check permissions.');
    }

    cachedWorkspaceAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;

    return { user: result.user, accessToken: cachedWorkspaceAccessToken };
  } catch (error: any) {
    console.error('Google Sheets sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out and clear cached token
 */
export const disconnectGoogleSheetsAuth = async (): Promise<void> => {
  try {
    await signOut(workspaceAuth);
  } catch (err) {
    console.warn('Google sign out error:', err);
  }
  cachedWorkspaceAccessToken = null;
  cachedGoogleUser = null;
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedWorkspaceAccessToken;
};

export const getCachedGoogleUser = (): User | null => {
  return cachedGoogleUser;
};

/**
 * Create a new Google Spreadsheet specifically tailored for Redline Garage orders
 */
export const createOrdersSpreadsheet = async (
  title: string = 'Redline Garage - Live Orders Log',
  token?: string
): Promise<{ id: string; name: string; url: string }> => {
  const accessToken = token || cachedWorkspaceAccessToken;
  if (!accessToken) {
    throw new Error('Google authentication required. Please sign in with Google first.');
  }

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Customer Orders',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Order ID' } },
                  { userEnteredValue: { stringValue: 'Date & Time' } },
                  { userEnteredValue: { stringValue: 'Customer Name' } },
                  { userEnteredValue: { stringValue: 'Phone Number' } },
                  { userEnteredValue: { stringValue: 'Delivery Address' } },
                  { userEnteredValue: { stringValue: 'Customer Email' } },
                  { userEnteredValue: { stringValue: 'Items Ordered' } },
                  { userEnteredValue: { stringValue: 'Subtotal (₹)' } },
                  { userEnteredValue: { stringValue: 'Shipping (₹)' } },
                  { userEnteredValue: { stringValue: 'Total Amount (₹)' } },
                  { userEnteredValue: { stringValue: 'Payment Method' } },
                  { userEnteredValue: { stringValue: 'Order Status' } },
                  { userEnteredValue: { stringValue: 'Gift Note / Custom Notes' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Google Sheet (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const config: GoogleSheetConfig = {
    spreadsheetId,
    spreadsheetName: title,
    spreadsheetUrl,
    autoSyncOnCheckout: true,
    lastSyncedAt: new Date().toISOString(),
  };

  saveSheetConfig(config);

  return {
    id: spreadsheetId,
    name: title,
    url: spreadsheetUrl,
  };
};

/**
 * Formats order items into a clean single cell string
 */
export const formatOrderItemsForSheet = (items: any[]): string => {
  if (!items || !Array.isArray(items) || items.length === 0) return 'None';
  return items
    .map(it => {
      const name = it.productName || it.name || it.product?.name || 'Product';
      const qty = it.quantity || 1;
      const price = it.price || it.product?.price || 0;
      let line = `${qty}x ${name} (₹${price * qty})`;
      if (it.customization) {
        if (it.customization.carTitle || it.customization.driverName) {
          line += ` [Custom: ${it.customization.carTitle || ''} / ${it.customization.driverName || ''}]`;
        }
      }
      return line;
    })
    .join('; ');
};

/**
 * Append a customer order directly as a row in Google Sheets
 */
export const appendOrderToGoogleSheet = async (
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    customerEmail?: string;
    items: any[];
    subtotal?: number;
    shipping?: number;
    total: number;
    paymentMethod?: string;
    status?: string;
    giftNote?: string;
    createdAt?: string;
  },
  spreadsheetIdParam?: string,
  tokenParam?: string
): Promise<{ success: boolean; message?: string }> => {
  const accessToken = tokenParam || cachedWorkspaceAccessToken;
  const config = getSavedSheetConfig();
  const spreadsheetId = spreadsheetIdParam || config?.spreadsheetId;

  if (!accessToken || !spreadsheetId) {
    // Graceful no-op if Google Sheets is not actively signed in or connected
    return { success: false, message: 'Google Sheets integration not actively connected.' };
  }

  const nowFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const rowValues = [
    order.orderNumber || 'RG-NEW',
    nowFormatted,
    order.customerName || 'Customer',
    order.customerPhone || 'N/A',
    order.customerAddress || 'N/A',
    order.customerEmail || '',
    formatOrderItemsForSheet(order.items),
    order.subtotal !== undefined ? Number(order.subtotal) : Number(order.total),
    order.shipping !== undefined ? Number(order.shipping) : 0,
    Number(order.total || 0),
    order.paymentMethod || 'UPI',
    order.status || 'Pending',
    order.giftNote || '',
  ];

  try {
    const range = encodeURIComponent('Customer Orders!A1');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      // If the sheet name is 'Sheet1' instead of 'Customer Orders', retry with Sheet1
      const fallbackRange = encodeURIComponent('A1');
      const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fallbackRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      });

      if (!fallbackRes.ok) {
        const err = await fallbackRes.text();
        console.warn('Google Sheets append error:', err);
        return { success: false, message: err };
      }
    }

    // Update last sync time
    if (config) {
      saveSheetConfig({
        ...config,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Failed to append order to Google Sheet:', err);
    return { success: false, message: err?.message };
  }
};

/**
 * Bulk sync a list of orders to the Google Spreadsheet
 */
export const syncAllOrdersToGoogleSheet = async (
  orders: FirestoreOrder[],
  spreadsheetIdParam?: string,
  tokenParam?: string
): Promise<{ success: boolean; syncedCount: number; message?: string }> => {
  const accessToken = tokenParam || cachedWorkspaceAccessToken;
  const config = getSavedSheetConfig();
  const spreadsheetId = spreadsheetIdParam || config?.spreadsheetId;

  if (!accessToken || !spreadsheetId) {
    throw new Error('Google authentication or Spreadsheet ID missing.');
  }

  if (!orders || orders.length === 0) {
    return { success: true, syncedCount: 0, message: 'No orders to sync.' };
  }

  const rows = orders.map(order => {
    const formattedDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return [
      order.orderNumber,
      formattedDate,
      order.customerName,
      order.customerPhone,
      order.customerAddress,
      order.customerEmail || '',
      formatOrderItemsForSheet(order.items),
      order.subtotal,
      order.shipping,
      order.total,
      order.paymentMethod,
      order.status,
      order.giftNote || '',
    ];
  });

  const range = encodeURIComponent('Customer Orders!A1');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!res.ok) {
    // Retry on general sheet
    const fallbackRange = encodeURIComponent('A1');
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fallbackRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.text();
      throw new Error(`Sync failed: ${err}`);
    }
  }

  if (config) {
    saveSheetConfig({
      ...config,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  return { success: true, syncedCount: orders.length };
};
