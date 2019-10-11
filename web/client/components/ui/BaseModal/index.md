```jsx
import Button from 'components/ui/Button';

initialState = {
  show: false,
};

function onClick() {
  setState({ show: true });
}

function onPrimaryActionClick() {
  setState({ show: false });
}

function onRequestClose() {
  setState({ show: false });
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <BaseModal
    show={state.show}
    onRequestClose={onRequestClose}
    onPrimaryAction={onPrimaryActionClick}
    onSeconaryAction={onPrimaryActionClick}
    title="Test Modal"
    titleTooltip="This is a title tooltip"
    showSecondaryButton
    secondaryButtonText="Oh no!"
  >
    <p>Hello, welcome to my modal.</p>
  </BaseModal>
</React.Fragment>
```
