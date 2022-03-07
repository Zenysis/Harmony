// @flow
// NOTE(stephen): This component is built to enable debugging and tweaking of
// the text element style settings by an @zenysis dashboard user. The code was
// put together quickly and should not necessarily be used as an example of high
// quality production code.
import * as React from 'react';

import InputText from 'components/ui/InputText';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import useURLPersistence from 'components/DashboardBuilderApp/DashboardContainer/GridLayoutDebugTools/useURLPersistence';

type TextElementStyle = {
  fontSize: number,
  fontWeight: number,
  lineHeight: number,
  paddingBottom: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
};

const WRAPPER_STYLE = {
  backgroundColor: '#e6fcff',
  padding: 8,
};

const GRID_STYLE = {
  alignItems: 'center',
  display: 'grid',
  gridGap: 4,
  gridTemplateColumns: 'auto auto',
};

// Mapping from HTML element to Carlo's name for it.
const ELEMENT_NAME_MAP = {
  h1: 'title',
  h2: 'h1',
  h3: 'h2',
  p: 'p',
};

// Mapping from JS variable to CSS property.
const PROPERTY_TYPE_MAP = {
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  paddingRight: 'padding-right',
  paddingTop: 'padding-top',
};

function buildTextElementStyle(
  fontSize: number,
  fontWeight: number,
  lineHeight: number,
  paddingTop: number,
  paddingRight: number,
  paddingBottom: number,
  paddingLeft: number,
): TextElementStyle {
  return {
    fontSize,
    fontWeight,
    lineHeight,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
  };
}

// NOTE(stephen): Since the CSS style use a default value for the var, we can't
// query the page styles to get this value. Instead, we just keep it in sync
// since this is a temporary tool.
const DEFAULT_TEXT_ELEMENT_STYLES = {
  h1: buildTextElementStyle(51, 400, 60, 12, 4, 0, 4),
  h2: buildTextElementStyle(29, 600, 36, 48, 4, 12, 4),
  h3: buildTextElementStyle(19, 600, 24, 36, 4, 12, 4),
  p: buildTextElementStyle(15, 400, 24, 12, 4, 12, 4),
};

function TextSizingDebugPanel() {
  // HACK(stephen): Allow users to persist the text overrides that they have set
  // in the URL. Only read the URL once when the component is first loaded, so
  // that we don't reapply the overrides multiple times.
  const [onUpdateURL, initialState] = useURLPersistence(
    '__debugTextOverrides',
    DEFAULT_TEXT_ELEMENT_STYLES,
  );

  const [textOverrides, setTextOverrides] = React.useState(initialState);

  // Whenever the text overrides change, update the CSS variable to use the new
  // value.
  React.useEffect(() => {
    const documentRoot = document.documentElement;
    if (documentRoot === null) {
      return;
    }

    // NOTE(stephen): Applying the variable values even if they haven't changed
    // since it is easier and this component is only for debugging purposes.
    Object.keys(textOverrides).forEach(elementType => {
      const overrides = textOverrides[elementType];
      Object.keys(PROPERTY_TYPE_MAP).forEach(propertyType => {
        const cssProperty = PROPERTY_TYPE_MAP[propertyType];
        const cssVar = `--gd-text-tile-${cssProperty}--${elementType}`;
        const value = `${overrides[propertyType]}`;
        documentRoot.style.setProperty(cssVar, value);
      });
    });
    onUpdateURL(textOverrides);
  }, [onUpdateURL, textOverrides]);

  const setOverride = (elementType, propertyType, valueStr) => {
    const newOverrides = { ...textOverrides };
    newOverrides[elementType][propertyType] = Number.parseFloat(valueStr);
    setTextOverrides(newOverrides);
  };

  // Each tab contains all the overridable css variables for a single text
  // element type (i.e. h1).
  function renderTextOverrideTab(elementType) {
    const elementOverrides = textOverrides[elementType];
    return (
      <Tab name={ELEMENT_NAME_MAP[elementType]}>
        <div style={GRID_STYLE}>
          {Object.keys(PROPERTY_TYPE_MAP).map(propertyType => (
            <React.Fragment key={propertyType}>
              {PROPERTY_TYPE_MAP[propertyType]}
              <InputText
                onChange={v => setOverride(elementType, propertyType, v)}
                type="number"
                value={`${elementOverrides[propertyType]}`}
              />
            </React.Fragment>
          ))}
        </div>
      </Tab>
    );
  }

  return (
    <div style={WRAPPER_STYLE}>
      <Tabs>
        {renderTextOverrideTab('h1')}
        {renderTextOverrideTab('h2')}
        {renderTextOverrideTab('h3')}
        {renderTextOverrideTab('p')}
      </Tabs>
    </div>
  );
}

export default (React.memo(TextSizingDebugPanel): React.AbstractComponent<{}>);
