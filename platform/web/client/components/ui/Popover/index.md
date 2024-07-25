Popovers must always have an anchor element attached to them in order to determine where the popover should show up. There are three ways to specify an anchor element.

**The recommended way is to pass an HTML Element directly**. The easiest way to do this is to track the anchor element in your state and set it in an event handler (either by extracting `currentTarget` directly from the event object, or by getting it from a ref).

If you are rendering your popover in a scrolling container (other than the window) then you must set a non-static position attribute (i.e. fixed, absolute, relative, or sticky) on the anchor element for the popover to be positioned correctly when scrolling.

```jsx
import Button from 'components/ui/Button';

const [anchorElt, setAnchorElt] = React.useState(null);
const [popoverOpen, setPopoverOpen] = React.useState(false);

function onButtonClick(event) {
  const anchorElt = event.currentTarget;
  setAnchorElt(anchorElt);
  setPopoverOpen(!popoverOpen);
}

function onRequestClose() {
  setPopoverOpen(false);
}

<React.Fragment>
  <Button size={Button.Sizes.SMALL} onClick={onButtonClick}>
    Click me!
  </Button>
  <Popover
    anchorElt={anchorElt}
    isOpen={popoverOpen}
    onRequestClose={onRequestClose}
  >
    This is a popover!
  </Popover>
</React.Fragment>;
```

The second way is to pass a render function, which lets you render your anchor directly coupled to your popover.

**Pros:**
- Removes the need to track the anchor element in state.
- Not all anchor elements will have an event handler you can easily hook into to extract the HTML Element

**Cons:**
- Component hierarchy is less intuitive due to the addition of a render prop which increases indirection
- The anchor element will be automatically wrapped in a div so the Popover can do the necessary position calculations. Sometimes this div wrapper can unexpectedly change how things look.

```jsx
import Button from 'components/ui/Button';

const [popoverOpen, setPopoverOpen] = React.useState(false);

function onButtonClick(event) {
  setPopoverOpen(!popoverOpen);
}

function onRequestClose() {
  setPopoverOpen(false);
}

function renderButton() {
  return (
    <Button size={Button.Sizes.SMALL} onClick={onButtonClick}>
      Click me!
    </Button>
  );
}

<React.Fragment>
  <Popover
    anchorElt={renderButton}
    isOpen={popoverOpen}
    onRequestClose={onRequestClose}
  >
    This is a popover!
  </Popover>
</React.Fragment>;
```

The last way is to pass a string ID that points to a DOM node. This is the least recommended approach and should only be used when your anchor element is really difficult to extract. Typically this happens when the element that triggers the popover is in a completely different component from the anchor element.

```jsx
import Button from 'components/ui/Button';
import Tag from 'components/ui/Tag';

const [popoverOpen, setPopoverOpen] = React.useState(false);

function onButtonClick(event) {
  setPopoverOpen(!popoverOpen);
}

function onRequestClose() {
  setPopoverOpen(false);
}

<React.Fragment>
  <Button size={Button.Sizes.SMALL} onClick={onButtonClick}>
    Click me!
  </Button>
  <Tag.Simple id="popover_anchor_elt" intent={Tag.Intents.SUCCESS}>
    This is the anchor element
  </Tag.Simple>

  <Popover
    anchorElt="popover_anchor_elt"
    isOpen={popoverOpen}
    onRequestClose={onRequestClose}
  >
    This is a popover!
  </Popover>
</React.Fragment>;
```

You can control the placement of the popover by setting an anchor origin and a popover origin. Play around with the anchor and popover dropdowns here to see how the location of the popover changes.

