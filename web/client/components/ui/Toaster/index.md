The  `Toaster`  is used to show toasts (alerts) on top of an overlay. The toasts will close themselves when the close button is clicked, or after a timeout — the default is 5 seconds.

The `Toaster` component is based on the [Evergreen Toaster](https://evergreen.segment.com/components/toaster), from Segment's open source UI library.

#### When To Use

When you want to give feedback to your users about an action they take. Often this is in the form of creation or deletion.

#### Implementation details

A toast is simply a wrapper around the  `Alert`  component and has the same kind of types as an alert. The following types are available:

#### Types of toasts

-   **info**:  `Toaster.notify()`
-   **success**:  `Toaster.success()`
-   **warning**:  `Toaster.warning()`
-   **error**:  `Toaster.error()`

#### Closing all toasts

In some situations toasts might become outdated before they expire. For example when showing a toast in a setup flow, canceling out of that setup flow might make the toast irrelevant.

In those situations you can use  `toaster.closeAll()`  to close all open toasts.

#### Keep around when mouse over

When the user hovers (mouses over) the toast it will stop the countdown timer and the toast will stay alive as long as the toast is being hovered.

#### Self managed

The  `Toaster`  manages state itself — and uses  `ReactDOM`  to show toasts. The  `Toaster`  is essentially a singleton service for interacting with a `ToastManager`.

#### Standard usage
```jsx
import Button from 'components/ui/Button';

<>
  <Button onClick={() => Toaster.notify('Hello world!')}>Notify</Button>
  <Button
    onClick={() => Toaster.success('Nice work! Your action was successful.')}
  >
    Success
  </Button>
  <Button onClick={() => Toaster.warning('Uh oh, something went wrong...')}>
    Warning
  </Button>
  <Button onClick={() => Toaster.error('Fatal error. Cannot continue :(')}>
    Error
  </Button>
</>
```

#### Close all toasts
```jsx
import Button from 'components/ui/Button';

<Button onClick={() => Toaster.closeAll()}>Close all toasts</Button>
```

#### Adding and customizing the toast description
A `description` is used as the children of the `Alert` component. The description can be a React node.
```jsx
import Button from 'components/ui/Button';

const openToast = () => {
  Toaster.success('Your dashboard has been shared!', {
    description:
      'You should receive a confirmation email within a few minutes',
  });
};

<Button onClick={openToast}>Success with description</Button>
```

#### Custom duration (in seconds)
It is possible to add a custom duration when showing a toast. The default `duration` is `5` seconds. The `duration` property is in seconds — not milliseconds.
```jsx
import Button from 'components/ui/Button';

<Button
  onClick={() =>
    Toaster.notify('Stick around for 10 seconds', { duration: 10 })
  }
>
  10 Seconds
</Button>
```

#### Unique toasts
There are cases where only one toast with the same content should be shown at a time. Passing a unique ID via the `id` property allows `Toaster` to close all previous toasts with the same ID, before showing the new one.
```jsx
import Button from 'components/ui/Button';

<Button
  onClick={() =>
    Toaster.warning('Only one of me will be shown', { id: 'unique-id' })
  }
>
  Show only one toast
</Button>
```
