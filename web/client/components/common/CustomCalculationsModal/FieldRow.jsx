// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Tag from 'components/ui/Tag';

type Props = {
  count: number | void,
  id: string,
  isCustomField: boolean,
  isInvalidCustomField: boolean,
  label: string,
  onFieldClick: string => void,
  onRequestViewCustomField: (
    fieldId: string,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
};
export default function FieldRow({
  count,
  id,
  isCustomField,
  isInvalidCustomField,
  label,
  onFieldClick,
  onRequestViewCustomField,
}: Props): React.Node {
  let tagType = Tag.Intents.PRIMARY;
  if (isCustomField) {
    tagType = isInvalidCustomField ? Tag.Intents.DANGER : Tag.Intents.SUCCESS;
  }

  return (
    <Group.Horizontal
      alignItems="center"
      flex
      firstItemFlexValue={1}
      spacing="xs"
    >
      <Tag
        key={id}
        id={id}
        className="custom-calculations-fields-panel__field-tag"
        value={id}
        intent={tagType}
        onClick={onFieldClick}
        hasPrimaryAction={isCustomField}
        onPrimaryAction={onRequestViewCustomField}
        primaryActionIconType="chevron-down"
        size={Tag.Sizes.SMALL}
        testId="custom-calc-tag"
      >
        {label}
      </Tag>

      <div
        className={
          count
            ? 'custom-calculations-fields-panel__field-count--active'
            : 'custom-calculations-fields-panel__field-count'
        }
      >
        {count}
      </div>
    </Group.Horizontal>
  );
}
