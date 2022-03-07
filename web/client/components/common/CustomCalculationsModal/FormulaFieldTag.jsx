// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import LegacyButton from 'components/ui/LegacyButton';
import Popover from 'components/ui/Popover';
import Tag from 'components/ui/Tag';
import useBoolean from 'lib/hooks/useBoolean';

export type FieldTagData = {
  fieldId: string,
  lineNumber: number,
  startIndex: number,
  endIndex: number,
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

const TEXT = t('QueryApp.CustomCalculationsModal.FormulaFieldTag');

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
    lineNumber,
    endIndex,
    startIndex,
    fieldId,
  };

  const renderTag = () => (
    <Tag
      value={tagData}
      removable
      onClick={showPopover}
      onRequestRemove={onRemoveClick}
      size={Tag.Sizes.SMALL}
    >
      {label}
    </Tag>
  );

  return (
    <Popover
      anchorElt={renderTag}
      isOpen={isPopoverOpen}
      onRequestClose={closePopover}
      anchorOrigin="bottom left"
      popoverOrigin="top left"
    >
      <Group.Vertical flex lastItemStyle={{ alignSelf: 'flex-end' }}>
        <Checkbox
          value={treatNoDataAsZero}
          label={TEXT.noDataAsZeroLabel}
          onChange={val => onUpdateFieldConfiguration(fieldId, val)}
        />
        <LegacyButton onClick={closePopover}>{TEXT.close}</LegacyButton>
      </Group.Vertical>
    </Popover>
  );
}

export default (React.memo(FormulaFieldTag): React.AbstractComponent<Props>);
