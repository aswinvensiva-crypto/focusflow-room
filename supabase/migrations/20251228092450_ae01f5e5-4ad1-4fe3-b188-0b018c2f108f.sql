-- Add room_category column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN room_category text NOT NULL DEFAULT 'standard';

-- Add comment for documentation
COMMENT ON COLUMN public.rooms.room_category IS 'Room category type (e.g., standard, deluxe, ultra_deluxe, suite)';