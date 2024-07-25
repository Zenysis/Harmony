// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import { noop } from 'util/util';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props<T> = {
  column: ColumnSpec,
  hierarchyRoot: HierarchyItem<T>,
  onItemSelect: (item: HierarchyItem<T>) => void,
  selectorTitle: string,
};

export default function MatchSelector<T: NamedItem>({
  column,
  hierarchyRoot,
  onItemSelect,
  selectorTitle,
}: Props<T>): React.Node {
  const button = (
    <div
      className="data-upload-matching-card__match-selector-button"
      id="selector-button"
    >
      {column.match() ? column.canonicalName() : I18N.text('None selected')}
    </div>
  );

  function columnTitleGenerator(item: HierarchyItem<NamedItem>): string {
    return item.isHierarchyRoot() ? selectorTitle : item.name();
  }

  return (
    <React.Fragment>
      <LabelWrapper
        className="data-upload-matching-card__match-selector"
        htmlFor="selector-button"
        inline
        label={I18N.text('Match with')}
        labelClassName="u-info-text data-upload-matching-card__match-selector-label"
      >
        <QueryPartSelector
          button={button}
          closeOnSelect
          columnTitleGenerator={columnTitleGenerator}
          enableSearch
          hierarchyRoot={hierarchyRoot}
          onItemSelect={onItemSelect}
          onMenuOpen={noop}
        />
      </LabelWrapper>
    </React.Fragment>
  );
}
