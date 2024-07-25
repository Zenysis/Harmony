```jsx
import Button from 'components/ui/Button';

const [showModal, setShowModal] = React.useState(false);

function onClick() {
  setShowModal(true);
}

function onRequestClose() {
  setShowModal(false);
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <ProgressModal
    show={showModal}
    title="progress modal"
    onRequestClose={onRequestClose}
  >
    <ProgressModal.Page mainButtonText="next page" name="page 1">
      page 1
    </ProgressModal.Page>
    <ProgressModal.Page mainButtonText="add" name="page 2">
      page 2
    </ProgressModal.Page>
    <ProgressModal.Page mainButtonText="submit" name="page 3">
      page 3
    </ProgressModal.Page>
  </ProgressModal>
</React.Fragment>;
```

Progress modal that requires validation on first page

```jsx
import Button from 'components/ui/Button';
import Checkbox from 'components/ui/Checkbox';
import useToggleBoolean from 'lib/hooks/useToggleBoolean';

const [showModal, setShowModal] = React.useState(false);
const [isValid, toggleIsValid] = useToggleBoolean(false);

function onClick() {
  setShowModal(true);
}

function onRequestClose() {
  setShowModal(false);
}

<React.Fragment>
  <Button onClick={onClick}>Open!</Button>
  <ProgressModal
    show={showModal}
    title="progress modal"
    onRequestClose={onRequestClose}
  >
    <ProgressModal.Page
      mainButtonText="next page"
      name="page 1"
      disableMainButton={!isValid}
    >
      <Checkbox label="Check me!" value={isValid} onChange={toggleIsValid} />
    </ProgressModal.Page>
    <ProgressModal.Page mainButtonText="add" name="page 2">
      page 2
    </ProgressModal.Page>
  </ProgressModal>
</React.Fragment>;
```
