const backend = window.__JSON_FROM_BACKEND;

export const USER = backend.user;
export const DIMENSION_VALUE_MAP = backend.dimensionValueMap;

export const FILTER_DIMENSIONS = backend.filterDimensions;
export const SQT_GEOGRAPHY_FILTER_DIMENSIONS =
  backend.sqtGeographyFilterDimensions;
export const FILTER_ORDER = backend.filterOrder;
export const FILTER_OPTIONS = backend.filterOptions;
export const FIELD_OPTIONS = backend.fieldOptions;

export const SELECT_GRANULARITY_BUTTON_ORDER =
  backend.selectGranularityButtonOrder;
export const SELECT_GRANULARITY_DEFAULT_LEVEL =
  backend.selectGranularityDefaultLevel;
export const GEO_NAME_MAP = backend.geoNameMap;

export const NATION_NAME = backend.nationName;

export const ACTIVE_DASHBOARD = backend.dashboard
  ? backend.dashboard.activeDashboard
  : null;

export const VENDOR_SCRIPT_PATH = backend.vendorScriptPath;
