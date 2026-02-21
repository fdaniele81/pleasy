// Colori default per categorie standard
const DEFAULT_CATEGORY_COLORS = {
  functional: '#93C5FD',
  technical: '#86EFAC',
  governance: '#D8B4FE',
};

// Chiavi di traduzione per categorie default
const DEFAULT_CATEGORY_LABEL_KEYS = {
  functional: 'common:categoryFunctional',
  technical: 'common:categoryTechnical',
  governance: 'common:categoryGovernance',
};

// Fallback labels (usati quando t non è disponibile)
const DEFAULT_CATEGORY_FALLBACK_LABELS = {
  functional: 'Funzionale',
  technical: 'Tecnico',
  governance: 'Governance',
};

// Palette colori per categorie custom
const CUSTOM_PALETTE = [
  { color: '#FCA5A5' },  // red
  { color: '#FCD34D' },  // yellow
  { color: '#6EE7B7' },  // emerald
  { color: '#67E8F9' },  // cyan
  { color: '#F9A8D4' },  // pink
  { color: '#FDBA74' },  // orange
];

/**
 * Dato un array ordinato di chiavi categoria, restituisce una mappa { key: { label, color } }
 * @param {string[]} categoryKeys
 * @param {Function} [t] - funzione di traduzione i18n (opzionale)
 */
export function getCategoryColorMap(categoryKeys, t) {
  const map = {};
  let customIndex = 0;

  categoryKeys.forEach((key) => {
    if (DEFAULT_CATEGORY_COLORS[key]) {
      const label = t
        ? t(DEFAULT_CATEGORY_LABEL_KEYS[key])
        : DEFAULT_CATEGORY_FALLBACK_LABELS[key];
      map[key] = { label, color: DEFAULT_CATEGORY_COLORS[key] };
    } else {
      const palette = CUSTOM_PALETTE[customIndex % CUSTOM_PALETTE.length];
      map[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        color: palette.color,
      };
      customIndex++;
    }
  });

  return map;
}

/**
 * Estrae tutte le chiavi distribution uniche da un phaseConfig
 */
export function extractCategoriesFromConfig(phaseConfig) {
  const categories = new Set();
  const phaseKeys = ['analysis', 'development', 'internal_test', 'uat', 'release', 'pm', 'startup', 'documentation'];

  phaseKeys.forEach((pk) => {
    if (phaseConfig?.[pk]?.distribution) {
      Object.keys(phaseConfig[pk].distribution).forEach((cat) => categories.add(cat));
    }
  });

  return [...categories];
}
