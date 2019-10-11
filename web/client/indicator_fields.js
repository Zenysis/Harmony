import numeral from 'numeral';

// eslint-disable-next-line import/extensions
import { CURRENCY_LOOKUP } from 'currency_util.js';

const NO_DATA_TEXT = t('visualizations.common.noData');

export const FIELD_VALUE_TYPES = {
  CURRENCY: 'CURRENCY',
  PERCENT: 'PERCENT',
  NUMBER: 'NUMBER',
};

export const FIELD_VALUE_DEFAULT_TYPE = FIELD_VALUE_TYPES.NUMBER;
export const IndicatorsByGroup =
  window.__JSON_FROM_BACKEND.indicatorGroups || [];

export const PostgresIndicatorsByGroup =
  window.__JSON_FROM_BACKEND.postgresIndicatorGroups || [];

export const EnabledDimensionsByIndicator = (() => {
  const ret = {};
  IndicatorsByGroup.forEach(group => {
    group.indicators.forEach(indicator => {
      ret[indicator.id] = indicator.enableDimensions || [];
    });
  });
  return ret;
})();

const { indicatorSelectionDropdowns = [] } = window.__JSON_FROM_BACKEND;
const filterOnLookup = {};
let defaultSelection;

indicatorSelectionDropdowns.forEach(dropdown => {
  const selection = {
    filterOn: dropdown.filterOn,
    selectionType: dropdown.selectionType,
  };
  if (!dropdown.groupIds.length) {
    defaultSelection = selection;
  }

  dropdown.groupIds.forEach(groupId => {
    filterOnLookup[groupId] = selection;
  });
});

export const [GroupLookup, IndicatorLookup, ProgramAreaLookup] = (() => {
  const groupLookup = {};
  const indicatorLookup = {};
  const programAreaLookup = {};
  const { removedIndicators = [] } = window.__JSON_FROM_BACKEND;
  IndicatorsByGroup.forEach(group => {
    const { groupId } = group;
    groupLookup[groupId] = {
      ...group,
      ...(filterOnLookup[groupId] || defaultSelection),
    };
    group.indicators.forEach(indicator => {
      const indicatorId = indicator.id;
      indicatorLookup[indicatorId] = indicator;
      indicatorLookup[indicatorId].groupId = groupId;

      // Add indicator to all the program areas it applies to
      const programAreas = {};
      // Handle the different ways we store program area.
      // TODO(stephen): Make this consistent and store as a set on the backend.
      if (indicator.program_area) {
        programAreas[indicator.program_area] = true;
      }
      if (indicator.sub_area) {
        programAreas[indicator.sub_area] = true;
      }
      if (indicator.programAreas) {
        indicator.programAreas.forEach(area => {
          programAreas[area] = true;
        });
      }

      Object.keys(programAreas).forEach(area => {
        if (!programAreaLookup[area]) {
          programAreaLookup[area] = {};
        }
        programAreaLookup[area][indicatorId] = true;
      });
    });
  });
  removedIndicators.forEach(group => {
    const { groupId } = group;
    groupLookup[groupId] = {
      ...group,
      ...defaultSelection,
    };
    group.indicators.forEach(indicator => {
      const indicatorId = indicator.id;
      indicatorLookup[indicatorId] = indicator;
      indicatorLookup[indicatorId].groupId = groupId;
    });
  });
  return [groupLookup, indicatorLookup, programAreaLookup];
})();

export function getFieldValueType(fieldId) {
  if (
    !IndicatorLookup[fieldId] ||
    !IndicatorLookup[fieldId].valueType ||
    !FIELD_VALUE_TYPES[IndicatorLookup[fieldId].valueType]
  ) {
    return FIELD_VALUE_DEFAULT_TYPE;
  }

  return IndicatorLookup[fieldId].valueType;
}

export function getFieldSymbol(fieldId) {
  const valueType = getFieldValueType(fieldId);
  if (valueType === FIELD_VALUE_TYPES.CURRENCY) {
    const { valueSubtype } = IndicatorLookup[fieldId];
    const symbol = CURRENCY_LOOKUP[valueSubtype];

    // Don't fail if we don't have the currency code
    if (!symbol) {
      return valueSubtype;
    }
    return symbol;
  }

  return '';
}

export function formatFieldValueForDisplay(value, fieldId) {
  // TODO(stephen): Potentially translate or make configurable.
  if (value === undefined || value === null || value === '') {
    return NO_DATA_TEXT;
  }

  const valueType = getFieldValueType(fieldId);
  let numberFormat = '0[.][000]';
  if (valueType === FIELD_VALUE_TYPES.PERCENT) {
    numberFormat = '0[.][00]%';
  } else if (valueType === FIELD_VALUE_TYPES.CURRENCY) {
    const symbol = getFieldSymbol(fieldId);
    numberFormat = '0,0[.]00';
    return `${symbol}${numeral(value).format(numberFormat)}`;
  }

  return numeral(value).format(numberFormat);
}

// Mapping from field ID to display text
export const fieldIdsToName = (function buildFieldIdMap() {
  const ret = {};
  const constituentFields = new Set();
  IndicatorsByGroup.forEach(group => {
    group.indicators.forEach(ind => {
      let displayText = ind.text;
      if (group.groupTextShort) {
        displayText += ` (${group.groupTextShort})`;
      }
      ret[ind.id] = displayText;

      const constituents = ind.children || ind.constituents;
      if (constituents && constituents.length) {
        constituentFields.addAll(constituents);
      }
    });
  });

  // Ensure all constituents have a valid indicator name defined. This is to
  // workaround backend indicator formulas that reference fields that are not
  // exposed on the frontend's indicator dropdown.
  constituentFields.forEach(indId => {
    if (!ret[indId]) {
      ret[indId] = indId;
    }
  });

  PostgresIndicatorsByGroup.forEach(group => {
    group.indicators.forEach(ind => {
      let displayText = ind.text;
      if (group.groupTextShort) {
        displayText += ` (${group.groupTextShort})`;
      }
      ret[ind.id] = displayText;
    });
  });
  return ret;
})();
