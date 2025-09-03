import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  originalNumber?: string;
  model: string[];
  category: string;
  price: number;
  description: string;
  photoUrls: string[];
  status: 'available' | 'sold';
  soldDate?: Date | Timestamp;
  soldPrice?: number;
  buyerInfo?: string;
  soldModel?: string;
}