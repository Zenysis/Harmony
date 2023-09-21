// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import AlertsService from 'services/AlertsService';
import BaseModal from 'components/ui/BaseModal';
import ComparativeCheck from 'models/AlertsApp/ComparativeCheck';
import Condition from 'components/AlertsApp/ComposeAlertDefinitionModal/Condition';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DirectoryService from 'services/DirectoryService';
import Group from 'components/ui/Group';
import GroupByAndFilterConditions from 'components/AlertsApp/ComposeAlertDefinitionModal/GroupByAndFilterConditions';
import I18N from 'lib/I18N';
import ThresholdCheck from 'models/AlertsApp/ThresholdCheck';
import Toaster from 'components/ui/Toaster';
import useInitialAlertValues from 'components/AlertsApp/ComposeAlertDefinitionModal/useInitialAlertValues';
import { noop, uniqueId } from 'util/util';
import type Dimension from 'models/core/wip/Dimension';

type Props = {
  alertToEdit?: AlertDefinition,
  onAlertDefinitionPost?: () => void,
  onRequestClose?: () => void,
  showModal: boolean,
};

export default function ComposeAlertDefinitionModal({
  showModal,
  alertToEdit,
  onAlertDefinitionPost = noop,
  onRequestClose = noop,
}: Props): React.Element<typeof BaseModal> {
  const [showErrorState, setShowErrorState] = React.useState<boolean>(false);

  const updateFilterFromNewDimension = React.useCallback(
    (
      newDimension: Dimension | void,
      setFilterValue: (DimensionValueFilterItem | void) => void,
    ): void => {
      // NOTE: 'nation' is not real dimension. Set filter to undefined
      // as there are no dimension values for nation to create a filter from.
      if (newDimension === undefined || newDimension.id() === 'nation') {
        setFilterValue(undefined);
      } else {
        setFilterValue(
          DimensionValueFilterItem.create({
            dimension: newDimension.id(),
            id: `${newDimension.id()}__${uniqueId()}`,
          }),
        );
      }
    },
    [],
  );

  const {
    check,
    dimension,
    filter,
    setCheck,
    setDimension,
    setFilter,
    setTimeDropdownSelection,
    timeDropdownSelection,
    title,
  } = useInitialAlertValues(alertToEdit, updateFilterFromNewDimension);

  const checkConditionCompleted = (): boolean => {
    switch (check.type) {
      case 'THRESHOLD': {
        const { field, threshold } = check;
        return (
          field !== undefined &&
          threshold !== '' &&
          !Number.isNaN(Number(threshold))
        );
      }
      case 'COMPARATIVE': {
        const { leftField, rightField } = check;
        return leftField !== undefined && rightField !== undefined;
      }
      default:
        (check.type: empty);
        return false;
    }
  };

  const saveAlertDefinition = newDefinitionObj => {
    // Create success and error messages for the create or update case.
    let update = Promise.resolve();
    let successMessage = '';
    let errorMessage = '';
    if (alertToEdit !== undefined) {
      update = AlertsService.updateAlertDefinition(
        newDefinitionObj,
        alertToEdit.uri(),
      );
      successMessage = I18N.text('Successfully edited alert');
    } else {
      update = AlertsService.postAlertDefinition(newDefinitionObj);
      successMessage = I18N.text('Successfully created alert');
      errorMessage = I18N.text('Could not create alert');
    }

    update
      .then(() => {
        Toaster.success(successMessage);
        onAlertDefinitionPost();
      })
      .catch(() => {
        Toaster.error(errorMessage);
      });
    onRequestClose();
  };

  const onSubmitAlertDefinitionClick = () => {
    setShowErrorState(true);

    // The submit button is always enabled, so we need to ensure an incomplete alert cannot
    // be created.
    if (checkConditionCompleted() && dimension !== undefined) {
      // Serialize the check and fields
      const checks = [];
      const fields = [];
      switch (check.type) {
        case 'THRESHOLD': {
          const { field, operation, threshold } = check;
          invariant(field, 'Field should exist');
          const thresholdCheck = ThresholdCheck.create({
            operation,
            threshold: Number(threshold),
          });
          checks.push(thresholdCheck.serialize());
          fields.push(AlertDefinition.serializeAlertField(field));
          break;
        }
        case 'COMPARATIVE': {
          const { leftField, operation, rightField } = check;
          invariant(
            leftField && rightField,
            'Left and right fields should exist',
          );
          const comparativeCheck = ComparativeCheck.create({
            operation,
          });
          checks.push(comparativeCheck.serialize());
          fields.push(AlertDefinition.serializeAlertField(leftField));
          fields.push(AlertDefinition.serializeAlertField(rightField));
          break;
        }
        default:
          (check.type: empty);
          break;
      }

      // Build the serialized alert definition
      const filters = filter === undefined || filter.isEmpty() ? [] : [filter];
      const newDefinitionObj = {
        checks,
        fields,
        title,
        dimensionName: dimension.id(),
        filters: Zen.serializeArray(filters),
        timeGranularity: timeDropdownSelection,
        userId: DirectoryService.getUserId(),
      };

      // Save the alert definition to the database
      saveAlertDefinition(newDefinitionObj);
    }
  };

  const onDimensionChange = React.useCallback(
    (newDimension: Dimension | void) =>
      updateFilterFromNewDimension(newDimension, setFilter),
    [setFilter, updateFilterFromNewDimension],
  );

  const modalTitle =
    alertToEdit !== undefined
      ? I18N.text('Edit Alert')
      : I18N.text('Create Alert');
  return (
    <BaseModal
      className="alert-definition-modal"
      onPrimaryAction={onSubmitAlertDefinitionClick}
      onRequestClose={onRequestClose}
      primaryButtonText={I18N.textById('Save')}
      show={showModal}
      title={modalTitle}
      width={792}
    >
      {/* NOTE: Modal has default 20x20 padding, add to it to get 24x36 padding. */}
      <Group.Vertical paddingX="xxs" paddingY="m" spacing="xl">
        <Group.Item
          className="alert-definition-modal__title"
          marginBottom="s"
          paddingBottom="xs"
        >
          {title}
        </Group.Item>
        <Group.Item className="u-caption-text">
          <I18N>Alert title</I18N>
        </Group.Item>
        <Condition
          check={check}
          setCheck={setCheck}
          setShowErrorState={setShowErrorState}
          showErrorState={showErrorState}
        />
        <GroupByAndFilterConditions
          dimension={dimension}
          filter={filter}
          onDimensionChange={onDimensionChange}
          setDimension={setDimension}
          setFilter={setFilter}
          setTimeDropdownSelection={setTimeDropdownSelection}
          showErrorState={showErrorState}
          timeDropdownSelection={timeDropdownSelection}
        />
      </Group.Vertical>
    </BaseModal>
  );
}
