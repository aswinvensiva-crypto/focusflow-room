-- Add DELETE policy for customers table
CREATE POLICY "Authenticated users can delete customers"
ON public.customers
FOR DELETE
USING (true);

-- Add tax columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN base_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN tax_percentage numeric NOT NULL DEFAULT 0,
ADD COLUMN tax_amount numeric NOT NULL DEFAULT 0;

-- Update the calculate_pending_amount function to handle tax
CREATE OR REPLACE FUNCTION public.calculate_pending_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Calculate tax amount
  NEW.tax_amount := NEW.base_amount * (NEW.tax_percentage / 100);
  
  -- Calculate total amount including tax
  NEW.total_amount := NEW.base_amount + NEW.tax_amount;
  
  -- Calculate pending amount
  NEW.pending_amount := NEW.total_amount - NEW.advance_paid;
  
  -- Update payment status
  IF NEW.pending_amount <= 0 THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.advance_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$function$;