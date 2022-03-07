// @flow
import * as React from 'react';
import invariant from 'invariant';

import Toaster from 'components/ui/Toaster';
import usePrevious from 'lib/hooks/usePrevious';
import { noop } from 'util/util';

type Props = {
  initialValue: string,
  selectAllBeforeEditing: boolean,

  enableEditing?: boolean,
  isValidName?: string => { isValid: boolean, rationale: string },
  onRenameComplete?: string => void,
};

/**
 * Component for editing a tab name inline with minimal changes to the
 * surrounding layout. Prefer a contenteditable span instead of an input element
 * so that the input box appears to grow and collapse as a user types.
 */
function EditableTabName({
  initialValue,
  selectAllBeforeEditing,
  enableEditing = false,
  isValidName = noop,
  onRenameComplete = noop,
}: Props) {
  const spanRef = React.useRef();
  const prevEnableEditing = usePrevious(enableEditing);

  /**
   * Publicly accessible function so that the parent can focus the input by
   * using a ref to this component.
   */
  const focusInput = () => {
    if (spanRef.current) {
      const editableElt = spanRef.current;
      window.getSelection().selectAllChildren(editableElt);
      editableElt.focus();
    }
  };

  React.useEffect(() => {
    if (enableEditing && !prevEnableEditing && selectAllBeforeEditing) {
      focusInput();
    }
  });

  const onBlur = () => {
    if (enableEditing) {
      window.getSelection().removeAllRanges();

      const { current } = spanRef;
      invariant(current, 'Not possible to have a null ref during onBlur.');
      const newName = current.innerText || '';
      const { isValid, rationale } = isValidName(newName);
      if (isValid) {
        onRenameComplete(newName);
      } else {
        Toaster.error(rationale);
        focusInput();
      }
    }
  };

  const onKeyDown = (event: SyntheticKeyboardEvent<HTMLSpanElement>) => {
    const { key } = event;
    const { current } = spanRef;
    invariant(current, 'Not possible to have a null ref during onKeyDown.');

    // If the escape key is pressed, reset the edited name to the initial value.
    if (key === 'Escape') {
      event.preventDefault();
      current.innerText = initialValue;
      onBlur();
    } else if (key === 'Enter') {
      // If the user presses enter, commit the change and remove focus.
      event.preventDefault();
      onBlur();
    }
  };

  const className = enableEditing
    ? 'editable-tag-name editable-tag-name--active'
    : 'editable-tag-name editable-tag-name--inactive';
  return (
    <span
      ref={spanRef}
      className={className}
      contentEditable={enableEditing ? 'true' : 'false'}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      role="textbox"
      suppressContentEditableWarning
    >
      {initialValue}
    </span>
  );
}
export default (React.memo(EditableTabName): React.AbstractComponent<Props>);
