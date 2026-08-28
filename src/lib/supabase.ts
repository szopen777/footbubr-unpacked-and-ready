import { supabase } from '@/integrations/supabase/client';

export { supabase };

export type SurfaceType = 'FG' | 'SG' | 'AG' | 'TF' | 'IC';
export type ProductLevel = 'Profesjonalny' | 'Półprofesjonalny' | 'Amatorski' | 'Rekreacyjny';
export type ProductCondition =
  | 'Nowe z metką'
  | 'Nowe bez metki'
  | 'Używane 9/10'
  | 'Używane 8/10'
  | 'Używane 7/10'
  | 'Używane 6/10';
export type ProductStatus = 'available' | 'sold' | 'draft';
export type DropStatus = 'scheduled' | 'published' | 'cancelled';

export interface DropSettings {
  id: number;
  drop_date: string | null;
  is_tbd: boolean;
  featured_product_id: string | null;
  title: string;
  subtitle: string;
  created_at: string;
  updated_at: string;
}

export interface Drop {
  id: string;
  name: string;
  description: string | null;
  scheduled_at: string;
  status: DropStatus;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  size_eu: number;
  insole_length_cm: number | null;
  price: number;
  original_price: number | null;
  surface_type: SurfaceType;
  level: ProductLevel;
  condition: ProductCondition;
  condition_detail: string | null;
  images: string[];
  box_included: boolean;
  bag_included: boolean;
  extras_description: string | null;
  status: ProductStatus;
  drop_scheduled_at: string | null;
  drop_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string | number | null;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_method: 'paczkomat' | 'kurier';
  paczkomat_code: string | null;
  shipping_address: string | null;
  payment_method: 'blik' | 'card' | 'apple_pay' | 'google_pay' | 'transfer';
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  total_price: number;
  tracking_number: string | null;
  created_at: string;
}

export function formatOrderNumber(order: { id?: string; order_number?: string | number | null }): string {
  if (order.order_number) {
    const raw = String(order.order_number).trim();
    // Jeśli numer zawiera już FB-XXXX (nawet z rokiem), wyciągamy tylko ostatni człon FB-XXXX
    const match = raw.match(/FB-\d+/i);
    if (match) return `#${match[0].toUpperCase()}`;
    if (raw.startsWith('#')) return raw;
    return `#FB-${raw.replace(/\D/g, '').padStart(4, '0')}`;
  }
  return `#FB-${(order.id || '').slice(0, 4).toUpperCase()}`;
}

export const PRODUCT_LEVELS: { value: ProductLevel; label: string }[] = [
  { value: 'Profesjonalny', label: 'Profesjonalny (Elite / Pro)' },
  { value: 'Półprofesjonalny', label: 'Półprofesjonalny (Pro / League)' },
  { value: 'Amatorski', label: 'Amatorski (Academy / League)' },
  { value: 'Rekreacyjny', label: 'Rekreacyjny (Club)' },
];
