import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.ts';
import { auth } from './firebase.ts';
import type { Product } from '../types/Product';

interface ExchangeRate {
  currency: string;
  rate: number;
  lastUpdated: Date;
  source: string;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'parts'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'parts'), product);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'parts', id), product);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'parts', id));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'parts'));
  let retryCount = 0;
  const maxRetries = 3;
  let unsubscribe: (() => void) | null = null;

  const attemptSubscription = async () => {
    try {
      console.log('Attempting Firestore subscription...');
      unsubscribe = onSnapshot(q,
        (querySnapshot) => {
          try {
            console.log('Firestore snapshot received, docs count:', querySnapshot.docs.length);
            const products = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            callback(products);
            // Reset retry count on successful connection
            retryCount = 0;
          } catch (error) {
            console.error('Error processing products snapshot:', error);
          }
        },
        (error) => {
           console.error('Error in products subscription:', {
             code: error.code,
             message: error.message,
             name: error.name
           });

           if (error.code === 'permission-denied') {
             console.warn('Permission denied for subscription - falling back to one-time read for guests');
             // For guests, try one-time read instead of subscription
             getProducts().then(products => {
               callback(products);
             }).catch(readError => {
               console.error('Error in fallback read:', readError);
             });
             return;
           }

           // Retry logic for network errors and 400 Bad Request
           if (retryCount < maxRetries && (
             error.code === 'unavailable' ||
             error.code === 'cancelled' ||
             error.message.includes('400') ||
             error.code === 'invalid-argument'
           )) {
             retryCount++;
             console.log(`Retrying subscription (${retryCount}/${maxRetries}) in ${Math.pow(2, retryCount)}s...`);

             setTimeout(() => {
               if (unsubscribe) {
                 unsubscribe();
               }
               attemptSubscription();
             }, Math.pow(2, retryCount) * 1000); // Exponential backoff
           } else {
             console.error('Max retries reached or unrecoverable error');
           }
         }
      );
    } catch (error) {
      console.error('Error in attemptSubscription:', error);
    }
  };

  attemptSubscription();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Global variable to prevent concurrent API calls
let exchangeRatePromise: Promise<number | null> | null = null;

export const getExchangeRate = async (currency: string = 'USD'): Promise<ExchangeRate | null> => {
  try {
    const docRef = doc(db, 'exchangeRates', currency);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        currency,
        rate: data.rate,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        source: data.source || 'unknown'
      };
    }

    // Fallback to localStorage
    const localData = localStorage.getItem(`exchangeRate_${currency}`);
    if (localData) {
      const parsed = JSON.parse(localData);
      return {
        currency: parsed.currency,
        rate: parsed.rate,
        lastUpdated: new Date(parsed.lastUpdated),
        source: parsed.source || 'localStorage'
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting exchange rate from Firestore:', error);

    // Fallback to localStorage even if Firestore fails
    try {
      const localData = localStorage.getItem(`exchangeRate_${currency}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        return {
          currency: parsed.currency,
          rate: parsed.rate,
          lastUpdated: new Date(parsed.lastUpdated),
          source: parsed.source || 'localStorage'
        };
      }
    } catch (localError) {
      console.error('Error getting exchange rate from localStorage:', localError);
    }

    return null;
  }
};

export const saveExchangeRate = async (currency: string, rate: number, source: string = 'monobank'): Promise<void> => {
  try {
    const docRef = doc(db, 'exchangeRates', currency);
    await setDoc(docRef, {
      currency,
      rate,
      source,
      lastUpdated: serverTimestamp()
    });
    console.log(`Exchange rate saved: ${currency} = ${rate} (${source})`);
  } catch (error) {
    console.error('Error saving exchange rate:', error);
    // Fallback to localStorage if Firestore write fails
    try {
      const localData = {
        currency,
        rate,
        source,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`exchangeRate_${currency}`, JSON.stringify(localData));
      console.log(`Exchange rate saved to localStorage: ${currency} = ${rate} (${source})`);
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
    }
    // Don't throw error to prevent app crash
  }
};

export const getCachedExchangeRate = async (currency: string = 'USD', maxAgeMinutes: number = 120): Promise<number | null> => {
  // If there's already a pending request, wait for it
  if (exchangeRatePromise) {
    console.log('Waiting for existing exchange rate request...');
    return exchangeRatePromise;
  }

  exchangeRatePromise = (async () => {
    try {
      const cachedRate = await getExchangeRate(currency);

      if (cachedRate) {
        const now = new Date();
        const ageMinutes = (now.getTime() - cachedRate.lastUpdated.getTime()) / (1000 * 60);

        if (ageMinutes < maxAgeMinutes) {
          console.log(`Using cached exchange rate: ${currency} = ${cachedRate.rate} (${Math.round(ageMinutes)} min old)`);
          return cachedRate.rate;
        }
      }

      // Fetch from API and cache
      console.log('Fetching fresh exchange rate from API...');
      const response = await fetch('https://api.monobank.ua/bank/currency');

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limited by Monobank API, using cached rate if available');
          return cachedRate?.rate || null;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const usd = data.find((item: any) => item.currencyCodeA === 840 && item.currencyCodeB === 980);
        if (usd && usd.rateSell) {
          await saveExchangeRate(currency, usd.rateSell, 'monobank');
          return usd.rateSell;
        }
      }

      // If API failed, return cached rate
      return cachedRate?.rate || null;
    } catch (error) {
      console.error('Error getting cached exchange rate:', error);
      // Try to return cached rate even if API failed
      try {
        const cachedRate = await getExchangeRate(currency);
        return cachedRate?.rate || null;
      } catch (fallbackError) {
        console.error('Error getting fallback exchange rate:', fallbackError);
        return null;
      }
    } finally {
      // Reset the promise after completion
      exchangeRatePromise = null;
    }
  })();

  return exchangeRatePromise;
};

export const uploadImageToStorage = async (file: File, path: string = 'images/'): Promise<string> => {
  try {
    const storageRef = ref(storage, `${path}${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
};