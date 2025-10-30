# API Documentation

Complete API documentation for Hay Chess Tracker.

---

## Table of Contents

- [REST API Endpoints](#rest-api-endpoints)
  - [POST /api/scrape](#post-apiscrape)
- [Core Functions](#core-functions)
  - [Parser Functions](#parser-functions)
  - [Storage Functions](#storage-functions)
  - [Utility Functions](#utility-functions)
- [TypeScript Types](#typescript-types)
- [Error Handling](#error-handling)

---

## REST API Endpoints

### POST /api/scrape

Vercel serverless function that acts as a CORS proxy to fetch FFE tournament pages.

**Endpoint:** `/api/scrape`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | FFE tournament page URL (must contain `echecs.asso.fr`) |

**Example Request:**

```bash
curl -X POST https://hay-chess-tracker.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ga"
  }'
```

**JavaScript/TypeScript:**

```typescript
const response = await fetch('/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ga',
  }),
});

const data = await response.json();
console.log(data.html); // HTML content
```

#### Response

**Success (200 OK):**

```json
{
  "html": "<html>...</html>"
}
```

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 405 | Method not allowed (not POST) | `{ "error": "Method not allowed" }` |
| 400 | Missing or invalid URL | `{ "error": "URL is required" }` |
| 400 | URL not from FFE domain | `{ "error": "Only FFE URLs are allowed" }` |
| 500 | Server error or fetch failure | `{ "error": "Failed to scrape FFE page", "details": "..." }` |

**Example Error:**

```json
{
  "error": "Only FFE URLs are allowed"
}
```

#### Security

- Only accepts URLs from `echecs.asso.fr` domain
- POST method only (prevents unintentional GET requests)
- User-Agent spoofing to appear as a browser
- No authentication required (public endpoint)

#### Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- 10 requests per minute per IP
- 100 requests per hour per IP

#### Notes

- This endpoint bypasses CORS restrictions that prevent direct browser requests to FFE
- Response can be large (50-500KB of HTML)
- FFE server response time varies (typically 500ms-2s)

---

## Core Functions

### Parser Functions

Located in `src/lib/parser.ts`. These functions parse HTML from FFE tournament pages.

---

#### `parseFFePages`

Main entry point for parsing FFE tournament data. Combines club information from the list page with results from the grid page.

**Signature:**

```typescript
function parseFFePages(
  htmlList: string,
  htmlResults: string
): {
  players: Player[];
  currentRound: number;
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `htmlList` | `string` | HTML content from Action=Ls page (player list with clubs) |
| `htmlResults` | `string` | HTML content from Action=Ga page (results grid) |

**Returns:**

```typescript
{
  players: Player[];      // Array of players from target club
  currentRound: number;   // Current tournament round (1-based)
}
```

**Example:**

```typescript
import { parseFFePages } from '@/lib/parser';

const listUrl = 'https://echecs.asso.fr/...&Action=Ls';
const resultsUrl = 'https://echecs.asso.fr/...&Action=Ga';

// Fetch both pages
const [htmlList, htmlResults] = await Promise.all([
  fetch('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ url: listUrl }),
  }).then(r => r.json()).then(d => d.html),
  fetch('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ url: resultsUrl }),
  }).then(r => r.json()).then(d => d.html),
]);

// Parse
const { players, currentRound } = parseFFePages(htmlList, htmlResults);

console.log(`Found ${players.length} players from Hay Chess`);
console.log(`Current round: ${currentRound}`);
```

**Algorithm:**

1. Parse club information from `htmlList` (Action=Ls)
2. Parse results from `htmlResults` (Action=Ga)
3. Cross-reference players with clubs
4. Filter only players from target club ("Hay Chess")
5. Detect current round from results
6. Return filtered players + current round

---

#### `parsePlayerClubs`

Extracts club information from the FFE player list page (Action=Ls).

**Signature:**

```typescript
function parsePlayerClubs(htmlList: string): Map<string, string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `htmlList` | `string` | HTML content from Action=Ls page |

**Returns:**

`Map<string, string>` - Map of player name (uppercase, normalized) to club name

**Example:**

```typescript
import { parsePlayerClubs } from '@/lib/parser';

const htmlList = '<html>...</html>'; // From /api/scrape
const clubMap = parsePlayerClubs(htmlList);

console.log(clubMap.get('BACHKAT FARES')); // "Hay Chess"
console.log(clubMap.get('DOE JOHN')); // "Other Club"
```

**Notes:**

- Player names are normalized to uppercase with single spaces
- Club names are kept as-is from FFE
- Table structure expected: `<table><tr><td>Rank</td><td>Name</td>...<td>Club</td></tr>...</table>`

---

#### `parseResults`

Parses the FFE results grid (Action=Ga) and filters by club.

**Signature:**

```typescript
function parseResults(
  htmlResults: string,
  playerClubMap: Map<string, string>
): Player[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `htmlResults` | `string` | HTML content from Action=Ga page |
| `playerClubMap` | `Map<string, string>` | Map of player names to clubs (from `parsePlayerClubs`) |

**Returns:**

`Player[]` - Array of players from target club ("Hay Chess") with their results

**Example:**

```typescript
import { parsePlayerClubs, parseResults } from '@/lib/parser';

const htmlList = '...';
const htmlResults = '...';

const clubMap = parsePlayerClubs(htmlList);
const players = parseResults(htmlResults, clubMap);

players.forEach(player => {
  console.log(`${player.name} (${player.elo}): ${player.currentPoints} pts`);
});
```

**Parsing Logic:**

1. Detect round columns dynamically (header row with "R 1", "R 2", etc.)
2. Detect stats columns (Pts, Tr./Buchholz, Perf)
3. For each player row:
   - Extract name, ELO, ranking
   - Look up club from `playerClubMap`
   - Filter: Keep only if club === "Hay Chess"
   - Parse round results ("+", "-", "=", "EXE", ">")
   - Extract final stats (points, Buchholz, performance)
4. Return filtered players

---

#### `parseRoundResult`

Parses a single round result from cell text.

**Signature:**

```typescript
function parseRoundResult(
  cellText: string,
  round: number
): Result | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cellText` | `string` | Cell text (e.g., "+ 75B", "- 6N", "= 2B", "EXE", "> 91B") |
| `round` | `number` | Round number (1-based) |

**Returns:**

`Result | null` - Parsed result or null if invalid/empty

**Result Format:**

```typescript
{
  round: number;           // Round number
  score: 0 | 0.5 | 1;     // Points scored
  opponent?: string;       // Opponent number or "EXEMPT"
}
```

**Examples:**

```typescript
import { parseRoundResult } from '@/lib/parser';

parseRoundResult('+ 75B', 1);   // { round: 1, score: 1, opponent: '75' }
parseRoundResult('- 6N', 2);    // { round: 2, score: 0, opponent: '6' }
parseRoundResult('= 2B', 3);    // { round: 3, score: 0.5, opponent: '2' }
parseRoundResult('EXE', 4);     // { round: 4, score: 1, opponent: 'EXEMPT' }
parseRoundResult('> 91B', 5);   // { round: 5, score: 1, opponent: 'EXEMPT' }
parseRoundResult('-', 6);       // null (no match)
```

**Cell Text Format:**

- `+ [num][B/N]` - Win (1 point)
- `- [num][B/N]` - Loss (0 points)
- `= [num][B/N]` - Draw (0.5 points)
- `EXE` - Exempt/Bye (1 point)
- `> [num][B/N]` - Forfeit win (1 point)
- `-` - No match (null)

Where:
- `[num]` = opponent number
- `[B/N]` = color (B = White/Blancs, N = Black/Noirs)

---

#### `detectCurrentRound`

Determines the current tournament round based on players' results.

**Signature:**

```typescript
function detectCurrentRound(players: Player[]): number
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `players` | `Player[]` | Array of players with results |

**Returns:**

`number` - Current round number (1-based), or 0 if no results

**Example:**

```typescript
import { detectCurrentRound } from '@/lib/parser';

const players: Player[] = [
  {
    name: 'PLAYER A',
    results: [
      { round: 1, score: 1 },
      { round: 2, score: 0.5 },
      { round: 3, score: 1 },
    ],
    // ...
  },
  // ...
];

const currentRound = detectCurrentRound(players);
console.log(currentRound); // 3
```

**Algorithm:**

Finds the maximum round number across all players' results.

---

#### `calculateClubStats`

Calculates aggregated club statistics for a given round.

**Signature:**

```typescript
function calculateClubStats(
  players: Player[],
  currentRound: number
): ClubStats
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `players` | `Player[]` | Array of club players |
| `currentRound` | `number` | Current round number |

**Returns:**

```typescript
{
  round: number;           // Round number
  totalPoints: number;     // Sum of all players' points up to current round
  playerCount: number;     // Number of players
  averagePoints: number;   // Average points per player (rounded to 2 decimals)
}
```

**Example:**

```typescript
import { calculateClubStats } from '@/lib/parser';

const players: Player[] = [
  {
    name: 'PLAYER A',
    results: [
      { round: 1, score: 1 },
      { round: 2, score: 0.5 },
      { round: 3, score: 1 },
    ],
    // ...
  },
  {
    name: 'PLAYER B',
    results: [
      { round: 1, score: 0.5 },
      { round: 2, score: 1 },
      { round: 3, score: 0.5 },
    ],
    // ...
  },
];

const stats = calculateClubStats(players, 3);
console.log(stats);
// {
//   round: 3,
//   totalPoints: 4.5,  // (1 + 0.5 + 1) + (0.5 + 1 + 0.5)
//   playerCount: 2,
//   averagePoints: 2.25
// }
```

**Algorithm:**

1. For each player, sum points up to `currentRound`
2. Sum all players' points
3. Calculate average: `totalPoints / playerCount`
4. Round average to 2 decimals

---

#### `getListUrl`

Converts an Action=Ga URL to an Action=Ls URL.

**Signature:**

```typescript
function getListUrl(resultsUrl: string): string
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resultsUrl` | `string` | FFE results URL (Action=Ga) |

**Returns:**

`string` - FFE list URL (Action=Ls)

**Example:**

```typescript
import { getListUrl } from '@/lib/parser';

const resultsUrl = 'https://echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ga';
const listUrl = getListUrl(resultsUrl);
console.log(listUrl);
// "https://echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ls"
```

---

### Storage Functions

Located in `src/lib/storage.ts`. These functions manage localStorage persistence.

#### Storage Schema

```typescript
{
  currentEventId: string;
  events: Event[];
  validations: ValidationState;
}
```

---

#### `getStorageData`

Retrieves all data from localStorage.

**Signature:**

```typescript
function getStorageData(): StorageData
```

**Returns:**

```typescript
{
  currentEventId: string;      // ID of currently selected event
  events: Event[];             // Array of all events
  validations: ValidationState; // Validation state for all tournaments
}
```

**Example:**

```typescript
import { getStorageData } from '@/lib/storage';

const data = getStorageData();
console.log(`Current event: ${data.currentEventId}`);
console.log(`Total events: ${data.events.length}`);
```

**Error Handling:**

Returns empty structure if localStorage is unavailable or corrupted:

```typescript
{
  currentEventId: '',
  events: [],
  validations: {},
}
```

---

#### `setStorageData`

Saves all data to localStorage.

**Signature:**

```typescript
function setStorageData(data: StorageData): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `StorageData` | Complete storage data |

**Throws:**

`Error` - If localStorage quota is exceeded or writing fails

**Example:**

```typescript
import { setStorageData } from '@/lib/storage';

const data: StorageData = {
  currentEventId: 'evt_123',
  events: [...],
  validations: {...},
};

try {
  setStorageData(data);
} catch (error) {
  console.error('Failed to save:', error);
  alert('Storage full. Please delete old events.');
}
```

---

#### `getCurrentEvent`

Gets the currently selected event.

**Signature:**

```typescript
function getCurrentEvent(): Event | null
```

**Returns:**

`Event | null` - Current event or null if none selected

**Example:**

```typescript
import { getCurrentEvent } from '@/lib/storage';

const event = getCurrentEvent();
if (event) {
  console.log(`Current event: ${event.name}`);
  console.log(`Tournaments: ${event.tournaments.length}`);
} else {
  console.log('No event selected');
}
```

---

#### `saveEvent`

Saves an event and sets it as current.

**Signature:**

```typescript
function saveEvent(event: Event): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `Event` | Event to save |

**Behavior:**

- If event with same `id` exists, updates it
- If event is new, adds it to the list
- Sets this event as `currentEventId`

**Example:**

```typescript
import { saveEvent } from '@/lib/storage';

const event: Event = {
  id: 'evt_' + Date.now(),
  name: 'Championnat départemental 13',
  createdAt: new Date().toISOString(),
  tournaments: [
    {
      id: 'tour_1',
      name: 'U12',
      url: 'https://echecs.asso.fr/...&Action=Ga',
      lastUpdate: new Date().toISOString(),
      players: [],
    },
  ],
};

saveEvent(event);
```

---

#### `deleteEvent`

Deletes an event and its associated validations.

**Signature:**

```typescript
function deleteEvent(eventId: string): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | `string` | ID of event to delete |

**Behavior:**

- Removes event from events array
- Cleans up validations for all tournaments in this event
- If deleted event was current, sets first remaining event as current (or empty string if none)

**Example:**

```typescript
import { deleteEvent } from '@/lib/storage';

deleteEvent('evt_123');
```

---

#### `getValidationState`

Gets the complete validation state.

**Signature:**

```typescript
function getValidationState(): ValidationState
```

**Returns:**

```typescript
{
  [tournamentId: string]: {
    [playerName: string]: {
      [roundKey: string]: boolean;
    };
  };
}
```

**Example:**

```typescript
import { getValidationState } from '@/lib/storage';

const validations = getValidationState();
console.log(validations['tour_1']['BACHKAT FARES']['round_1']); // true
```

---

#### `setValidation`

Sets validation status for a specific player/round.

**Signature:**

```typescript
function setValidation(
  tournamentId: string,
  playerName: string,
  round: number,
  isValid: boolean
): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tournamentId` | `string` | Tournament ID |
| `playerName` | `string` | Player name (case-sensitive) |
| `round` | `number` | Round number (1-based) |
| `isValid` | `boolean` | Validation status |

**Example:**

```typescript
import { setValidation } from '@/lib/storage';

setValidation('tour_1', 'BACHKAT FARES', 1, true);
setValidation('tour_1', 'BACHKAT FARES', 2, false);
```

**Storage Key Format:**

Internally stored as `round_${round}` (e.g., `round_1`, `round_2`).

---

#### `getValidation`

Gets validation status for a specific player/round.

**Signature:**

```typescript
function getValidation(
  tournamentId: string,
  playerName: string,
  round: number
): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tournamentId` | `string` | Tournament ID |
| `playerName` | `string` | Player name (case-sensitive) |
| `round` | `number` | Round number (1-based) |

**Returns:**

`boolean` - `true` if validated, `false` otherwise (default)

**Example:**

```typescript
import { getValidation } from '@/lib/storage';

const isValidated = getValidation('tour_1', 'BACHKAT FARES', 1);
console.log(isValidated); // true or false
```

---

#### `clearAllData`

Clears all localStorage data.

**Signature:**

```typescript
function clearAllData(): void
```

**Example:**

```typescript
import { clearAllData } from '@/lib/storage';

if (confirm('Delete all data?')) {
  clearAllData();
  window.location.reload();
}
```

---

#### `exportData`

Exports all data as JSON string (for backup).

**Signature:**

```typescript
function exportData(): string
```

**Returns:**

`string` - JSON string with formatted indentation

**Example:**

```typescript
import { exportData } from '@/lib/storage';

const json = exportData();

// Download as file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'hay-chess-backup.json';
a.click();
```

---

#### `importData`

Imports data from JSON string (for restore).

**Signature:**

```typescript
function importData(jsonString: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `jsonString` | `string` | JSON string (from `exportData`) |

**Returns:**

`boolean` - `true` if successful, `false` if failed

**Example:**

```typescript
import { importData } from '@/lib/storage';

const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const json = await file.text();

  const success = importData(json);
  if (success) {
    alert('Data imported successfully!');
    window.location.reload();
  } else {
    alert('Import failed. Invalid JSON.');
  }
});
```

---

### Utility Functions

Located in `src/lib/utils.ts`.

#### `cn`

Merges Tailwind CSS class names with proper precedence.

**Signature:**

```typescript
function cn(...inputs: ClassValue[]): string
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `...inputs` | `ClassValue[]` | Class names or conditional class objects |

**Returns:**

`string` - Merged class name string

**Example:**

```typescript
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  'another-class',
  condition && 'conditional-class',
  { 'active': isActive, 'disabled': isDisabled }
);

// Usage in component
<div className={cn('p-4 rounded', isActive && 'bg-blue-500')}>
  Content
</div>
```

**Dependencies:**

- `clsx` - For conditional classes
- `tailwind-merge` - For Tailwind precedence

---

## TypeScript Types

All types are defined in `src/types/index.ts`.

### Event

```typescript
interface Event {
  id: string;               // Unique event ID (e.g., "evt_1698765432000")
  name: string;             // Event name (e.g., "Championnat départemental 13")
  createdAt: string;        // ISO 8601 timestamp
  tournaments: Tournament[];// Array of tournaments in this event
}
```

### Tournament

```typescript
interface Tournament {
  id: string;         // Unique tournament ID (e.g., "tour_1698765432000")
  name: string;       // Tournament name (e.g., "U12", "U14")
  url: string;        // FFE results URL (Action=Ga)
  lastUpdate: string; // ISO 8601 timestamp of last fetch
  players: Player[];  // Array of players from target club
}
```

### Player

```typescript
interface Player {
  name: string;           // Player name (uppercase, normalized)
  elo: number;            // ELO rating
  club: string;           // Club name (always "Hay Chess" after filtering)
  results: Result[];      // Results by round
  currentPoints: number;  // Total points
  buchholz?: number;      // Buchholz tiebreak (optional)
  performance?: number;   // Performance rating (optional)
  ranking: number;        // Overall tournament ranking
  validated: boolean[];   // Validation status per round
}
```

### Result

```typescript
interface Result {
  round: number;          // Round number (1-based)
  score: 0 | 0.5 | 1;    // Points scored
  opponent?: string;      // Opponent number or "EXEMPT"
}
```

### ValidationState

```typescript
interface ValidationState {
  [tournamentId: string]: {
    [playerName: string]: {
      [roundKey: string]: boolean; // "round_1": true, "round_2": false
    };
  };
}
```

### StorageData

```typescript
interface StorageData {
  currentEventId: string;      // ID of current event
  events: Event[];             // All events
  validations: ValidationState;// Validation state
}
```

### ClubStats

```typescript
interface ClubStats {
  round: number;          // Round number
  totalPoints: number;    // Sum of all players' points
  playerCount: number;    // Number of players
  averagePoints: number;  // Average points per player
}
```

---

## Error Handling

### API Errors

All API errors follow this format:

```typescript
{
  error: string;      // Human-readable error message
  details?: string;   // Optional technical details
}
```

**Common Errors:**

- `405 Method not allowed` - Use POST, not GET
- `400 URL is required` - Missing `url` in request body
- `400 Only FFE URLs are allowed` - URL doesn't contain `echecs.asso.fr`
- `500 Failed to scrape FFE page` - Network error, FFE server down, or invalid response

### Parser Errors

Parser functions are defensive and return fallback values on errors:

- `parseFFePages` - Returns empty players array if parsing fails
- `parsePlayerClubs` - Returns empty Map if parsing fails
- `parseResults` - Skips invalid rows, returns partial results
- `parseRoundResult` - Returns `null` for invalid cell text

### Storage Errors

Storage functions throw errors only on critical failures:

- `setStorageData` - Throws if localStorage quota exceeded
- Other functions catch errors and return safe defaults

**Best Practice:**

```typescript
try {
  setStorageData(data);
} catch (error) {
  console.error('Storage error:', error);
  alert('Failed to save. Storage may be full.');
}
```

---

## Rate Limiting & Caching

### Current Implementation

- No rate limiting on `/api/scrape`
- No caching (fresh fetch every time)

### Recommended for Production

**Rate Limiting:**
```javascript
// 10 requests per minute per IP
// 100 requests per hour per IP
```

**Caching:**
```javascript
// Cache FFE responses for 30 seconds (tournament updates slowly)
// Use in-memory cache (Vercel Edge Config) or Redis
```

---

## Examples

### Complete Workflow Example

```typescript
import { parseFFePages, getListUrl } from '@/lib/parser';
import { saveEvent } from '@/lib/storage';

// 1. User provides FFE URL
const resultsUrl = 'https://echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ga';
const listUrl = getListUrl(resultsUrl);

// 2. Fetch both pages via API proxy
const fetchPage = async (url: string) => {
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch FFE page');
  }

  const data = await response.json();
  return data.html;
};

const [htmlList, htmlResults] = await Promise.all([
  fetchPage(listUrl),
  fetchPage(resultsUrl),
]);

// 3. Parse FFE data
const { players, currentRound } = parseFFePages(htmlList, htmlResults);

console.log(`Found ${players.length} Hay Chess players`);
console.log(`Current round: ${currentRound}`);

// 4. Create event and save
const event: Event = {
  id: 'evt_' + Date.now(),
  name: 'Championnat départemental 13 - Oct 2025',
  createdAt: new Date().toISOString(),
  tournaments: [
    {
      id: 'tour_' + Date.now(),
      name: 'U12',
      url: resultsUrl,
      lastUpdate: new Date().toISOString(),
      players,
    },
  ],
};

saveEvent(event);

// 5. Display results
players.forEach(player => {
  console.log(`${player.ranking}. ${player.name} (${player.elo}) - ${player.currentPoints} pts`);
});
```

---

**Last Updated:** 30 October 2025
**Maintained by:** Hay Chess Tracker Team
