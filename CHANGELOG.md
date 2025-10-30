# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Complete documentation infrastructure (ROADMAP, CONTRIBUTING, API, DEPLOYMENT, ARCHITECTURE, SECURITY)
- GitHub Actions CI/CD pipelines (ci, deploy-preview, deploy-production, security-audit, lighthouse)
- GitHub PR and issue templates
- Pre-commit hooks with Husky
- Prettier configuration for code formatting
- EditorConfig for consistent editor settings
- Utility scripts (pre-commit, check-coverage, release, setup-dev)
- CHANGELOG.md following keepachangelog.com standards

### Changed
- Updated package.json with new scripts for quality checks

---

## [1.0.0-beta] - 2025-10-30

### Added
- Initial release of Hay Chess Tracker
- FFE tournament results scraping with dual-page parser (Action=Ls + Action=Ga)
- Automatic filtering of players by club name ("Hay Chess")
- Manual validation system for results round by round
- Real-time club statistics calculation (total points, average, player count)
- localStorage-based persistence for events and validations
- Vercel serverless function for CORS proxy (`/api/scrape`)
- Miami Vice glassmorphism UI design
- Responsive mobile-first interface
- React 18 with TypeScript 5.5 strict mode
- Vite 5.4 build system
- Tailwind CSS 3.4 for styling
- shadcn/ui component library
- Framer Motion for animations
- Vitest for testing infrastructure
- ESLint configuration with TypeScript support

### Core Features
- Event creation with multiple tournaments
- Tournament tabs navigation (U12, U14, etc.)
- Player table with ranking, ELO, results per round
- Validation checkboxes for each player/round
- Club statistics display (round-based)
- Data export/import functionality
- WebGL halftone waves background effect
- Floating particles animation
- Shimmer effects on glass cards
- SVG animated background paths

### Components
- `EventForm` - Create and manage events
- `TournamentTabs` - Navigate between tournaments
- `PlayerTable` - Display and validate player results
- `ClubStats` - Show aggregated club statistics
- `MiamiGlass` - Glassmorphism wrapper component
- `ShimmerEffect` - Subtle shimmer animation
- `FloatingParticles` - Canvas-based particle system
- `HalftoneWaves` - WebGL animated waves
- `BackgroundPaths` - SVG path animations

### Core Libraries
- `lib/parser.ts` - FFE HTML parsing logic
  - `parseFFePages` - Main entry point for dual-page parsing
  - `parsePlayerClubs` - Extract club information from Action=Ls
  - `parseResults` - Parse results from Action=Ga
  - `parseRoundResult` - Parse individual round results
  - `detectCurrentRound` - Determine current tournament round
  - `calculateClubStats` - Calculate aggregated statistics
- `lib/storage.ts` - localStorage management
  - `getStorageData` / `setStorageData` - CRUD operations
  - `getCurrentEvent` / `saveEvent` / `deleteEvent` - Event management
  - `getValidation` / `setValidation` - Validation state
  - `exportData` / `importData` - Backup/restore
- `lib/utils.ts` - Utility functions (cn for className merging)

### API
- `/api/scrape` - Vercel serverless function
  - POST endpoint for fetching FFE pages
  - CORS bypass proxy
  - URL validation (only echecs.asso.fr domain)
  - Error handling and logging

### Types
- `Event` - Event data structure
- `Tournament` - Tournament data structure
- `Player` - Player with results and validation state
- `Result` - Individual round result
- `ValidationState` - Validation tracking structure
- `StorageData` - Complete localStorage schema
- `FFEPlayerRow` / `ParsedFFEData` - FFE parsing types
- `ClubStats` - Club statistics structure

### Configuration
- `vite.config.ts` - Vite configuration with path aliases
- `tsconfig.json` - TypeScript strict mode configuration
- `tailwind.config.js` - Tailwind with custom Miami colors
- `postcss.config.js` - PostCSS configuration
- `vercel.json` - Vercel deployment configuration
- `.eslintrc.cjs` - ESLint rules for React + TypeScript

### Known Issues
- Test coverage: 0% (tests exist but coverage not comprehensive)
- 5 npm vulnerabilities (3 moderate, 2 high) in transitive dependencies
- Bundle size: 581KB (exceeds 500KB warning threshold)
- FFE parser not tested against real production URLs
- No rate limiting on `/api/scrape` endpoint
- No retry logic for network failures
- localStorage quota errors not gracefully handled

### Performance
- Lighthouse Performance: ~75 (needs optimization)
- Bundle size: 581KB gzipped (needs code-splitting)
- Animations: 60 FPS on modern hardware
- WebGL effects: Requires WebGL2 support (graceful degradation)

### Browser Support
- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- Mobile browsers (iOS Safari, Chrome Android)

### Deployment
- Vercel automatic deployment on push to master
- Production URL: https://hay-chess-tracker.vercel.app
- Environment: Node.js 20.x

---

## Security Advisories

### [1.0.0-beta]

#### Known Vulnerabilities

**Moderate Severity (3):**
- `esbuild` - Transitive dependency vulnerability
- `path-to-regexp` - Denial of Service (DoS) vulnerability
- To be patched in next minor release

**High Severity (2):**
- `undici` - HTTP request smuggling vulnerability
- To be patched urgently in v1.0.1

**Mitigation:**
- No known exploits affecting production deployment
- Vulnerability audit scheduled for Phase 2 (Q4 2025)
- Dependabot alerts enabled

---

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) - Breaking changes, API incompatibilities
- **MINOR** (1.X.0) - New features, backward-compatible
- **PATCH** (1.0.X) - Bug fixes, backward-compatible

### Upcoming Versions

- **v1.0.1** (Q4 2025) - Security patches, critical bug fixes
- **v1.1.0** (Q4 2025) - Documentation + CI/CD infrastructure (Phase 1)
- **v1.2.0** (Q1 2026) - Tests (80%+ coverage) + security audit (Phase 2)
- **v1.3.0** (Q1 2026) - Performance optimizations (Phase 3)
- **v2.0.0** (Q1 2026) - Production-ready release (Phase 4)
- **v2.1.0** (Q2 2026) - Advanced features (Phase 5)
- **v3.0.0** (Q3 2026) - Backend + multi-user support (Phase 6)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

All notable contributions will be credited here.

---

## Links

- [GitHub Repository](https://github.com/hay-chess/hay-chess-tracker)
- [Issue Tracker](https://github.com/hay-chess/hay-chess-tracker/issues)
- [Roadmap](./ROADMAP.md)
- [Documentation](./docs/)

---

**Maintained by:** Hay Chess Tracker Team
**License:** Proprietary - Hay Chess Club

[Unreleased]: https://github.com/hay-chess/hay-chess-tracker/compare/v1.0.0-beta...HEAD
[1.0.0-beta]: https://github.com/hay-chess/hay-chess-tracker/releases/tag/v1.0.0-beta
