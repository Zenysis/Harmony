// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import PageSelector from 'components/ui/PageSelector';

const FOOTER_HEIGHT = 38;

type Props = {
  currentPage: number,
  enablePagination: boolean,
  enableSearch: boolean,
  initialSearchText: string,
  onPageChange: number => void,
  onSearchTextChange: string => void,
  pageSize: number,
  resultCount: number,
};

export default function Footer({
  currentPage,
  enablePagination,
  enableSearch,
  initialSearchText,
  onPageChange,
  onSearchTextChange,
  pageSize,
  resultCount,
}: Props): React.Node {
  return (
    <div
      className="ui-table-visualization__footer"
      style={{ height: FOOTER_HEIGHT }}
    >
      {enableSearch && (
        <InputText.Uncontrolled
          className="ui-table-visualization__search-box hide-on-export"
          debounce
          debounceTimeoutMs={30}
          initialValue={initialSearchText}
          onChange={onSearchTextChange}
          placeholder={I18N.text('Search')}
        />
      )}
      {enablePagination && (
        <PageSelector
          currentPage={currentPage}
          onPageChange={onPageChange}
          pageSize={pageSize}
          resultCount={resultCount}
        />
      )}
    </div>
  );
}
