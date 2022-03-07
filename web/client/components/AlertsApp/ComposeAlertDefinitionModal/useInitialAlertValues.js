// @flow
import * as React from 'react';
import Promise from 'bluebird';

import DimensionService from 'services/wip/DimensionService';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import I18N from 'lib/I18N';
import usePrevious from 'lib/hooks/usePrevious';
import {
  DEFAULT_THRESHOLD_CHECK,
  DEFAULT_TIME_GRANULARITY_OPTION,
} from 'components/AlertsApp/ComposeAlertDefinitionModal/defaults';
import { cancelPromise } from 'util/promiseUtil';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type Dimension from 'models/core/wip/Dimension';
import type { ModalCheck } from 'components/AlertsApp/ComposeAlertDefinitionModal/defaults';

const getTitle = (check: ModalCheck): string => {
  switch (check.type) {
    case 'THRESHOLD': {
      const { field, operation, threshold } = check;
      const fieldText =
        field === undefined ? `<${I18N.textById('Indicator')}>` : field.label();
      const thresholdText =
        !threshold || Number.isNaN(Number(threshold))
          ? `<${I18N.textById('Number')}>`
          : threshold;

      return `${fieldText} ${operation} ${thresholdText}`;
    }
    case 'COMPARATIVE': {
      const { leftField, operation, rightField } = check;
      const leftFieldText =
        leftField === undefined
          ? `<${I18N.textById('Indicator')}>`
          : leftField.label();
      const rightFieldText =
        rightField === undefined
          ? `<${I18N.textById('Indicator')}>`
          : rightField.label();

      return `${leftFieldText} ${operation} ${rightFieldText}`;
    }
    default:
      (check.type: empty);
      return '';
  }
};

type AlertDefinitionController = {
  title: string,

  check: ModalCheck,
  setCheck: ModalCheck => void,

  dimension: Dimension | void,
  setDimension: (Dimension | void) => void,

  filter: DimensionValueFilterItem | void,
  setFilter: (DimensionValueFilterItem | void) => void,

  timeDropdownSelection: string,
  setTimeDropdownSelection: string => void,
};

/**
 * Custom hook for the compose alert modal used to set alert definition values when in
 * edit mode and load the corresponding filters.
 */
export default function useInitialAlertValues(
  alertToEdit: AlertDefinition | void,
  updateFilterFromNewDimension: (
    newDimension: Dimension | void,
    setFilterValue: (DimensionValueFilterItem | void) => void,
  ) => void,
): AlertDefinitionController {
  const [title, setTitle] = React.useState<string>('');
  const [check, setCheck] = React.useState<ModalCheck>(DEFAULT_THRESHOLD_CHECK);
  const previousCheck = usePrevious(check);
  const [dimension, setDimension] = React.useState<Dimension | void>(undefined);
  const [filter, setFilter] = React.useState<DimensionValueFilterItem | void>(
    undefined,
  );
  const [
    timeDropdownSelection,
    setTimeDropdownSelection,
  ] = React.useState<string>(DEFAULT_TIME_GRANULARITY_OPTION);

  // If in edit mode (alertToEdit !== undefined), then set the initial values from the stored
  // alert definition. Then, load filters. This should only happens once on component mount.
  React.useEffect(() => {
    let dimensionPromise = Promise.resolve(undefined);
    if (alertToEdit !== undefined) {
      const initialCheck = alertToEdit.checks().first();
      switch (initialCheck.tag) {
        case 'THRESHOLD':
          setCheck({
            type: 'THRESHOLD',
            field: alertToEdit.fields().first(),
            operation: initialCheck.operation(),
            threshold: initialCheck.threshold().toString(),
          });
          break;
        case 'COMPARATIVE':
          setCheck({
            type: 'COMPARATIVE',
            leftField: alertToEdit.fields().first(),
            operation: initialCheck.operation(),
            rightField: alertToEdit.fields().last(),
          });
          break;
        default:
          (initialCheck.tag: empty);
          break;
      }

      dimensionPromise = DimensionService.get(alertToEdit.dimensionId()).then(
        existingDimension => {
          setDimension(existingDimension);
          return existingDimension;
        },
      );
      setTitle(alertToEdit.title());
      setTimeDropdownSelection(alertToEdit.timeGranularity());
    }

    dimensionPromise.then((possibleDimension: Dimension | void) => {
      if (alertToEdit !== undefined && alertToEdit.filters().size() > 0) {
        // TODO(abby): Update this when multiple filters are enabled on the front end
        setFilter(alertToEdit.filters().first());
      } else {
        updateFilterFromNewDimension(possibleDimension, setFilter);
      }
    });
    return () => cancelPromise(dimensionPromise);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the title when the components of a check change.
  React.useEffect(() => {
    // Skip setting the title on page load to allow a saved title to load.
    if (previousCheck === undefined && alertToEdit) {
      return;
    }

    // Ensure updating the title won't overwrite a user defined title.
    if (previousCheck === undefined || getTitle(previousCheck) === title) {
      setTitle(getTitle(check));
    }
  }, [alertToEdit, check, previousCheck, title]);

  return {
    title,
    check,
    setCheck,
    dimension,
    setDimension,
    filter,
    setFilter,
    timeDropdownSelection,
    setTimeDropdownSelection,
  };
}
