// @flow
import * as React from 'react';

import Card from 'components/ui/Card';
import DataQuality from 'models/DataQualityApp/DataQuality';
import DataQualityService from 'services/wip/DataQualityService';
import Field from 'models/core/Field';
import FieldInfoService from 'services/FieldInfoService';
import FieldService from 'services/wip/FieldService';
import SelectionsRow from 'components/QueryApp/QueryForm/SelectionsRow';
import autobind from 'decorators/autobind';
import type { FieldInfo } from 'services/FieldInfoService';

type Props = {
  fields: $ReadOnlyArray<Field>,
  onRemoveClick: (fieldId: string) => void,
  title: string,
};

type State = {
  fieldIdsToDataQuality: { [fieldID: string]: DataQuality },
  fieldIdsToInfo: { [fieldID: string]: FieldInfo } | void,
};

const ENABLE_DATA_QUALITY = window.__JSON_FROM_BACKEND.ui.enableDataQualityLab;

export default class SelectionsPanel extends React.Component<Props, State> {
  state = {
    fieldIdsToDataQuality: {},
    fieldIdsToInfo: undefined,
  };

  @autobind
  componentDidMount() {
    this.fetchFieldInfo();
    this.fetchDataQuality();
  }

  @autobind
  componentDidUpdate(prevProps: Props) {
    if (prevProps.fields !== this.props.fields) {
      this.fetchFieldInfo();
      this.fetchDataQuality();
    }
  }

  fetchFieldInfo() {
    const { fields } = this.props;
    const fieldIds = Field.pullIds(fields);
    if (!fieldIds || fieldIds.length < 1) {
      return;
    }

    FieldInfoService.fetchMultiple(fieldIds).then(data => {
      this.setState({
        fieldIdsToInfo: data,
      });
    });
  }

  fetchDataQuality() {
    const { fields } = this.props;

    if (ENABLE_DATA_QUALITY) {
      fields.forEach(field =>
        // The DataQualityService depends on using the new Field Model as opposed
        // to the legacy model used elsewhere in this component
        FieldService.get(field.id()).then(newFieldModel =>
          DataQualityService.getOverallQuality(newFieldModel).then(
            dataQuality => {
              this.setState(prevState => {
                const { fieldIdsToDataQuality } = prevState;
                fieldIdsToDataQuality[field.id()] = dataQuality;
                return { fieldIdsToDataQuality };
              });
            },
          ),
        ),
      );
    }
  }

  @autobind
  onRemoveClick(field: Field) {
    this.props.onRemoveClick(field.id());
  }

  @autobind
  renderFieldRow(field: Field) {
    const { fieldIdsToDataQuality, fieldIdsToInfo } = this.state;
    const fieldInfo =
      fieldIdsToInfo !== undefined ? fieldIdsToInfo[field.id()] : null;

    return (
      <SelectionsRow
        key={field.id()}
        dataQuality={fieldIdsToDataQuality[field.id()]}
        field={field}
        fieldInfo={fieldInfo}
        onRemoveClick={this.onRemoveClick}
      />
    );
  }

  render() {
    if (this.props.fields.length === 0) {
      return null;
    }

    const fieldRows = this.props.fields.map(this.renderFieldRow);
    return (
      <Card
        title={this.props.title}
        className="query-form-selections-panel"
        headingBackground="offwhite"
      >
        {fieldRows}
      </Card>
    );
  }
}
