-- Add DELETE policy for rooms table
CREATE POLICY "Authenticated users can delete rooms" 
ON public.rooms 
FOR DELETE 
USING (true);