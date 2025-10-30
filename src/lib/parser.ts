/**
 * FFE Tournament Results Parser
 * Parses HTML from French Chess Federation tournament pages
 *
 * IMPORTANT: FFE requires 2 pages to be fetched:
 * - Action=Ls: Player list with clubs
 * - Action=Ga: Results grid (American system)
 */

import * as cheerio from 'cheerio';
import type { Player, Result, ClubStats } from '@/types';

const CLUB_NAME = 'Hay Chess';

/**
 * Convert Action=Ga URL to Action=Ls URL
 */
export function getListUrl(resultsUrl: string): string {
  return resultsUrl.replace('Action=Ga', 'Action=Ls');
}

/**
 * Clean player name: normalize spaces and uppercase
 * @example "BACHKAT  Fares" -> "BACHKAT FARES"
 */
function cleanPlayerName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Parse ELO from text: "1541 F" -> 1541
 */
function parseElo(text: string): number {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Parse points: "4½" -> 4.5
 */
function parsePoints(text: string): number {
  const normalized = text.replace('½', '.5');
  return parseFloat(normalized) || 0;
}

/**
 * Parse round result from cell text
 * @param cellText - Format: "+ 75B", "- 6N", "= 2B", "EXE", "> 91B"
 * @param round - Round number
 */
function parseRoundResult(
  cellText: string,
  round: number
): Result | null {
  if (!cellText || cellText === '-') return null;

  // Special cases: Exempt (bye)
  if (cellText === 'EXE' || cellText.startsWith('>')) {
    return { round, score: 1, opponent: 'EXEMPT' };
  }

  // Normal result: [+/-/=] [number][B/N]
  const match = cellText.match(/^([+\-=])\s*(\d+)([BN])?$/);
  if (!match) return null;

  const [, result, opponentNum] = match;

  let score: 0 | 0.5 | 1;
  if (result === '+') score = 1;
  else if (result === '-') score = 0;
  else score = 0.5;

  return {
    round,
    score,
    opponent: opponentNum,
  };
}

/**
 * Parse player list page (Action=Ls) to extract club information
 * @returns Map of player name -> club name
 */
export function parsePlayerClubs(htmlList: string): Map<string, string> {
  const $ = cheerio.load(htmlList);
  const playerClubMap = new Map<string, string>();

  // Find player list table
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 7) return; // Skip header rows

    const nameRaw = $(cells[1]).text().trim();
    const name = cleanPlayerName(nameRaw);
    const club = $(cells[6]).text().trim();

    if (name && club) {
      playerClubMap.set(name, club);
    }
  });

  return playerClubMap;
}

/**
 * Parse results page (Action=Ga) and filter by club
 * @param htmlResults - HTML from results page
 * @param playerClubMap - Map of player names to clubs
 * @returns Array of players from target club
 */
export function parseResults(
  htmlResults: string,
  playerClubMap: Map<string, string>
): Player[] {
  const $ = cheerio.load(htmlResults);
  const players: Player[] = [];

  // Find results table (American grid)
  const table = $('table').first();
  const headerRow = table.find('thead tr').first();

  // 1. Detect round columns dynamically
  const roundColumns: number[] = [];
  headerRow.find('th').each((i, th) => {
    const text = $(th).text().trim();
    if (text.match(/^R\s*\d+$/)) { // "R 1", "R 2", etc.
      roundColumns.push(i);
    }
  });
  const numRounds = roundColumns.length;

  // 2. Find important column indices
  let ptsIndex = -1;
  let buchholzIndex = -1;
  let perfIndex = -1;

  headerRow.find('th').each((i, th) => {
    const text = $(th).text().trim();
    if (text === 'Pts') ptsIndex = i;
    if (text === 'Tr.' || text === 'Tr') buchholzIndex = i;
    if (text === 'Perf') perfIndex = i;
  });

  // 3. Parse each player row
  table.find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return; // Skip invalid rows

    // Extract basic data
    const ranking = parseInt($(cells[0]).text().trim()) || 0;
    const nameRaw = $(cells[1]).text().trim();
    const name = cleanPlayerName(nameRaw);

    const eloText = $(cells[2]).text().trim();
    const elo = parseElo(eloText);

    // Get club from map
    const club = playerClubMap.get(name) || '';

    // 🎯 FILTER: Keep only target club
    if (club !== CLUB_NAME) return;

    // Parse round results
    const results: Result[] = [];
    roundColumns.forEach((colIndex, roundIndex) => {
      const cellText = $(cells[colIndex]).text().trim();
      const result = parseRoundResult(cellText, roundIndex + 1);
      if (result) results.push(result);
    });

    // Extract final stats
    const currentPoints = ptsIndex >= 0
      ? parsePoints($(cells[ptsIndex]).text().trim())
      : 0;

    const buchholz = buchholzIndex >= 0
      ? parseFloat($(cells[buchholzIndex]).text().trim()) || undefined
      : undefined;

    const performance = perfIndex >= 0
      ? parseInt($(cells[perfIndex]).text().trim()) || undefined
      : undefined;

    players.push({
      name,
      elo,
      club,
      ranking,
      results,
      currentPoints,
      buchholz,
      performance,
      validated: new Array(numRounds).fill(false),
    });
  });

  return players;
}

/**
 * Detect current round based on players' results
 */
export function detectCurrentRound(players: Player[]): number {
  let maxRound = 0;
  players.forEach(player => {
    player.results.forEach(result => {
      if (result.round > maxRound) {
        maxRound = result.round;
      }
    });
  });
  return maxRound;
}

/**
 * Calculate club statistics for a given round
 */
export function calculateClubStats(
  players: Player[],
  currentRound: number
): ClubStats {
  const playerCount = players.length;

  if (playerCount === 0) {
    return {
      round: currentRound,
      totalPoints: 0,
      playerCount: 0,
      averagePoints: 0,
    };
  }

  // Sum points up to current round
  const totalPoints = players.reduce((sum, player) => {
    const pointsUpToRound = player.results
      .filter(r => r.round <= currentRound)
      .reduce((acc, r) => acc + r.score, 0);
    return sum + pointsUpToRound;
  }, 0);

  const averagePoints = Math.round((totalPoints / playerCount) * 100) / 100;

  return {
    round: currentRound,
    totalPoints,
    playerCount,
    averagePoints,
  };
}

/**
 * Parse both FFE pages and return filtered players
 * This is the main entry point for parsing FFE data
 *
 * @param htmlList - HTML from Action=Ls page
 * @param htmlResults - HTML from Action=Ga page
 * @returns Parsed players from target club
 */
export function parseFFePages(
  htmlList: string,
  htmlResults: string
): { players: Player[]; currentRound: number } {
  // Step 1: Parse club information from list page
  const playerClubMap = parsePlayerClubs(htmlList);

  // Step 2: Parse results and filter by club
  const players = parseResults(htmlResults, playerClubMap);

  // Step 3: Detect current round
  const currentRound = detectCurrentRound(players);

  return { players, currentRound };
}
