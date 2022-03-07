**NOTE:** any weird snapping while animating here is due to styleguidist. It works smoothly on our platform. Not sure why it has issues here.

Creating a slideable container:

1. Use state to check if we should be open or closed
2. Set the `height` in `AnimateHeight` to 0 if we're closed, or 'auto' if we're open.

```jsx
import Button from 'components/ui/Button';

const [menuOpen, setMenuOpen] = React.useState(false);

function toggleMenuState() {
  setMenuOpen(!menuOpen);
}

<div>
  <Button onClick={toggleMenuState}>
    {menuOpen ? 'Close' : 'Open'}
  </Button>
  <AnimateHeight
    height={menuOpen ? 'auto' : 0}
  >
    My goodness this is
    <br />
    a slideable container,
    <br />
    also a haiku
  </AnimateHeight>
</div>
```

**IMPORTANT:** the `<AnimateHeight>` component uses an `overflow: hidden` attribute which is crucial to the animation. But this also means that if the child you're animating extends outside of the container, it will not be displayed. For example, look at this slideable [`<Card>`](#card):

```jsx
import Button from 'components/ui/Button';
import Card from 'components/ui/Card';

const [menuOpen, setMenuOpen] = React.useState(false);

function toggleMenuState() {
  setMenuOpen(!menuOpen);
}

<div>
  <Button onClick={toggleMenuState}>
    {menuOpen ? 'Close' : 'Open'}
  </Button>
  <AnimateHeight
    height={menuOpen ? 'auto' : 0}
  >
    <Card title="This looks weird.">
      Where is my shadow?
      <br />
      A Card uses box-shadow.
      <br />
      It's hidden. Haiku.
    </Card>
  </AnimateHeight>
</div>
```

Cards look weird because they use `box-shadow` in their CSS, which overflows beyond the width of the element. And since AnimateHeight uses `overflow: hidden`, then the box-shadow gets hidden as well.

**SOLUTION:** just wrap the `<Card>` in a div, and use some CSS to make the shadow visible. The exact CSS tinkering will depend on your situation and the surrounding elements you have.

```jsx
import Button from 'components/ui/Button';
import Card from 'components/ui/Card';

const [menuOpen, setMenuOpen] = React.useState(false);

function toggleMenuState() {
  setMenuOpen(!menuOpen);
}

<div>
  <Button onClick={toggleMenuState}>
    {menuOpen ? 'Close' : 'Open'}
  </Button>
  <AnimateHeight
    height={menuOpen ? 'auto' : 0}
  >
    <div style={{ padding: 2 }}>
      <Card title="We have a shadow!">
        My goodness this card
        <br />
        has a visible border,
        <br />
        and still a haiku
      </Card>
    </div>
  </AnimateHeight>
</div>
```
As you can see, we wrapped the Card in a div, and just used a padding of 2px to make the shadow fit inside the `<AnimateHeight>` container.
