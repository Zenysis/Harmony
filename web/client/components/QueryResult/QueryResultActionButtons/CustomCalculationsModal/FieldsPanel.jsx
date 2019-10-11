// @flow
import * as React from 'react';

import CustomField from 'models/core/Field/CustomField';
import Field from 'models/core/Field';
import InfoTooltip from 'components/ui/InfoTooltip';
import Tag from 'components/ui/Tag';

// TODO(catherine): Remove once this feature is
// ready to be launched to production
// Toggle here to see dropdown
const TEST_RENDER_DROPDOWN_ARROW: boolean = true;

type Props = {
  fields: $ReadOnlyArray<Field>,
  onFieldClick: (value: Field) => void,
  onRequestViewCustomField: (
    value: CustomField,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
  title: string,

  customFieldErrorState: { +[string]: boolean },
  emptyFieldsContent: string,
  tooltip?: string,
};

export default class FieldsPanel extends React.PureComponent<Props> {
  static defaultProps = {
    customFieldErrorState: {},
    emptyFieldsContent: '',
    tooltip: undefined,
  };

  renderTitle() {
    const { tooltip, title } = this.props;
    const titleTooltip = tooltip ? <InfoTooltip text={tooltip} /> : null;
    return (
      <div className="custom-calculations-modal__panel-title">
        {title}
        {titleTooltip}
      </div>
    );
  }

  renderPanelBody() {
    const tags = this.props.fields.map(field => {
      const isCustomField = field instanceof CustomField;
      const isInvalidCustomField = this.props.customFieldErrorState[field.id()];
      let tagType = Tag.Intents.PRIMARY;
      if (isCustomField) {
        tagType = isInvalidCustomField
          ? Tag.Intents.DANGER
          : Tag.Intents.SUCCESS;
      }

      return (
        <Tag
          key={field.id()}
          className="custom-calculations-fields-panel__field-tag"
          value={field}
          intent={tagType}
          onClick={
            isCustomField && TEST_RENDER_DROPDOWN_ARROW
              ? this.props.onFieldClick
              : this.props.onFieldClick
          }
          hasPrimaryAction={isCustomField && TEST_RENDER_DROPDOWN_ARROW}
          onPrimaryAction={
            isCustomField && TEST_RENDER_DROPDOWN_ARROW
              ? this.props.onRequestViewCustomField
              : undefined
          }
          primaryActionIconType="chevron-down"
          size={Tag.Sizes.SMALL}
          testId="custom-calc-tag"
        >
          {field.label()}
        </Tag>
      );
    });

    const content = tags.length === 0 ? this.props.emptyFieldsContent : tags;
    return (
      <div className="custom-calculations-fields-panel__body">{content}</div>
    );
  }

  render() {
    return (
      <div className="custom-calculations-fields-panel">
        {this.renderTitle()}
        {this.renderPanelBody()}
      </div>
    );
  }
}
