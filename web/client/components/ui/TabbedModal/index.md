Tabbed modal without a title:
```jsx
import Button from 'components/ui/Button';
import Tab from 'components/ui/Tabs/Tab';

const [showModal, setShowModal] = React.useState(false);

function onClick() {
  setShowModal(true);
}

function onRequestClose() {
  setShowModal(false);
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <TabbedModal
    show={showModal}
    onRequestClose={onRequestClose}
    showPrimaryButton={false}
    tabHeaderSpacing={60}
  >
    <Tab name="First Tab">
      <p>This is the first tab</p>
    </Tab>
    <Tab name="Second Tab">
      <p>And this is the second tab</p>
    </Tab>
    <Tab name="Third Tab">
      <p>Surprise! A third tab.</p>
    </Tab>
  </TabbedModal>
</React.Fragment>
```

Tabbed modal with a title:
```jsx
import Button from 'components/ui/Button';
import Tab from 'components/ui/Tabs/Tab';

const [showModal, setShowModal] = React.useState(false);

function onClick() {
  setShowModal(true);
}

function onRequestClose() {
  setShowModal(false);
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <TabbedModal
    show={showModal}
    onRequestClose={onRequestClose}
    title="Test Modal"
    titleTooltip="This is a title tooltip"
    showPrimaryButton={false}
  >
    <Tab name="First Tab">
      <p>This is the first tab</p>
    </Tab>
    <Tab name="Second Tab">
      <p>And this is the second tab</p>
    </Tab>
    <Tab name="Third Tab">
      <p>Surprise! A third tab.</p>
    </Tab>
  </TabbedModal>
</React.Fragment>
```

