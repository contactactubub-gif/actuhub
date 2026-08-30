import { JournalFrontPage } from '../types';

export const UNE_EXPIRATION_HOURS = 24;

/**
 * Checks if a journal front page (UNE) was published within the last 24 hours.
 */
export function isUneValid24h(frontPage: JournalFrontPage): boolean {
  if (!frontPage) return false;
  
  // Check createdAt ISO timestamp
  if (frontPage.createdAt) {
    const createdTime = new Date(frontPage.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const now = Date.now();
      const diffHours = (now - createdTime) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours < UNE_EXPIRATION_HOURS;
    }
  }

  // Fallback to date string (YYYY-MM-DD) if createdAt is missing
  if (frontPage.date) {
    const pageDate = new Date(frontPage.date).getTime();
    if (!isNaN(pageDate)) {
      const now = Date.now();
      const diffHours = (now - pageDate) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours < 36;
    }
  }

  return true;
}

/**
 * Returns time remaining before 24h expiration
 */
export function getUneRemainingTime(frontPage: JournalFrontPage): {
  isExpired: boolean;
  formattedRemaining: string;
  hoursLeft: number;
} {
  if (!frontPage || !frontPage.createdAt) {
    return { isExpired: false, formattedRemaining: '24h', hoursLeft: 24 };
  }

  const createdTime = new Date(frontPage.createdAt).getTime();
  if (isNaN(createdTime)) {
    return { isExpired: false, formattedRemaining: '24h', hoursLeft: 24 };
  }

  const expireTime = createdTime + UNE_EXPIRATION_HOURS * 60 * 60 * 1000;
  const diffMs = expireTime - Date.now();

  if (diffMs <= 0) {
    return { isExpired: true, formattedRemaining: 'Expirée (> 24h)', hoursLeft: 0 };
  }

  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft === 0) {
    return { isExpired: false, formattedRemaining: `${minutesLeft} min`, hoursLeft: 0 };
  }

  return { isExpired: false, formattedRemaining: `${hoursLeft}h ${minutesLeft}m`, hoursLeft };
}

/**
 * Filters an array of UNEs to return only active ones (within 24 hours).
 */
export function filterValid24hUnes(frontPages: JournalFrontPage[]): JournalFrontPage[] {
  return frontPages.filter(isUneValid24h);
}
