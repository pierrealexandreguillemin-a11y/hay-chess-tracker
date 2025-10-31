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
 * Extract tournament ID from FFE URL
 * Supports: FicheTournoi.aspx?Ref=68994 or Resultats.aspx URLs
 */
function extractTournamentId(url: string): string | null {
  // FicheTournoi.aspx?Ref=68994
  const ficheMatch = url.match(/FicheTournoi\.aspx\?Ref=(\d+)/);
  if (ficheMatch) return ficheMatch[1];

  // Resultats.aspx?URL=Tournois/Id/68994/68994
  const resultsMatch = url.match(/Tournois\/Id\/(\d+)/);
  if (resultsMatch) return resultsMatch[1];

  return null;
}

/**
 * Convert tournament URL to Action=Ls URL (player list with clubs)
 * Handles both FicheTournoi.aspx and Resultats.aspx formats
 */
export function getListUrl(tournamentUrl: string): string {
  const tournamentId = extractTournamentId(tournamentUrl);

  if (!tournamentId) {
    // Fallback: assume already correct format
    return tournamentUrl.replace('Action=Ga', 'Action=Ls');
  }

  return `https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/${tournamentId}/${tournamentId}&Action=Ls`;
}

/**
 * Convert tournament URL to Action=Ga URL (results grid)
 * Handles both FicheTournoi.aspx and Resultats.aspx formats
 */
export function getResultsUrl(tournamentUrl: string): string {
  const tournamentId = extractTournamentId(tournamentUrl);

  if (!tournamentId) {
    // Fallback: assume already correct format
    return tournamentUrl;
  }

  return `https://www.echecs.asso.fr/Resultats.aspx?URL=Tournois/Id/${tournamentId}/${tournamentId}&Action=Ga`;
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
 * Parse player list page (Action=Ls) to extract club information
 * @returns Map of player name -> club name
 */
export function parsePlayerClubs(htmlList: string): Map<string, string> {
  const $ = cheerio.load(htmlList);
  const playerClubMap = new Map<string, string>();

  // Find player list table
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 8) return; // Skip header rows (need 8 cols: Nr, [empty], Nom, Rapide, Cat, Fede, Ligue, Club)

    const nameRaw = $(cells[2]).text().trim(); // Column 3 = Nom (cells[0]=Nr, cells[1]=empty, cells[2]=Nom)
    const name = cleanPlayerName(nameRaw);
    const club = $(cells[7]).text().trim(); // Column 8 = Club

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

  // FFE structure: Each player is in a <tr> that CONTAINS <div class="papi_joueur_box">
  // This filters out sub-table rows which don't have the div
  $('tr').filter((_, row) => {
    return $(row).find('div.papi_joueur_box').length > 0;
  }).each((_, row) => {
    const cells = $(row).find('> td');
    if (cells.length < 3) return;

    // cells[0] = Ranking (Pl)
    const ranking = parseInt($(cells[0]).text().trim()) || 0;

    // cells[2] contains the player div
    const playerDiv = $(cells[2]).find('div.papi_joueur_box');

    // Player name is in <b> tag
    const nameRaw = playerDiv.find('b').first().text().trim();
    const name = cleanPlayerName(nameRaw);

    // Get club from map
    const club = playerClubMap.get(name) || '';

    // 🎯 FILTER: Keep only target club
    if (club !== CLUB_NAME) return;

    // Inside playerDiv, there's a sub-table with player info
    const subTable = playerDiv.find('table').first();
    const infoRow = subTable.find('tr').first(); // First row has: Pl, Nom, Elo, Points, Buchholz
    const infoCells = infoRow.find('td');

    // Parse info from sub-table first row
    // Structure: [colspan=3], Pl, empty, Nom, Elo, Cat, Fede, Ligue, Points, Buchholz, Perf
    let elo = 0;
    let currentPoints = 0;
    let buchholz: number | undefined;
    let performance: number | undefined;

    infoCells.each((_, cell) => {
      const text = $(cell).text().trim();

      // Find Elo (format: "1468 F")
      if (/^\d{3,4}\s*[FEN]?$/.test(text)) {
        elo = parseElo(text);
      }

      // Points are usually near the end (format: "5" or "4½")
      if (/^\d+[½⁄₂]?$/.test(text) && !performance) {
        const parsed = parsePoints(text);
        if (parsed < 20) { // Distinguish from Buchholz
          currentPoints = parsed;
        } else if (!buchholz) {
          buchholz = parsed;
        }
      }
    });

    // Parse round results from subsequent rows in sub-table
    const results: Result[] = [];
    subTable.find('tr').slice(1).each((roundIndex, resultRow) => {
      const resultCells = $(resultRow).find('td');
      if (resultCells.length < 3) return;

      // Structure: Round#, Color (B/N), Score (0/1), OpponentPl, empty, OpponentName, ...
      const roundNum = roundIndex + 1;
      const scoreText = $(resultCells[2]).text().trim();

      let score: 0 | 0.5 | 1 = 0;
      if (scoreText === '1') score = 1;
      else if (scoreText === '½' || scoreText === '0.5') score = 0.5;
      else score = 0;

      const opponentPl = $(resultCells[3]).text().trim();

      results.push({
        round: roundNum,
        score,
        opponent: opponentPl || undefined,
      });
    });

    players.push({
      name,
      elo,
      club,
      ranking,
      results,
      currentPoints,
      buchholz,
      performance,
      validated: new Array(results.length).fill(false),
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