```jsx
import Button from 'components/ui/Button';
import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';

const [popoverOpen, setPopoverOpen] = React.useState(false);
const [anchorOrigin, setAnchorOrigin] = React.useState(
  Popover.Origins.BOTTOM_CENTER,
);
const [popoverOrigin, setPopoverOrigin] = React.useState(
  Popover.Origins.TOP_CENTER,
);

function onButtonClick() {
  setPopoverOpen(!popoverOpen);
}

function onClose() {
  setPopoverOpen(false);
}

function renderButton() {
  return (
    <Button size={Button.Sizes.SMALL} onClick={onButtonClick}>
      Click me!
    </Button>
  );
}

const originPlacements = Object.values(Popover.Origins).map(origin => (
  <Dropdown.Option key={origin} value={origin}>
    {origin}
  </Dropdown.Option>
));

<div style={{ display: 'flex' }}>
  <LabelWrapper label="Anchor Origin">
    <Dropdown value={anchorOrigin} onSelectionChange={setAnchorOrigin}>
      {originPlacements}
    </Dropdown>
  </LabelWrapper>
  <LabelWrapper label="Popover Origin">
    <Dropdown value={popoverOrigin} onSelectionChange={setPopoverOrigin}>
      {originPlacements}
    </Dropdown>
  </LabelWrapper>

  <Popover
    anchorElt={renderButton}
    isOpen={popoverOpen}
    onRequestClose={onClose}
    anchorOrigin={anchorOrigin}
    popoverOrigin={popoverOrigin}
  >
    <p>Hello, this is a popover</p>
  </Popover>
</div>;
```

If a popover extends past the edges of the window then its position will be auto-adjusted to fit inside the window. Here is an example of a popover that should extend past the right edge of the window, but it is auto-adjusted to fit inside the window. Play around with the anchor and popover origin dropdowns to see how the location of the popover changes.

```jsx
import Button from 'components/ui/Button';
import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';
import TextArea from 'components/common/TextArea';

const [popoverOpen, setPopoverOpen] = React.useState(false);
const [anchorOrigin, setAnchorOrigin] = React.useState(
  Popover.Origins.RIGHT_CENTER,
);
const [popoverOrigin, setPopoverOrigin] = React.useState(
  Popover.Origins.LEFT_CENTER,
);

function onButtonClick() {
  setPopoverOpen(!popoverOpen);
}

function onClose() {
  setPopoverOpen(false);
}

function renderButton() {
  return (
    <Button size={Button.Sizes.SMALL} onClick={onButtonClick}>
      Click me!
    </Button>
  );
}

const originPlacements = Object.values(Popover.Origins).map(origin => (
  <Dropdown.Option key={origin} value={origin}>
    {origin}
  </Dropdown.Option>
));

<div style={{ display: 'flex' }}>
  <LabelWrapper label="Anchor Origin">
    <Dropdown value={anchorOrigin} onSelectionChange={setAnchorOrigin}>
      {originPlacements}
    </Dropdown>
  </LabelWrapper>
  <LabelWrapper label="Popover Origin">
    <Dropdown value={popoverOrigin} onSelectionChange={setPopoverOrigin}>
      {originPlacements}
    </Dropdown>
  </LabelWrapper>

  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
    <Popover
      anchorElt={renderButton}
      isOpen={popoverOpen}
      onRequestClose={onClose}
      anchorOrigin={anchorOrigin}
      popoverOrigin={popoverOrigin}
    >
      <p>
        Hello, this is a popover with long text which makes it extend past the
        right edge of the window and so we do some math to keep it inside the
        viewport.
      </p>
      <p>Also here's a textarea so you can expand things vertically:</p>
      <TextArea initialValue="" />
    </Popover>
  </div>
</div>;
```

You can play around with different container types to achieve the effect you want:

