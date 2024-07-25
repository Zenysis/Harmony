Glyphicon examples:

```jsx
<>
  <Icon type="search" />
  <Icon type="ok" />
  <Icon type="remove" />
  <Icon type="zoom-in" />
  <Icon type="user" />
</>
```

SVG icons. Hover over each icon to see its name.

```jsx
import Tooltip from 'components/ui/Tooltip';
import { SVG_MAP } from 'components/ui/Icon/internal/SVGs';
import { MAP_VISUALIZATION_SVG_MAP } from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons';
import { VISUALIZATIONS_SVG_MAP } from 'components/ui/Icon/internal/SVGs/VisualizationIcons';

<>
  {Object.keys(SVG_MAP).map(svgKey => {
    if (
      svgKey in MAP_VISUALIZATION_SVG_MAP ||
      svgKey in VISUALIZATIONS_SVG_MAP
    ) {
      return null;
    }

    return (
      <Tooltip key={svgKey} content={svgKey}>
        <Icon
          style={{ width: '24px', height: '24px', margin: '4px' }}
          type={svgKey}
        />
      </Tooltip>
    );
  })}
</>;
```

Visualization SVG icons:

```jsx
import Tooltip from 'components/ui/Tooltip';
import { VISUALIZATIONS_SVG_MAP } from 'components/ui/Icon/internal/SVGs/VisualizationIcons';

<>
  {Object.keys(VISUALIZATIONS_SVG_MAP).map(svgKey => {
    return (
      <Tooltip key={svgKey} content={svgKey}>
        <Icon style={{ margin: '4px' }} type={svgKey} />
      </Tooltip>
    );
  })}
</>;
```

Visualization SVG icon color can be customized using the `color` style attribute. Here they are in gray:

```jsx
import Tooltip from 'components/ui/Tooltip';
import { VISUALIZATIONS_SVG_MAP } from 'components/ui/Icon/internal/SVGs/VisualizationIcons';
const style = { color: '#BFC2C9', margin: '4px' };

<>
  {Object.keys(VISUALIZATIONS_SVG_MAP).map(svgKey => {
    return (
      <Tooltip key={svgKey} content={svgKey}>
        <Icon style={style} type={svgKey} />
      </Tooltip>
    );
  })}
</>;
```
