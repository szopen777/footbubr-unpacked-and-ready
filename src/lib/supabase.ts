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
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_method: 'paczkomat' | 'kurier';
  paczkomat_code: string | null;
  shipping_address: string | null;
  payment_method: 'blik' | 'card' | 'apple_pay' | 'google_pay' | 'transfer';
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  total_price: number;
  created_at: string;
}

export const PRODUCT_LEVELS: { value: ProductLevel; label: string }[] = [
  { value: 'Profesjonalny', label: 'Profesjonalny (Elite / Pro)' },
  { value: 'Półprofesjonalny', label: 'Półprofesjonalny (Pro / League)' },
  { value: 'Amatorski', label: 'Amatorski (Academy / League)' },
  { value: 'Rekreacyjny', label: 'Rekreacyjny (Club)' },
];
