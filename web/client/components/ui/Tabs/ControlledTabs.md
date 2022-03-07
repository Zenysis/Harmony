```jsx
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';

const [selectedTab, setSelectedTab] = React.useState('First Tab');

<Tabs.Controlled
  onTabChange={setSelectedTab}
  selectedTab={selectedTab}
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
</Tabs.Controlled>
```
