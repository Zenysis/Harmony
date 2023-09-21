// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LegacyButton from 'components/ui/LegacyButton';
import Popover from 'components/ui/Popover';
import Tag from 'components/ui/Tag';
import useBoolean from 'lib/hooks/useBoolean';

export type FieldTagData = {
  endIndex: number,
  fieldId: string,
  lineNumber: number,
  startIndex: number,
};

type Props = {
  endIndex: number,
  fieldId: string,
  label: string,
  lineNumber: number,
  onRemoveClick: FieldTagData => void,
  onUpdateFieldConfiguration: (
    fieldId: string,
    treatNoDataAsZero: boolean,
  ) => void,
  startIndex: number,
  treatNoDataAsZero: boolean,
};

/**
 * The field tag that gets rendered in the FormulaEditor.
 */
function FormulaFieldTag({
  endIndex,
  fieldId,
  label,
  lineNumber,
  onRemoveClick,
  onUpdateFieldConfiguration,
  startIndex,
  treatNoDataAsZero,
}: Props): React.Node {
  const [isPopoverOpen, showPopover, closePopover] = useBoolean(false);
  const tagData = {
    endIndex,
    fieldId,
    lineNumber,
    startIndex,
  };

  const renderTag = () => (
    <Tag
      onClick={showPopover}
      onRequestRemove={onRemoveClick}
      removable
      size={Tag.Sizes.SMALL}
      value={tagData}
    >
      {label}
    </Tag>
  );

  return (
    <Popover
      anchorElt={renderTag}
      anchorOrigin="bottom left"
      isOpen={isPopoverOpen}
      onRequestClose={closePopover}
      popoverOrigin="top left"
    >
      <Group.Vertical flex lastItemStyle={{ alignSelf: 'flex-end' }}>
        <Checkbox
          label={I18N.text("Treat 'No data' as 0 in calculation")}
          onChange={val => onUpdateFieldConfiguration(fieldId, val)}
          value={treatNoDataAsZero}
        />
        <LegacyButton onClick={closePopover}>
          {I18N.textById('Close')}
        </LegacyButton>
      </Group.Vertical>
    </Popover>
  );
}

export default (React.memo(FormulaFieldTag): React.AbstractComponent<Props>);
