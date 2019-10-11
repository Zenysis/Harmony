ColorBlock without a color picker (just an unclickable block representing a color):
```jsx
<ColorBlock color="#5379d6" size={25} />
```

ColorBlock with a color picker (click to open color picker):
```jsx
initialState={
  color: '#76cc78',
};

<ColorBlock
  enableColorPicker
  color={state.color}
  onColorChange={colorObj => setState({ color: colorObj.hex })}
/>
```
