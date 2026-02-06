import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Complete list of US states and territories for location filtering
 */
export const US_STATES_AND_TERRITORIES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Washington D.C.',
  'American Samoa', 'Guam', 'Northern Mariana Islands', 'Puerto Rico', 'U.S. Virgin Islands'
].sort();

/**
 * Get the appropriate Tailwind CSS classes for a certification badge
 * @param certification The certification name
 * @param hover Whether to include hover effect classes
 * @returns A string of Tailwind classes
 */
export function getCertificationClasses(certification: string, hover: boolean = true): string {
  let baseClasses = '';
  
  switch(certification) {
    case 'Women-owned':
      baseClasses = 'bg-pink-100 text-pink-800';
      if (hover) baseClasses += ' hover:bg-pink-200';
      break;
    case 'Native American-owned':
      baseClasses = 'bg-orange-100 text-orange-800';
      if (hover) baseClasses += ' hover:bg-orange-200';
      break;
    case 'Veteran-owned':
      baseClasses = 'bg-blue-100 text-blue-800';
      if (hover) baseClasses += ' hover:bg-blue-200';
      break;
    case 'Military spouse':
      baseClasses = 'bg-indigo-100 text-indigo-800';
      if (hover) baseClasses += ' hover:bg-indigo-200';
      break;
    case 'LGBTQ-owned':
      baseClasses = 'bg-purple-100 text-purple-800';
      if (hover) baseClasses += ' hover:bg-purple-200';
      break;
    case 'Rural':
      baseClasses = 'bg-green-100 text-green-800';
      if (hover) baseClasses += ' hover:bg-green-200';
      break;
    case 'Minority-owned':
      baseClasses = 'bg-amber-100 text-amber-800';
      if (hover) baseClasses += ' hover:bg-amber-200';
      break;
    case 'Section 3':
      baseClasses = 'bg-teal-100 text-teal-800';
      if (hover) baseClasses += ' hover:bg-teal-200';
      break;
    default:
      baseClasses = 'bg-primary/10 text-primary';
      if (hover) baseClasses += ' hover:bg-primary/20';
  }
  
  return baseClasses;
}

export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }
  
  const trimmedUrl = url.trim();
  
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  return `https://${trimmedUrl}`;
}

/**
 * Convert data to CSV format and trigger download
 * @param data Array of objects to export
 * @param filename Name of the CSV file to download
 * @param columns Optional column mapping { key: displayName }
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Record<keyof T, string>
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns to export
  const keys = columns ? Object.keys(columns) : Object.keys(data[0]);
  const headers = columns 
    ? Object.values(columns)
    : keys;

  // Create CSV header row
  const csvHeaders = headers.join(',');

  // Create CSV data rows
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""');
      
      // Wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  // Combine headers and rows
  const csv = [csvHeaders, ...csvRows].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate a URL-friendly slug from text (for client names)
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateClientSlug(text: string | null | undefined): string {
  if (!text) return 'unknown';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'unknown';
}
