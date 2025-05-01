import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

// Function to convert numbers to Indian Rupees-style words
export function numberToWords(num: number): string {
  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    else if (num < 20) return double[num - 10];
    else {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + single[num % 10] : "");
    }
  };

  if (num === 0) return "Zero Rupees Only";

  // Handle decimals
  let wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);

  let words = "";

  // Convert whole part
  if (wholePart >= 10000000) {
    words += formatTens(Math.floor(wholePart / 10000000)) + " Crore ";
    wholePart %= 10000000;
  }

  if (wholePart >= 100000) {
    words += formatTens(Math.floor(wholePart / 100000)) + " Lakh ";
    wholePart %= 100000;
  }

  if (wholePart >= 1000) {
    words += formatTens(Math.floor(wholePart / 1000)) + " Thousand ";
    wholePart %= 1000;
  }

  if (wholePart >= 100) {
    words += single[Math.floor(wholePart / 100)] + " Hundred ";
    wholePart %= 100;
  }

  if (wholePart > 0) {
    if (words !== "") words += "and ";
    words += formatTens(wholePart);
  }

  words += " Rupees";

  // Add paise if any
  if (decimalPart > 0) {
    words += " and " + formatTens(decimalPart) + " Paise";
  }

  return words + " Only";
}

export function calculateTaxBreakdown(amount: number, stateCode: string, isReverseCharge: boolean) {
  // Skip taxes for reverse charge mechanism
  if (isReverseCharge) {
    return {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalAmount: amount
    };
  }
  
  const taxRate = 0.18; // 18% tax rate for tiles (example)
  const totalTax = amount * taxRate;
  
  // If state codes match (intra-state), apply CGST and SGST
  // For demo purpose, assume company state code is "27" (Maharashtra)
  const companyStateCode = "27";
  
  if (stateCode === companyStateCode) {
    return {
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      totalTax,
      totalAmount: amount + totalTax
    };
  } else {
    // Inter-state: apply IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalTax,
      totalAmount: amount + totalTax
    };
  }
}

export function calculateSquareFeet(tileWidth: number, tileHeight: number, tilesPerBox: number): number {
  // tileWidth and tileHeight are now in feet
  // Calculate area per tile in square feet
  const areaPerTile = tileWidth * tileHeight;
  // Calculate total square feet per box
  return areaPerTile * tilesPerBox;
}

export const generateOrderNumber = () => {
  const prefix = "ORD";
  const timestamp = new Date().getTime().toString().substring(5);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};