```jsx
import Button from 'components/ui/Button';

const [popoverOpen, setPopoverOpen] = React.useState(false);
const [anchorOrigin, setAnchorOrigin] = React.useState(
  Popover.Origins.RIGHT_CENTER,
);
const [popoverOrigin, setPopoverOrigin] = React.useState(
  Popover.Origins.LEFT_CENTER,
);
const [defaultContainerPopover, setDefaultContainerPopover] = React.useState(
  false,
);
const [defaultContainerBtn, setDefaultContainerBtn] = React.useState(null);
const [emptyContainerPopover, setEmptyContainerPopover] = React.useState(false);
const [emptyContainerBtn, setEmptyContainerBtn] = React.useState(null);
const [noContainerPopover, setNoContainerPopover] = React.useState(false);
const [noContainerBtn, setNoContainerBtn] = React.useState(null);

function onDefaultContainerButtonClick(event) {
  setDefaultContainerBtn(event.currentTarget);
  setDefaultContainerPopover(!defaultContainerPopover);
}

function onEmptyContainerButtonClick(event) {
  setEmptyContainerBtn(event.currentTarget);
  setEmptyContainerPopover(!emptyContainerPopover);
}

function onNoContainerButtonClick(event) {
  setNoContainerBtn(event.currentTarget);
  setNoContainerPopover(!noContainerPopover);
}

function onCloseDefaultContainerPopover() {
  setDefaultContainerPopover(false);
}

function onCloseEmptyContainerPopover() {
  setEmptyContainerPopover(false);
}

function onCloseNoContainerPopover() {
  setNoContainerPopover(false);
}

<React.Fragment>
  <Button size={Button.Sizes.SMALL} onClick={onDefaultContainerButtonClick}>
    Default Container
  </Button>
  <Button size={Button.Sizes.SMALL} onClick={onEmptyContainerButtonClick}>
    Empty Container
  </Button>
  <Button size={Button.Sizes.SMALL} onClick={onNoContainerButtonClick}>
    No Container
  </Button>

  <Popover
    anchorElt={defaultContainerBtn}
    isOpen={defaultContainerPopover}
    onRequestClose={onCloseDefaultContainerPopover}
    containerType={Popover.Containers.DEFAULT}
  >
    Default container - padding is all set for me to write anything.
  </Popover>
  <Popover
    anchorElt={emptyContainerBtn}
    isOpen={emptyContainerPopover}
    onRequestClose={onCloseEmptyContainerPopover}
    containerType={Popover.Containers.EMPTY}
  >
    No padding - this popover is a blank slate for me to add more interesting
    styling.
  </Popover>
  <Popover
    anchorElt={noContainerBtn}
    isOpen={noContainerPopover}
    onRequestClose={onCloseNoContainerPopover}
    containerType={Popover.Containers.NONE}
  >
    No container! This popover can be whatever I want it to be.
  </Popover>
</React.Fragment>;
```

Popovers can be triggered on hover too! Not just on click.

**NOTE:** If you look at the code you'll notice that we set `blurType={Popover.BlurTypes.DOCUMENT}`. Opening/closing a Popover on hover will not work without this. The default behavior of a popover is to add an invisible overlay behind it, and we rely on events triggered on that overlay to decide when to hide the Popover. This blur type is the default, represented as `Popover.BlurTypes.OVERLAY`. Unfortunately, this makes it impossible to trigger a Popover on/off using hover events. So to enable hovering, we need to switch to `Popover.BlurTypes.DOCUMENT`, which does not use an overlay anymore, and forces us to rely on events triggered from the DOM's `document` object.

```jsx
import Icon from 'components/ui/Icon';

const [buttonElt, setButtonElt] = React.useState(null);
const [showPopover, setShowPopover] = React.useState(false);

function onMouseOver(event) {
  setButtonElt(event.currentTarget);
  setShowPopover(true);
}

function onMouseOut(event) {
  setShowPopover(false);
}

<React.Fragment>
  <span
    onFocus={onMouseOver}
    onMouseOver={onMouseOver}
    onBlur={onMouseOut}
    onMouseOut={onMouseOut}
  >
    Hover me!
    <Icon type="user" />
  </span>
  <Popover
    anchorElt={buttonElt}
    isOpen={showPopover}
    blurType={Popover.BlurTypes.DOCUMENT}
  >
    Popover contents!
  </Popover>
</React.Fragment>;
```
