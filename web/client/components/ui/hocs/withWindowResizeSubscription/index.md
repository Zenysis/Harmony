If you want a component that responds to window resizes, use `withWindowResizeSubscription`. This will inject a `windowDimensions` prop to your component.

`windowDimensions` is of type `Dimension` (found in `'types/common'`)

If you want to trigger something when a resize happens, you can still use this HOC.
Just add a `componentDidUpdate` function to your component, and check if the `windowDimensions` have changed. If they changed, then trigger whatever function you want.

**Example:**

```jsx
import withWindowResizeSubscription, { dimensionsChanged } from 'components/ui/hocs/withWindowResizeSubscription';

class BaseCard extends React.PureComponent {
  componentDidUpdate(prevProps) {
    // Trigger an onResize event
    if (dimensionsChanged(
      this.props.windowDimensions,
      prevProps.windowDimensions
    )) {
      console.log('Resize!');
    }
  }

  render() {
    const { width, height } = this.props.windowDimensions;
    return <Card>Current window size is width: {width}, height: {height}</Card>;
  }
}

const ResponsiveCard = withWindowResizeSubscription(BaseCard);

<ResponsiveCard />
```
