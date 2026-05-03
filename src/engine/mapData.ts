/**
 * StationMap data — paragraph-to-location mapping.
 * Extracted from StationMap component for reusability (Stage 8.5).
 *
 * Note: The canonical location data now lives in src/engine/locations.ts (LOCATION_DATA).
 * This file re-exports from there for backward compatibility.
 */

export { PARAGRAPH_LOCATION_MAP, getLocationForParagraph } from './locations';