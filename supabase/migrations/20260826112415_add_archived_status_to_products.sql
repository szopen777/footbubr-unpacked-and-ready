/*
# Add 'archived' to products status check constraint

## Purpose
The admin panel allows setting a product's status to "archived" (moves it from
the main shop to the /archive page). The original check constraint only allowed
`available`, `sold`, `draft`, so setting `archived` failed with
`violates check constraint products_status_check`.

## Changes
1. Drops the old `products_status_check` constraint.
2. Re-creates it with the additional `'archived'` value.

## Security
No RLS or policy changes — existing policies already allow anon/authenticated
to SELECT, INSERT, UPDATE, DELETE on `products`.
*/

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE public.products ADD CONSTRAINT products_status_check
  CHECK (status IN ('available','sold','draft','archived'));
