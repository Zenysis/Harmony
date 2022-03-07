// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props = {
  /**
   * The initial value for the input text
   */
  initialValue: string,

  /**
   * Callback for when a new value is saved
   */
  onValueSave: string => void,

  /** The accessibility name for this input */
  ariaName?: string,

  /**
   * Optional font size prop
   */
  fontSize?: number,

  /**
   * A function to check if the current input value is valid. If not, the value
   * will revert to the previous saved value when the user attempts to save a
   * new value (i.e. onBlur)
   */
  isValidValue?: string => boolean,
};

/**
 * An uncontrolled component that is designed to be used for inline text
 * input. It can be added as part of a sentence in a more visually smooth way
 * than the general [`<InputText>`](#inputtext) component.
 *
 * For other text input use cases (e.g. in a form) use
 * [`<InputText>`](#inputtext)
 */
export default function BorderlessInputText({
  initialValue,
  onValueSave,
  ariaName = undefined,
  fontSize = 14,
  isValidValue = value => value.length > 0,
}: Props): React.Element<'div'> {
  const [lastSavedWidth, setLastSavedWidth] = React.useState<number | void>(
    undefined,
  );
  const [lastSavedValue, setLastSavedValue] = React.useState<string>(
    initialValue,
  );

  const textRef = React.useRef<HTMLDivElement | null>(null);

  const getTextWidth = () => {
    const textElement = textRef.current;
    if (textElement === null) {
      return 0;
    }

    // NOTE(david): We use getBoundingClientRect().width rather than
    // scrollWidth as scrollWidth rounds to the nearest integer which when
    // rounding down can result in the text wrapping
    return Math.ceil(textElement.getBoundingClientRect().width);
  };

  React.useLayoutEffect(() => {
    if (lastSavedWidth === undefined) {
      setLastSavedWidth(getTextWidth());
    }
  }, [lastSavedWidth, setLastSavedWidth]);

  const onBlur = () => {
    const textElement = textRef.current;
    if (textElement instanceof HTMLDivElement) {
      const value = textElement.textContent;
      if (isValidValue(value)) {
        onValueSave(textElement.textContent);
        setLastSavedValue(textElement.textContent);
      } else {
        // We alter the text input directly as a div with contentEditable
        // only respects the child content on the initial render. The
        // alternative, dangerouslySetInnerHTML, is liable to cross site
        // scripting.
        textElement.textContent = lastSavedValue;
      }
    }

    setLastSavedWidth(getTextWidth());
  };

  return (
    <div
      className="zen-borderless-input-text"
      style={{ minWidth: lastSavedWidth }}
    >
      <div
        aria-label={normalizeARIAName(ariaName)}
        className="zen-borderless-input-text__text"
        contentEditable
        onBlur={onBlur}
        role="textbox"
        style={{ fontSize }}
        suppressContentEditableWarning
        ref={textRef}
      >
        {initialValue}
      </div>
    </div>
  );
}
