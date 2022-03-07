// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import FieldRow from 'components/common/CustomCalculationsModal/FieldRow';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import Group from 'components/ui/Group';
import InfoTooltip from 'components/ui/InfoTooltip';
import { autobind, memoizeOne } from 'decorators';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { FieldShape } from 'models/core/Field/CustomField/Formula/FormulaMetadata';

type DefaultProps = {
  customFieldErrorState: { +[string]: boolean, ... },
  emptyFieldsContent: string,
  tooltip?: string,
};

type Props = {
  ...DefaultProps,
  customFields: $ReadOnlyArray<CustomField>,
  currentFormulaMetadata: FormulaMetadata,
  onFieldClick: (fieldId: string) => void,
  onRequestViewCustomField: (
    value: CustomField,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
  seriesSettings: SeriesSettings,
  title: string,
};

export default class FieldsPanel extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    customFieldErrorState: {},
    emptyFieldsContent: '',
    tooltip: undefined,
  };

  // The field display order should go:
  // 1) all non-custom fields, in the SeriesSettings order
  // 2) all custom fields in the order they were added.
  @memoizeOne
  buildFieldOrder(
    customFields: $ReadOnlyArray<CustomField>,
    seriesObjects: { +[string]: QueryResultSeries, ... },
    seriesOrder: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<{ custom: boolean, id: string, label: string }> {
    const nonCustomFieldData = [];
    const customFieldData = customFields.map(f => ({
      custom: true,
      id: f.id(),
      label: seriesObjects[f.id()].label(),
    }));

    seriesOrder.forEach(fieldId => {
      const isCustomField = !!customFieldData.find(f => f.id === fieldId);
      if (!isCustomField) {
        nonCustomFieldData.push({
          custom: false,
          id: fieldId,
          label: seriesObjects[fieldId].label(),
        });
      }
    });

    return nonCustomFieldData.concat(customFieldData);
  }

  getFieldOrder(): $ReadOnlyArray<{
    custom: boolean,
    id: string,
    label: string,
  }> {
    const { customFields, seriesSettings } = this.props;
    return this.buildFieldOrder(
      customFields,
      seriesSettings.seriesObjects(),
      seriesSettings.seriesOrder(),
    );
  }

  /**
   * Build a structure that maps each available field ID to how many times
   * it is being used in the current formula being edited. Don't include ID
   * if it is not being used at all.
   */
  @memoizeOne
  buildFieldCount(
    fields: Zen.Array<FieldShape>,
  ): { [fieldId: string]: number } {
    const fieldCountMap = {};
    fields.forEach(field => {
      const fieldId = field.id();
      if (fieldCountMap[fieldId] === undefined) {
        fieldCountMap[fieldId] = 1;
      } else {
        fieldCountMap[fieldId] += 1;
      }
    });
    return fieldCountMap;
  }

  getFieldCount(): { [fieldId: string]: number } {
    return this.buildFieldCount(this.props.currentFormulaMetadata.fields());
  }

  @autobind
  onRequestViewCustomField(
    fieldId: string,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) {
    const { customFields, onRequestViewCustomField } = this.props;
    const customField = customFields.find(f => f.id() === fieldId);
    if (customField === undefined) {
      return;
    }

    onRequestViewCustomField(customField, event);
  }

  renderTitle(): React.Node {
    const { tooltip, title } = this.props;
    const titleTooltip = tooltip ? <InfoTooltip text={tooltip} /> : null;
    return (
      <div className="custom-calculations-modal__panel-title">
        {title}
        {titleTooltip}
      </div>
    );
  }

  renderPanelBody(): React.Node {
    const { customFieldErrorState, onFieldClick } = this.props;
    const fieldCountMap = this.getFieldCount();
    const tags = this.getFieldOrder().map(({ custom, id, label }) => {
      const isInvalidCustomField = customFieldErrorState[id];
      return (
        <FieldRow
          key={id}
          count={fieldCountMap[id]}
          id={id}
          isCustomField={custom}
          isInvalidCustomField={isInvalidCustomField}
          label={label}
          onFieldClick={onFieldClick}
          onRequestViewCustomField={this.onRequestViewCustomField}
        />
      );
    });

    const content = tags.length === 0 ? this.props.emptyFieldsContent : tags;
    return (
      <Group.Vertical
        paddingTop="xs"
        paddingBottom="xs"
        spacing="xs"
        className="custom-calculations-fields-panel__body"
      >
        {content}
      </Group.Vertical>
    );
  }

  render(): React.Node {
    return (
      <div className="custom-calculations-fields-panel">
        {this.renderTitle()}
        {this.renderPanelBody()}
      </div>
    );
  }
}
