// @flow
import * as React from 'react';

import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Tag from 'components/ui/Tag';
import TextArea from 'components/common/TextArea';
import UnicodeSymbolButton from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/TransformedTextBlock/UnicodeSymbolButton';

type Props = {
  onTextValueChange: (transformedText: string | void) => void,
  transformedText: string | void,
};

function TransformedTextBlock({
  onTextValueChange,
  transformedText,
}: Props): React.Node {
  const [anchorElt, setAnchorElt] = React.useState(null);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [textValue, setTextValue] = React.useState(transformedText || '');
  const popoverAnchorRef = React.useRef();

  const onOpenTranformPopoverClick = () => {
    if (popoverAnchorRef.current) {
      setAnchorElt(popoverAnchorRef.current);
      setPopoverOpen(!popoverOpen);
    }
  };

  const onRequestClose = () => {
    setTextValue('');
    setPopoverOpen(false);
  };

  const onUnicodeSymbolClicked = (symbol: string) => {
    setTextValue(`${textValue} ${symbol}`);
  };

  const onApplyButtonClicked = () => {
    setPopoverOpen(!popoverOpen);
    onTextValueChange(textValue);
  };

  const onClearTransformedText = () => {
    setTextValue('');
    onTextValueChange(undefined);
  };

  return (
    <React.Fragment>
      {transformedText ? (
        <div ref={popoverAnchorRef}>
          <Tag.Simple
            className="transformed-text-block__tag"
            onClick={onOpenTranformPopoverClick}
            onRequestRemove={onClearTransformedText}
            removable
          >
            <div className="transformed-text-block__tag--content">
              {transformedText}
            </div>
          </Tag.Simple>
        </div>
      ) : (
        <div
          ref={popoverAnchorRef}
          className="transformed-text-block__text-btn"
          onClick={onOpenTranformPopoverClick}
          role="button"
        >
          <I18N>Replace value</I18N>
        </div>
      )}

      <Popover
        anchorElt={anchorElt}
        className="transformed-text-block"
        isOpen={popoverOpen}
        keepInWindow
        onRequestClose={onRequestClose}
      >
        <Group.Vertical padding="s">
          {I18N.text('Replacing value with...', 'replaceText')}
          <TextArea
            className="transformed-text-block__textarea"
            maxHeight={70}
            maxRows={4}
            minHeight={70}
            onChange={setTextValue}
            placeholder={I18N.text(
              'Text entered here will replace indicator values.',
              'valuePlaceholder',
            )}
            rows={4}
            value={textValue}
          />
          <Group.Horizontal>
            <I18N>Add symbols:</I18N>
            <UnicodeSymbolButton onClick={onUnicodeSymbolClicked} symbol="✔" />
            <UnicodeSymbolButton onClick={onUnicodeSymbolClicked} symbol="✅" />
            <UnicodeSymbolButton onClick={onUnicodeSymbolClicked} symbol="✖" />
            <UnicodeSymbolButton onClick={onUnicodeSymbolClicked} symbol="❎" />
            <UnicodeSymbolButton onClick={onUnicodeSymbolClicked} symbol="❌" />
          </Group.Horizontal>
        </Group.Vertical>
        <FullButton
          className="transformed-text-block__apply-button"
          onClick={onApplyButtonClicked}
        >
          <I18N>Apply</I18N>
        </FullButton>
      </Popover>
    </React.Fragment>
  );
}

export default (React.memo<Props>(
  TransformedTextBlock,
): React.AbstractComponent<Props>);
