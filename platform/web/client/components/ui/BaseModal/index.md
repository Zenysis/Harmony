Basic modal

```jsx
import Button from 'components/ui/Button';

const [showModal, setShowModal] = React.useState(false);

function onClick() {
  setShowModal(true);
}

function onPrimaryActionClick() {
  setShowModal(false);
}

function onRequestClose() {
  setShowModal(false);
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <BaseModal
    show={showModal}
    onRequestClose={onRequestClose}
    onPrimaryAction={onPrimaryActionClick}
    onSecondaryAction={onPrimaryActionClick}
    title="Test Modal"
    titleTooltip="This is a title tooltip"
    showSecondaryButton
    secondaryButtonText="Oh no!"
  >
    <p>Hello, welcome to my modal.</p>
  </BaseModal>
</React.Fragment>;
```

Modal with custom header

```jsx
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';

const [showModal, setShowModal] = React.useState(false);

function onClick() {
  setShowModal(true);
}

function onPrimaryActionClick() {
  setShowModal(false);
}

function onRequestClose() {
  setShowModal(false);
}

function renderHeader() {
  return (
    <Group.Horizontal
      flex
      justifyContent="space-between"
      style={{ height: '100%' }}
      alignItems="center"
    >
      <div> hi </div>
      <div style={{ paddingRight: '20px' }}> hello </div>
    </Group.Horizontal>
  );
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <BaseModal
    show={showModal}
    onRequestClose={onRequestClose}
    onPrimaryAction={onPrimaryActionClick}
    customHeader={renderHeader()}
  >
    <p>Hello, welcome to my modal.</p>
  </BaseModal>
</React.Fragment>;
```
