import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Extracts the feature group prefix from a pathname.
 * e.g. /participants/123 → "participants"
 *      /microsite/agenda/456 → "microsite/agenda"
 */
function getFeaturePrefix(path) {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "microsite" && parts[1]) return `microsite/${parts[1]}`;
  return parts[0] || "";
}

const LAST_PATH_KEY = "smi_last_path";

/**
 * Persists filter state to localStorage, scoped to a feature group.
 *
 * - Filters are RESTORED when navigating back from a page within the same
 *   feature (e.g. list → detail → back to list).
 * - Filters are CLEARED when the user arrives from a different feature
 *   (e.g. leaving participants and coming back later via agenda).
 *
 * @param {string} storageKey  Unique localStorage key for this feature's filters.
 * @param {object} defaults    Default filter values (used on first visit or after reset).
 * @returns {[object, function]} [filters, setFilters]
 *   setFilters accepts a partial object or an updater function, same as setState.
 */
export function usePersistedFilters(storageKey, defaults) {
  const location = useLocation();
  const currentFeature = getFeaturePrefix(location.pathname);

  const [filters, setFiltersState] = useState(() => {
    try {
      const lastPath = localStorage.getItem(LAST_PATH_KEY) || "";
      const lastFeature = getFeaturePrefix(lastPath);

      if (lastFeature === currentFeature) {
        const saved = localStorage.getItem(storageKey);
        if (saved) return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {
      // ignore parse errors
    }
    return defaults;
  });

  // Track current path so the next page mount can compare feature groups.
  useEffect(() => {
    localStorage.setItem(LAST_PATH_KEY, location.pathname);
  }, [location.pathname]);

  // Persist filters whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      // ignore storage errors (e.g. private mode quota)
    }
  }, [storageKey, filters]);

  const setFilters = (updater) => {
    setFiltersState((prev) => {
      const next = typeof updater === "function" ? { ...prev, ...updater(prev) } : { ...prev, ...updater };
      return next;
    });
  };

  return [filters, setFilters];
}
