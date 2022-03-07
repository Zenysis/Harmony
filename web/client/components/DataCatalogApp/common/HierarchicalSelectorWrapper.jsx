// @flow
import * as React from 'react';

import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Heading from 'components/ui/Heading';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import I18N from 'lib/I18N';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  ...React.ElementConfig<typeof HierarchicalSelector>,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onApplyButtonClick: (event: SyntheticEvent<HTMLButtonElement>) => void,

  applyButtonText?: string,
  disableApplyButton?: boolean,
};

// A wrapper component that contains the hierarchical selector and an apply
// button that lets you select categories.
export default function HierarchicalSelectorWrapper({
  hierarchyRoot,
  onApplyButtonClick,
  applyButtonText = I18N.text('Apply', 'apply'),
  disableApplyButton = false,
  ...passThroughProps
}: Props): React.Element<typeof HierarchicalSelector> {
  const renderApplyButton = React.useCallback(() => {
    return (
      <FullButton
        ariaName={applyButtonText}
        disabled={disableApplyButton}
        onClick={onApplyButtonClick}
      >
        <Heading.Small whiteText>{applyButtonText}</Heading.Small>
      </FullButton>
    );
  }, [applyButtonText, disableApplyButton, onApplyButtonClick]);
  return (
    <HierarchicalSelector
      footer={renderApplyButton()}
      hierarchyRoot={hierarchyRoot}
      maxHeight={400}
      maxWidth={1000}
      {...passThroughProps}
    />
  );
}
