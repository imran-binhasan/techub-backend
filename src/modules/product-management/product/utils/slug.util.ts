/**
 * Slug Generation Utility
 * Generates URL-friendly slugs from text
 */

/**
 * Generate a slug from a string
 * Converts to lowercase, replaces spaces and special chars with dashes
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except spaces and dashes
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a unique slug with async check
 * @param text - The text to convert to a slug
 * @param checkExists - Async function to check if slug exists
 * @returns Promise resolving to unique slug
 */
export async function generateUniqueSlugAsync(
  text: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate slug format
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Generate SKU from product details
 * @param params - Product details for SKU generation
 * @returns Generated SKU
 */
export function generateSKU(params: {
  categoryCode?: string;
  brandCode?: string;
  productName?: string;
  variant?: string;
  randomSuffix?: boolean;
}): string {
  const parts: string[] = [];

  if (params.categoryCode) {
    parts.push(params.categoryCode.toUpperCase());
  }

  if (params.brandCode) {
    parts.push(params.brandCode.toUpperCase());
  }

  if (params.productName) {
    const nameCode = params.productName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
    parts.push(nameCode);
  }

  if (params.variant) {
    parts.push(params.variant.toUpperCase().replace(/\s+/g, ''));
  }

  if (params.randomSuffix) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    parts.push(`${timestamp}${random}`);
  }

  return parts.join('-');
}

/**
 * Validate SKU format
 * @param sku - The SKU to validate
 * @returns true if valid, false otherwise
 */
export function isValidSKU(sku: string): boolean {
  return /^[A-Z0-9\-_]+$/i.test(sku);
}
