// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';

type Props = {
  id: string,
  onTagAdd: (name: string) => void,
  onTextChange: (value: string) => void,
  tagInputRef: $ElementRefObject<'input'>,
  tags: $ReadOnlyArray<React.Element<typeof Tag>>,
  value: string,
};

const TAG_SUBMIT_EVENTS = new Set(['Enter', ',', ';']);

function TagInputText({
  id,
  onTagAdd,
  onTextChange,
  tagInputRef,
  tags,
  value,
}: Props): React.Node {
  const onKeyUp = (event: SyntheticKeyboardEvent<HTMLInputElement>) => {
    const inputNode = event.target;
    if (
      inputNode instanceof HTMLInputElement &&
      TAG_SUBMIT_EVENTS.has(event.key)
    ) {
      let text = inputNode.value.trim();
      if (text.endsWith(',') || text.endsWith(';')) {
        text = text.substring(0, text.length - 1);
      }
      if (text !== '') {
        onTagAdd(text);
      }
    }
  };

  const onBlur = (event: SyntheticEvent<HTMLInputElement>) => {
    const inputNode = event.target;
    if (inputNode instanceof HTMLInputElement) {
      const text = inputNode.value.trim();
      if (text !== '') {
        onTagAdd(text);
      }
    }
  };

  const onChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const inputNode = event.target;
    if (inputNode instanceof HTMLInputElement) {
      onTextChange(inputNode.value);
    }
  };

  return (
    <div className="tag-input-text-block" id={id}>
      {tags}
      <input
        ref={tagInputRef}
        className="tag-input-text-block__input"
        onBlurCapture={onBlur}
        onChange={onChange}
        onKeyUp={onKeyUp}
        type="text"
        value={value}
      />
    </div>
  );
}
export default (React.memo(TagInputText): React.AbstractComponent<Props>);
