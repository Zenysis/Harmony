ColorBlocks without a color picker (just an unclickable block representing a color):

```jsx
<>
  <ColorBlock color="#5379d6" size={25} />
  <ColorBlock color="#5379d6" shape="circle" size={25} />
</>
```

ColorBlock with a color picker (click to open color picker):

```jsx
const [color, setColor] = React.useState('#76cc78');

<ColorBlock
  enableColorPicker
  color={color}
  onColorChange={colorObj => setColor(colorObj.hex)}
/>;
```

ColorBlock with a color picker (click to open color picker) and the option to have no color:

```jsx
const [color, setColor] = React.useState(undefined);

<ColorBlock
  enableColorPicker
  color={color}
  onColorChange={colorObj => setColor(colorObj.hex)}
  onColorRemove={() => setColor(undefined)}
/>;
```
