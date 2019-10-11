Your tab headers are automatically laid out with evenly spaced tabs:

```jsx
import Tab from 'components/ui/Tabs/Tab';

<Tabs>
  <Tab name="First Tab">
    <p>This is the first tab</p>
  </Tab>
  <Tab name="Second Tab">
    <p>And this is the second tab</p>
  </Tab>
  <Tab name="Third Tab">
    <p>Surprise! A third tab.</p>
  </Tab>
</Tabs>
```

To have better control over how the tab headers are laid out, you can specify an exact amount of spacing between each tab header. For example, here are the same tabs but spaced 200px apart:
```jsx
import Tab from 'components/ui/Tabs/Tab';

<Tabs tabHeaderSpacing={200}>
  <Tab name="First Tab">
    <p>This is the first tab</p>
  </Tab>
  <Tab name="Second Tab">
    <p>And this is the second tab</p>
  </Tab>
  <Tab name="Third Tab">
    <p>Surprise! A third tab.</p>
  </Tab>
</Tabs>
```

You can also give your tabs group a title, which will render before the tabs header. This will cause the tabs to render with a lightweight style so that they can be differentiated from the tab group title.
```jsx
import Tab from 'components/ui/Tabs/Tab';

<Tabs title="My Tabs" titleTooltip="This is a tooltip!">
  <Tab name="First Tab">
    <p>This is the first tab</p>
  </Tab>
  <Tab name="Second Tab">
    <p>And this is the second tab</p>
  </Tab>
  <Tab name="Third Tab">
    <p>Surprise! A third tab.</p>
  </Tab>
</Tabs>
```
