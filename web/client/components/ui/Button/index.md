Basic button sizes:

```jsx
<>
  <Button size={Button.Sizes.LARGE}>Large</Button>
  <Button size={Button.Sizes.MEDIUM}>Medium</Button>
  <Button size={Button.Sizes.SMALL}>Small</Button>
</>
```

Buttons with different intents. Click on the 'Primary' button to see an example of an event handler.

```jsx
<>
  <Button intent={Button.Intents.PRIMARY} onClick={() => alert('Clicked!')}>
    Primary
  </Button>
  <Button intent={Button.Intents.DANGER}>Danger</Button>
  <Button intent={Button.Intents.SUCCESS}>Success</Button>
</>
```

Buttons in outline style:

```jsx
<>
  <Button outline intent={Button.Intents.PRIMARY}>Primary</Button>
  <Button outline intent={Button.Intents.DANGER}>Danger</Button>
  <Button outline intent={Button.Intents.SUCCESS}>Success</Button>
</>
```

Buttons in text only style:

```jsx
<>
  <Button minimal intent={Button.Intents.PRIMARY}>Primary</Button>
  <Button minimal intent={Button.Intents.DANGER}>Danger</Button>
  <Button minimal intent={Button.Intents.SUCCESS}>Success</Button>
</>
```

Disabled button:

```jsx
<Button disabled onClick={() => alert('This should not fire!')}>
  Disabled
</Button>
```
