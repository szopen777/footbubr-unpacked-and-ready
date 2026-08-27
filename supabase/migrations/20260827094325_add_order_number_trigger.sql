/*
# Auto-assign order_number on insert

Adds a trigger that automatically assigns a sequential `order_number` to each
new order, based on the count of existing orders in the same calendar year.
This produces human-readable order IDs like #FB-2026-001.
*/

CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  year_int integer;
  next_num integer;
BEGIN
  year_int := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()));

  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE EXTRACT(YEAR FROM COALESCE(created_at, now())) = year_int;

  NEW.order_number := next_num;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_order_number ON public.orders;
CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.assign_order_number();
