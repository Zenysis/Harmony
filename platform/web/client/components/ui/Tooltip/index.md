```jsx
import Tag from 'components/ui/Tag';

<Tooltip content="This is the default tooltip style and placement.">
  <Tag.Simple>Hover over me!</Tag.Simple>
</Tooltip>
```

You can also specify the position of the tooltip relative to the content.

```jsx
import Tag from 'components/ui/Tag';

<React.Fragment>
  <Tooltip content="Positioned right" tooltipPlacement="right">
    <Tag.Simple>Right</Tag.Simple>
  </Tooltip>
  <Tooltip content="Positioned left" tooltipPlacement="left">
    <Tag.Simple>Left</Tag.Simple>
  </Tooltip>
  <Tooltip content="Positioned top" tooltipPlacement="top">
    <Tag.Simple>Top</Tag.Simple>
  </Tooltip>
  <Tooltip content="Positioned bottom" tooltipPlacement="bottom">
    <Tag.Simple>Bottom</Tag.Simple>
  </Tooltip>
</React.Fragment>
```

You can also delay the tooltip.

```jsx
import Tag from 'components/ui/Tag';

<Tooltip
  content="Positioned bottom"
  delayTooltip={1000}
  tooltipPlacement="bottom"
>
  <Tag.Simple>delayed</Tag.Simple>
</Tooltip>
```
