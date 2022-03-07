// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';

type Props = {
  onChange: string => void,
};

const TEXT = t('visualizations.MapViz.QueryResultLayer.SearchBox');

function SearchBox({ onChange }: Props) {
  return (
    <div className="map-query-result-search-box hide-on-export">
      <InputText.Uncontrolled
        className="map-query-result-search-box__input"
        debounce
        debounceTimeoutMs={50}
        initialValue=""
        onChange={onChange}
        placeholder={TEXT.placeholder}
      />
    </div>
  );
}

export default (React.memo(SearchBox): React.AbstractComponent<Props>);
