import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
