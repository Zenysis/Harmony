// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';

type Props = {
  onChange: string => void,
};

function SearchBox({ onChange }: Props) {
  return (
    <div className="map-query-result-search-box hide-on-export">
      <InputText.Uncontrolled
        className="map-query-result-search-box__input"
        debounce
        debounceTimeoutMs={50}
        initialValue=""
        onChange={onChange}
        placeholder={I18N.text('Filter results')}
      />
    </div>
  );
}

export default (React.memo(SearchBox): React.AbstractComponent<Props>);
