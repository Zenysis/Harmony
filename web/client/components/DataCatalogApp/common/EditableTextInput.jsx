// @flow
import * as React from 'react';

import MultiLineText from 'components/DataCatalogApp/common/MultiLineText';
import { noop } from 'util/util';

type Props = {
  currentValueRef: { current: string },
  editing: boolean,
  initialValue: string,

  multiline?: boolean,
  onBlur?: () => void,
};

type EventType = SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>;

// The `EditableTextInput` component is an uncontrolled component. The current
// value of the input text box can be retrieved by the parent through the
// `currentValueRef` prop. An uncontrolled component is a simpler interface
// for DataCatalog components to use since they don't need to handle debouncing
// or storage of the current value via callbacks.
function EditableTextInput({
  currentValueRef,
  editing,
  initialValue,

  onBlur = noop,
  multiline = false,
}: Props) {
  const [currentValue, setCurrentValue] = React.useState(initialValue);

  // Make sure the current value ref is always up-to-date.
  // eslint-disable-next-line no-param-reassign
  currentValueRef.current = currentValue;

  // If the initial value changes or the editing state changes, reset.
  React.useEffect(() => {
    setCurrentValue(initialValue);
  }, [editing, initialValue]);

  // NOTE(stephen): Debouncing is not necessary here since this component is
  // uncontrolled.
  const onValueChange = React.useCallback(({ target }: EventType) => {
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      )
    ) {
      return;
    }
    setCurrentValue(target.value);
  }, []);

  if (!editing) {
    return (
      <div className="editable-text-input__text">
        {multiline ? <MultiLineText text={initialValue} /> : initialValue}
      </div>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';
  const className = multiline ? 'editable-text-input--input-textarea' : '';
  return (
    <InputComponent
      autoComplete="off"
      className={`editable-text-input ${className}`}
      spellCheck={false}
      onBlur={onBlur}
      onChange={onValueChange}
      value={currentValue}
    />
  );
}

export default (React.memo<Props>(
  EditableTextInput,
): React.AbstractComponent<Props>);
