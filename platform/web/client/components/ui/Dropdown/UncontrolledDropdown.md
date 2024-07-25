Basic dropdown:
```jsx
import Dropdown from 'components/ui/Dropdown';

<Dropdown.Uncontrolled
  initialValue={undefined}
  defaultDisplayContent="Make a selection"
>
  <Dropdown.Option value="First">
    First option!
  </Dropdown.Option>
  <Dropdown.Option value="Second">
    Second option!
  </Dropdown.Option>
</Dropdown.Uncontrolled>
```

Dropdown with searchable items. For demonstration purposes, the fourth item in this dropdown is configured so that it is both unselectable and unaffected by the search text.
You can also pass a `renderButtonLabel` prop to render the button contents in a more customized way:
```jsx
import Dropdown from 'components/ui/Dropdown';

function renderButtonLabel(value) {
  return `Selected: ${value}`;
}

const options = ["Active", "Pending", "Some other status"];
const optionItems = options.map(optString => (
  <Dropdown.Option
    key={optString}
    value={optString}
    searchableText={optString}
  >
    {optString}
  </Dropdown.Option>
));

<Dropdown.Uncontrolled
  enableSearch
  initialValue="Active"
  menuMinWidth={400}
  renderButtonLabel={renderButtonLabel}
>
  {optionItems}
  <Dropdown.Option value="Unselectable!" disableSearch unselectable>
    Unselectable!
  </Dropdown.Option>
</Dropdown.Uncontrolled>
```

Dropdowns can nest their options into groups, and you can still have everything be searchable:
```jsx
import Dropdown from 'components/ui/Dropdown';

const myDashboards = ['Amazing Dashboard', 'Something Important'];
const otherDashboards = ["Quentin's Dashboard", "Nina's Analysis", 'Wow another option'];
const myDashboardOptions = myDashboards.map(dash =>
  <Dropdown.Option
    key={dash}
    value={dash}
    searchableText={dash}
  >
    {dash}
  </Dropdown.Option>
);
const otherDashboardOptions = otherDashboards.map(dash =>
  <Dropdown.Option
    key={dash}
    value={dash}
    searchableText={dash}
  >
    {dash}
  </Dropdown.Option>
);

<Dropdown.Uncontrolled
  enableSearch
  initialValue={undefined}
  menuMinWidth={400}
  defaultDisplayContent="Choose a Dashboard"
>
  <Dropdown.OptionsGroup
    id="my-dashboards"
    label="My Dashboards"
    searchableText="My Dashboards"
  >
    {myDashboardOptions}
  </Dropdown.OptionsGroup>
  <Dropdown.OptionsGroup
    id="other-dashboards"
    label="Other Dashboards"
    searchableText="Other Dashboards"
  >
    {otherDashboardOptions}
  </Dropdown.OptionsGroup>
</Dropdown.Uncontrolled>
```

Dropdowns with left and right menu alignments:
```jsx
import Dropdown from 'components/ui/Dropdown';

<React.Fragment>
  <Dropdown
    initialValue={undefined}
    defaultDisplayContent="Left alignment"
    menuAlignment={Dropdown.Alignments.LEFT}
  >
    <Dropdown.Option value="First">
      First option with some longer text to show off the menu alignment
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option!
    </Dropdown.Option>
  </Dropdown>

  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="Right alignment"
    menuAlignment={Dropdown.Alignments.RIGHT}
  >
    <Dropdown.Option value="First">
      First option with some longer text to show off the menu alignment
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option!
    </Dropdown.Option>
  </Dropdown.Uncontrolled>
</React.Fragment>
```

