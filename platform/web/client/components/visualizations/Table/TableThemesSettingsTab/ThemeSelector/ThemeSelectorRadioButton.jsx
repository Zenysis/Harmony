// @flow
import * as React from 'react';
import classNames from 'classnames';

import LabelWrapper from 'components/ui/LabelWrapper';
import Spacing from 'components/ui/Spacing';
import type { ThemeId } from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';

type Props = {
  className: string | void,
  imageUrl: string,
  isSelected: boolean,
  label: string,
  onClick: () => void,
  themeId: ThemeId,
};

export default function ThemeSelectorRadioButton({
  className,
  imageUrl,
  isSelected,
  label,
  onClick,
  themeId,
}: Props): React.Node {
  const buttonClassName = classNames(
    'table-themes-settings-tab__theme-selector-radio-button',
    {
      'table-themes-settings-tab__theme-selector-radio-button--active': isSelected,
    },
  );

  return (
    <Spacing key={themeId} className={className} marginTop="l">
      <LabelWrapper label={label}>
        <div
          aria-checked={isSelected}
          className={buttonClassName}
          onClick={onClick}
          role="radio"
        >
          <img
            alt=""
            className="table-themes-settings-tab__theme-selector-thumbnail"
            src={imageUrl}
          />
        </div>
      </LabelWrapper>
    </Spacing>
  );
}
