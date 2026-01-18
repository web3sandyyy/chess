import openingsData from './openings.json';

export interface Opening {
  eco: string;
  name: string;
  moves: string[];
  description: string;
}

interface OpeningsDatabase {
  openings: Opening[];
}

const openings = (openingsData as OpeningsDatabase).openings;

/**
 * Detects the current opening based on move history
 * Returns the most specific (longest matching) opening
 */
export function detectOpening(moveHistory: string[]): Opening | null {
  if (moveHistory.length === 0) return null;
  
  let bestMatch: Opening | null = null;
  let longestMatch = 0;
  
  for (const opening of openings) {
    const openingMoves = opening.moves;
    
    // Check if the game moves match this opening
    if (openingMoves.length > 0 && openingMoves.length <= moveHistory.length) {
      let matches = true;
      for (let i = 0; i < openingMoves.length; i++) {
        if (moveHistory[i] !== openingMoves[i]) {
          matches = false;
          break;
        }
      }
      
      if (matches && openingMoves.length > longestMatch) {
        longestMatch = openingMoves.length;
        bestMatch = opening;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Get opening suggestions for the current position
 */
export function getOpeningSuggestions(moveHistory: string[]): Opening[] {
  if (moveHistory.length >= 15) return []; // Too deep for opening book
  
  const suggestions: Opening[] = [];
  
  for (const opening of openings) {
    const openingMoves = opening.moves;
    
    // Check if this opening could continue from current position
    if (openingMoves.length > moveHistory.length) {
      let couldMatch = true;
      for (let i = 0; i < moveHistory.length; i++) {
        if (openingMoves[i] !== moveHistory[i]) {
          couldMatch = false;
          break;
        }
      }
      
      if (couldMatch) {
        suggestions.push(opening);
      }
    }
  }
  
  // Return top 5 by name (alphabetically)
  return suggestions.slice(0, 5);
}

/**
 * Get opening by ECO code
 */
export function getOpeningByEco(eco: string): Opening | undefined {
  return openings.find(o => o.eco === eco);
}

/**
 * Search openings by name
 */
export function searchOpenings(query: string): Opening[] {
  const lowerQuery = query.toLowerCase();
  return openings.filter(o => 
    o.name.toLowerCase().includes(lowerQuery) ||
    o.eco.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all openings for the sidebar
 */
export function getAllOpenings(): Opening[] {
  return openings;
}

/**
 * Get popular openings for beginners
 */
export function getPopularOpenings(): Opening[] {
  const popularNames = [
    "King's Pawn Opening",
    "Italian Game",
    "Ruy Lopez",
    "Sicilian Defense",
    "French Defense",
    "Caro-Kann Defense",
    "Queen's Gambit",
    "London System",
    "King's Indian Defense",
    "Scotch Game"
  ];
  
  return openings.filter(o => 
    popularNames.some(name => o.name.includes(name))
  ).slice(0, 10);
}
