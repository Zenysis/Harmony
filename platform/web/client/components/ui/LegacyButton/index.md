Basic button:
```jsx
<LegacyButton>Hello!</LegacyButton>
```

LegacyButtons with different styles:
```jsx
const style = {
  marginRight: 10,
};
<div>
  <LegacyButton type={LegacyButton.Intents.DEFAULT} style={style}>Default</LegacyButton>
  <LegacyButton
    type={LegacyButton.Intents.PRIMARY}
    style={style}
    onClick={() => alert('Clicked!')}
  >
    Primary
  </LegacyButton>
  <LegacyButton type={LegacyButton.Intents.DANGER} style={style}>Danger</LegacyButton>
</div>
```

