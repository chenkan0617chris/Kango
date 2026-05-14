-- Add multi-stop support: intermediate waypoints between pickup and dropoff
ALTER TABLE demands ADD COLUMN IF NOT EXISTS waypoints text[] DEFAULT '{}';
