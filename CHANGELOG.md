# Snake Bot Changelog

## [Unreleased] - 2026-02-04
### Changed
- **Simplified Game Mechanics:**
  - Removed boost item feature (golden apple power-up).
  - Removed personality system; AI now uses single greedy behavior.
  - Removed particle effects system.
  - Fixed score to increment by 1 per food eaten (was 10).
  - Set agent speed to 60% of human speed (was 70%).

### Added
- **Audio System (In Progress):**
  - Web Audio synth effects for game events.
  - Mute/Unmute toggle in UI.
- **Agent Personality Selector:**
  - Added a compact dropdown to pick Greedy, Aggressive, or Cautious AI.
  - Selection persists in game state and applies immediately.
- **Settings Persistence:**
  - Store agent personality + mute state in localStorage.
  - Restore saved settings on load (including keyboard mute toggle).
- **UI Polish:**
  - Removed duplicate agent personality selector.
- **Round Wins Tracker:**
  - Track round wins when only one snake dies; reset on Restart.
  - Display rounds alongside score (no increment on double-KO).

## [Golden Apple] - 2026-02-04
### Added
- **Golden Apple Power-up:**
  - New food item with visual distinction (Gold/Yellow).
  - Grants +50 points (vs +10).
  - Temporary speed boost effect.

## [Mobile-Ready] - 2026-02-04
### Added
- **Touch Controls:**
  - Implemented swipe detection in `js/ui/dom.js`.
  - Added touch event listeners (start, move, end).
  - Prevented default scrolling behavior on game board.
  - Verified playable on touch devices.

## [Initial Release] - 2026-02-03
- Basic Game Loop
- Modular Architecture
- Desktop Keyboard Controls