You can control the dropdown button width using `buttonWidth` and `buttonMinWidth`.
Notice how in the first dropdown, if you make a selection that extends past the `buttonWidth` then we will add an elipsis to cut off the text:
```jsx
import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';

<React.Fragment>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="200px button width"
    buttonWidth={200}
  >
    <Dropdown.Option value="First">
      First option with some long text that extends past this dropdown's button width
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option with some long text that extends past this dropdown's button width
    </Dropdown.Option>
  </Dropdown.Uncontrolled>

  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="200px min width"
    buttonMinWidth={200}
  >
    <Dropdown.Option value="First">
      First option with some longer text to show off the menu alignment
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option!
    </Dropdown.Option>
  </Dropdown.Uncontrolled>

  <LabelWrapper label="Dropdown with 100% width">
    <Dropdown.Uncontrolled
      initialValue={undefined}
      defaultDisplayContent="Button with 100% width!"
      buttonWidth="100%"
    >
      <Dropdown.Option value="First">
        First option with some longer text to show off the menu alignment
      </Dropdown.Option>
      <Dropdown.Option value="Second">
        Second option!
      </Dropdown.Option>
    </Dropdown.Uncontrolled>
  </LabelWrapper>
</React.Fragment>
```

Use `menuWidth` or `menuMinWidth` to control the width of the menu. You can set an exact pixel width, or you can use a string if you wanted to set a percentage width. The percentage width will be calculated based off of the button. E.g. `width="50%"` will create a menu with 50% of the button width. `width="100%"` will make the menu's width be the same as the button's.
```jsx
import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';

<React.Fragment>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="50% menu min width"
    buttonWidth={300}
    menuMinWidth="50%"
  >
    <Dropdown.Option value="First">
      First
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second
    </Dropdown.Option>
  </Dropdown.Uncontrolled>

  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="100% menu width"
    buttonWidth={300}
    menuWidth="100%"
  >
    <Dropdown.Option value="First">
      First option with long text to show off how long options break into multiple lines when the menu has fixed width
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option!
    </Dropdown.Option>
  </Dropdown.Uncontrolled>

  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="300px menu min width"
    menuMinWidth={300}
  >
    <Dropdown.Option value="First">
      First option
    </Dropdown.Option>
    <Dropdown.Option value="Second">
      Second option!
    </Dropdown.Option>
  </Dropdown.Uncontrolled>
</React.Fragment>
```

Dropdown menus have a default `maxHeight` set through CSS to prevent excessively long menus when there are lots of options. This can be overridden by passing a `menuMaxHeight` prop:
```jsx
import Dropdown from 'components/ui/Dropdown';

const options = ["First", "Second", "Third", "Fourth", "oh", "my", "god", "so", "many", "options"];
const optionItems = options.map(optString => (
  <Dropdown.Option
    key={optString}
    value={optString}
  >
    {optString}
  </Dropdown.Option>
));

<Dropdown.Uncontrolled
  initialValue={undefined}
  menuMaxHeight={100}
>
  {optionItems}
</Dropdown.Uncontrolled>
```

Dropdowns can have different intents if you wanted to give the button a different color:

```jsx
import Dropdown from 'components/ui/Dropdown';

const optionVals = ['First', 'Second'];
const options = optionVals.map(opt =>
  <Dropdown.Option key={opt} value={opt}>{opt}</Dropdown.Option>
);

<React.Fragment>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="default"
    buttonIntent={Dropdown.Intents.DEFAULT}
  >
    {options}
  </Dropdown.Uncontrolled>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="primary"
    buttonIntent={Dropdown.Intents.PRIMARY}
  >
    {options}
  </Dropdown.Uncontrolled>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="danger"
    buttonIntent={Dropdown.Intents.DANGER}
  >
    {options}
  </Dropdown.Uncontrolled>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="success"
    buttonIntent={Dropdown.Intents.SUCCESS}
  >
    {options}
  </Dropdown.Uncontrolled>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="warning"
    buttonIntent={Dropdown.Intents.WARNING}
  >
    {options}
  </Dropdown.Uncontrolled>
  <Dropdown.Uncontrolled
    initialValue={undefined}
    defaultDisplayContent="info"
    buttonIntent={Dropdown.Intents.INFO}
  >
    {options}
  </Dropdown.Uncontrolled>
</React.Fragment>
```
