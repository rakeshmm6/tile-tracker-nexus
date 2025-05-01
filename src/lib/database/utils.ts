// Shared database utility functions
import { supabase } from "../../integrations/supabase/client";

// Utility function to calculate square feet
export const calculateSquareFeet = (width: number, height: number, tilesPerBox: number): number => {
  // width and height are now in feet
  return width * height * tilesPerBox;
};
