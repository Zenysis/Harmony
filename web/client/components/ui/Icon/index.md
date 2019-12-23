Glyphicon examples:

```jsx
<Icon type="search" />
<Icon type="ok" />
<Icon type="remove" />
<Icon type="zoom-in" />
<Icon type="user" />
```

SVG icons
```jsx
<Icon type="svg-analyze" />
<Icon type="svg-birthday-cake" />
<Icon type="svg-calendar" />
<Icon type="svg-drag-indicator" />
<Icon type="svg-globe" />
<Icon type="svg-question-mark" />
<Icon type="svg-repeat" />
<Icon type="svg-trending-down" />
<Icon type="svg-trending-up" />
```

Visualization SVG icons:
```jsx
<Icon type="svg-bar-graph-visualization" />
<Icon type="svg-bar-line-visualization" />
<Icon type="svg-heat-tiles-visualization" />
<Icon type="svg-hierarchy-visualization" />
<Icon type="svg-line-graph-visualization" />
<Icon type="svg-map-visualization" />
<Icon type="svg-ranking-visualization" />
<Icon type="svg-scatterplot-visualization" />
<Icon type="svg-stacked-bar-graph-visualization" />
<Icon type="svg-sunburst-visualization" />
<Icon type="svg-table-visualization" />
```

Visualization SVG icon color can be customized using the `color` style attribute. Here they are in gray:
```jsx
const style = { color: '#BFC2C9' };
<>
  <Icon style={style} type="svg-bar-graph-visualization" />
  <Icon style={style} type="svg-bar-line-visualization" />
  <Icon style={style} type="svg-heat-tiles-visualization" />
  <Icon style={style} type="svg-hierarchy-visualization" />
  <Icon style={style} type="svg-line-graph-visualization" />
  <Icon style={style} type="svg-map-visualization" />
  <Icon style={style} type="svg-ranking-visualization" />
  <Icon style={style} type="svg-scatterplot-visualization" />
  <Icon style={style} type="svg-stacked-bar-graph-visualization" />
  <Icon style={style} type="svg-sunburst-visualization" />
  <Icon style={style} type="svg-table-visualization" />
</>
```
