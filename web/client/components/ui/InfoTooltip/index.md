```jsx
<InfoTooltip />
```

```jsx
<InfoTooltip
  iconStyle={{ color: '#DB3737', marginLeft: 4 }}
  text="Hello!"
/>
```

Here's a tooltip with a different icon.

```jsx
<InfoTooltip iconType='globe' text='Different icon wow'/>
```

You can also specify the position of the tooltip relative to the icon.

```jsx
<React.Fragment>
  <InfoTooltip text="Positioned right" tooltipPlacement="right" />
  <InfoTooltip text="Positioned left" tooltipPlacement="left" />
  <InfoTooltip text="Positioned top" tooltipPlacement="top" />
  <InfoTooltip text="Positioned bottom" tooltipPlacement="bottom" />
</React.Fragment>
```
