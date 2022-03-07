// @flow
import * as React from 'react';
import classNames from 'classnames';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import IconButton from 'components/ui/IconButton';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import Popover from 'components/ui/Popover';
import Spacing from 'components/ui/Spacing';
import RadioGroup from 'components/ui/RadioGroup';

import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  autoplayDelay: number,
  onAutoplayDelayChange: number => void,
};

const AUTOPLAY_DELAY_OPTIONS = [
  { value: 15000, text: '15' },
  { value: 30000, text: '30' },
  { value: 45000, text: '45' },
  { value: 60000, text: '60' },
];

function OptionsButton({ autoplayDelay, onAutoplayDelayChange }: Props) {
  const [showPopover, openPopover, closePopover] = useBoolean(false);
  const [anchorElt, setAnchorElt] = React.useState(null);

  const onButtonClick = React.useCallback(event => {
    setAnchorElt(event.currentTarget);
    openPopover();
  });

  return (
    <React.Fragment>
      <Button.Unstyled
        className="gd-fullscreen-tile__button"
        onClick={onButtonClick}
      >
        <Group.Horizontal flex spacing="xxs">
          <I18N>Options</I18N>
          <Icon type="svg-caret-down" />
        </Group.Horizontal>
      </Button.Unstyled>
      <Popover
        anchorElt={anchorElt}
        isOpen={showPopover}
        onRequestClose={closePopover}
      >
        <LabelWrapper label={I18N.text('Play timer (delay in seconds)')}>
          <RadioGroup
            direction="vertical"
            value={autoplayDelay}
            onChange={onAutoplayDelayChange}
          >
            {AUTOPLAY_DELAY_OPTIONS.map(option => (
              <RadioGroup.Item key={option.value} value={option.value}>
                {option.text}
              </RadioGroup.Item>
            ))}
          </RadioGroup>
        </LabelWrapper>
      </Popover>
    </React.Fragment>
  );
}

export default (React.memo(OptionsButton): React.AbstractComponent<Props>);
