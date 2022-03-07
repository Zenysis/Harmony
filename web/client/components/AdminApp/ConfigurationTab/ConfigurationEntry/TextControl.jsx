// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import { uniqueId } from 'util/util';
import type Configuration from 'services/models/Configuration';

type Props = {
  configuration: Configuration,
  updateLocalConfiguration: (configuration: Configuration) => void,
  label?: string,
  width?: string | number,
};

export default function TextControl({
  configuration,
  updateLocalConfiguration,
  label = undefined,
  width = '50%',
}: Props): React.Element<'div'> {
  const onTextEntered = React.useCallback(
    (inputtedText: string) => {
      updateLocalConfiguration(configuration.value(inputtedText));
    },
    [configuration, updateLocalConfiguration],
  );

  const controlClassName = `configuration-tab__text configuration-tab__text__${configuration.key()}`;
  const inputId = `text_control__${uniqueId()}`;

  const inputElt = (
    <InputText
      className={controlClassName}
      id={inputId}
      onChange={onTextEntered}
      value={configuration.value()}
      width={width}
    />
  );

  return (
    <div className="configuration-tab__row">
      {label !== undefined ? (
        <LabelWrapper label={label} inline htmlFor={inputId}>
          {inputElt}
        </LabelWrapper>
      ) : (
        inputElt
      )}
    </div>
  );
}
