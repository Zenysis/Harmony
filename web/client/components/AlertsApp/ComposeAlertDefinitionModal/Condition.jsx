// @flow
import * as React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import * as Zen from 'lib/Zen';
import DataCatalogPoweredHierarchicalSelector from 'components/common/QueryBuilder/FieldHierarchicalSelector/DataCatalogPoweredHierarchicalSelector';
import Dropdown from 'components/ui/Dropdown';
import Field from 'models/core/wip/Field';
import Group from 'components/ui/Group';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import RadioGroup from 'components/ui/RadioGroup';
import Spacing from 'components/ui/Spacing';
import {
  DEFAULT_COMPARATIVE_CHECK,
  DEFAULT_THRESHOLD_CHECK,
} from 'components/AlertsApp/ComposeAlertDefinitionModal/defaults';
import { environment } from 'util/graphql';
import type { AlertCheckType } from 'models/AlertsApp/AlertCheck';
import type { ModalCheck } from 'components/AlertsApp/ComposeAlertDefinitionModal/defaults';

const CHECK_OPTIONS = {
  '>': I18N.text('greater than'),
  '<': I18N.text('less than'),
  '=': I18N.text('equal to'),
  '>=': I18N.text('greater than or equal to'),
  '<=': I18N.text('less than or equal to'),
  '!=': I18N.text('not equal to'),
};
const CHECK_DROPDOWN_OPTIONS = Object.keys(CHECK_OPTIONS).map(symbol => {
  const text = CHECK_OPTIONS[symbol];
  return (
    <Dropdown.Option key={symbol} value={symbol}>
      {text}
    </Dropdown.Option>
  );
});

const LOADING_SPINNER = (
  <Spacing marginTop="m" flex justifyContent="center">
    <LoadingSpinner />
  </Spacing>
);

type Props = {
  check: ModalCheck,
  setCheck: ModalCheck => void,
  setShowErrorState: boolean => void,
  showErrorState: boolean,
};

export default function Condition({
  check,
  setCheck,
  setShowErrorState,
  showErrorState,
}: Props): React.Node {
  const onCheckTypeChange = (newCheckType: AlertCheckType) => {
    setShowErrorState(false);
    switch (newCheckType) {
      case 'THRESHOLD':
        setCheck(DEFAULT_THRESHOLD_CHECK);
        break;
      case 'COMPARATIVE':
        setCheck(DEFAULT_COMPARATIVE_CHECK);
        break;
      default:
        (newCheckType: empty);
        break;
    }
  };

  const onFieldSelect = React.useCallback(
    (item, fieldKey) => {
      const field = item.metadata();
      invariant(
        field.tag === 'FIELD',
        'Leaf hierarchy items can only hold Field models',
      );
      const newCheck = { ...check };
      newCheck[fieldKey] = field.customize();
      setCheck(newCheck);
    },
    [check, setCheck],
  );

  const getIndicatorButtonClassName = (fieldKey: string) =>
    classnames('alert-definition-modal__indicator-dropdown', {
      'alert-definition-modal__indicator-dropdown--error':
        showErrorState && check[fieldKey] === undefined,
    });

  // NOTE(abby): Dynamically refer to the "field" key in the check object so this can be reused
  // for comparison checks.
  const renderSelector = (fieldKey: string): React.Node => {
    return (
      <RelayEnvironmentProvider environment={environment}>
        <React.Suspense fallback={LOADING_SPINNER}>
          <DataCatalogPoweredHierarchicalSelector
            buttonClassName={getIndicatorButtonClassName(fieldKey)}
            defaultDropdownText={I18N.text('Choose indicator')}
            enableSearch
            maxHeight={500}
            onIndicatorSelected={item => onFieldSelect(item, fieldKey)}
            selectedIndicatorItem={Zen.cast<HierarchyItem<Field>>(
              check[fieldKey],
            )}
            showLoadingSpinnerOnButton
          />
        </React.Suspense>
      </RelayEnvironmentProvider>
    );
  };

  const renderCheckLine = (
    label: string,
    index: number,
    component: React.Node,
    id?: string,
  ) => {
    return (
      <Group.Horizontal alignItems="flex-end" flex spacing="m">
        <Group.Item className="alert-definition-modal__condition-number">
          {index}
        </Group.Item>
        <LabelWrapper
          htmlFor={id}
          label={label}
          labelClassName="u-info-text alert-definition-modal__condition-heading"
        >
          {component}
        </LabelWrapper>
      </Group.Horizontal>
    );
  };

  const renderCheckCondition = () => {
    const comparisionDropdown = (
      <Dropdown
        buttonClassName="alert-definition-modal__dropdown"
        buttonWidth={242}
        menuWidth="100%"
        value={check.operation}
        onSelectionChange={newOperation =>
          setCheck({ ...check, operation: newOperation })
        }
      >
        {CHECK_DROPDOWN_OPTIONS}
      </Dropdown>
    );

    switch (check.type) {
      case 'THRESHOLD': {
        const { threshold } = check;
        const numberId = 'threshold';
        const numberInput = (
          <InputText
            className="alert-definition-modal__number-input"
            id={numberId}
            invalid={
              showErrorState && (!threshold || Number.isNaN(Number(threshold)))
            }
            onChange={newThreshold =>
              setCheck({ ...check, threshold: newThreshold })
            }
            placeholder={I18N.text('Input number')}
            value={threshold}
            width="242px"
          />
        );
        return (
          <Group.Vertical
            className="alert-definition-modal__condition-section"
            padding="m"
            spacing="l"
          >
            {renderCheckLine(
              I18N.text('Indicator'),
              1,
              renderSelector('field'),
            )}
            {renderCheckLine(I18N.text('Comparison'), 2, comparisionDropdown)}
            {renderCheckLine(I18N.text('Number'), 3, numberInput, numberId)}
          </Group.Vertical>
        );
      }
      case 'COMPARATIVE':
        return (
          <Group.Vertical
            className="alert-definition-modal__condition-section"
            padding="m"
            spacing="l"
          >
            {renderCheckLine(
              I18N.textById('Indicator'),
              1,
              renderSelector('leftField'),
            )}
            {renderCheckLine(
              I18N.textById('Comparison'),
              2,
              comparisionDropdown,
            )}
            {renderCheckLine(
              I18N.textById('Indicator'),
              3,
              renderSelector('rightField'),
            )}
          </Group.Vertical>
        );
      default:
        (check.type: empty);
        return null;
    }
  };

  return (
    <Group.Vertical
      spacing="m"
      firstItemClassName="alert-definition-modal__heading"
    >
      {I18N.text('Condition')}
      <RadioGroup value={check.type} onChange={onCheckTypeChange}>
        <RadioGroup.Item value="THRESHOLD">
          {I18N.text('Threshold alert')}
        </RadioGroup.Item>
        <RadioGroup.Item value="COMPARATIVE">
          {I18N.text('Comparative alert')}
        </RadioGroup.Item>
      </RadioGroup>
      {renderCheckCondition()}
    </Group.Vertical>
  );
}
