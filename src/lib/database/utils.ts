
// Shared database utility functions
import { supabase } from "../../integrations/supabase/client";

// Utility function to calculate square feet
export const calculateSquareFeet = (width: number, height: number, tilesPerBox: number): number => {
  // Convert from millimeters to feet (1 mm = 1/304.8 feet)
  const widthInFeet = width / 304.8;
  const heightInFeet = height / 304.8;
  return widthInFeet * heightInFeet * tilesPerBox;
};
