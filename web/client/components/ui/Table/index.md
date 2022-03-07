Table with hoverable, clickable, and sortable rows:

```jsx
import Table from 'components/ui/Table';
import Button from 'components/ui/Button';

const HEADERS = [
  { id: 'Name' },
  { id: 'Last Name', sortFn: Table.Sort.string(d => d.lastName) },
  { id: 'Email', sortFn: Table.Sort.string(d => d.email) },
];

const DATA = [
  { name: 'Juan Pablo', lastName: 'Sarmiento', email: 'pablo@gmail.com' },
  { name: 'Stephen', lastName: 'Ball', email: 'stephen@gmail.com' },
  { name: 'Moriah', lastName: 'Cesaretti', email: 'moriah@gmail.com' },
];

function renderRow(data) {
  return (
    <Table.Row id={data.name}>
      <Table.Cell>{data.name}</Table.Cell>
      <Table.Cell>{data.lastName}</Table.Cell>
      <Table.Cell>{data.email}</Table.Cell>
    </Table.Row>
  );
}

function onRowClick(data) {
  alert(`Clicked ${data.name}`);
}

<Table
  adjustWidthsToContent
  headers={HEADERS}
  data={DATA}
  renderRow={renderRow}
  onRowClick={onRowClick}
  initialColumnToSort="Last Name"
  initialColumnSortOrder="DESC"
/>;
```

Table without hoverable rows, and is searchable, and has pagination, and has an action button:

```jsx
import Button from 'components/ui/Button';
import Table from 'components/ui/Table';

const HEADERS = [
  { id: 'Name', searchable: d => d.name },
  { id: 'Last Name', searchable: d => d.lastName },
  { id: 'Email', searchable: d => d.email },
];

const DATA = [
  { name: 'Juan Pablo', lastName: 'Sarmiento', email: 'pablo@gmail.com' },
  { name: 'Stephen', lastName: 'Ball', email: 'stephen@gmail.com' },
  { name: 'Moriah', lastName: 'Cesaretti', email: 'moriah@gmail.com' },
  { name: 'Nina', lastName: 'Ray', email: 'nina@gmail.com' },
];

function renderActionButton() {
  return <Button onClick={() => alert('You are great!')}>Click me!</Button>;
}

function renderRow(data) {
  return (
    <Table.Row>
      <Table.Cell>{data.name}</Table.Cell>
      <Table.Cell>{data.lastName}</Table.Cell>
      <Table.Cell>{data.email}</Table.Cell>
    </Table.Row>
  );
}

<Table
  pageSize={2}
  headers={HEADERS}
  data={DATA}
  renderActionButtons={renderActionButton}
  renderRow={renderRow}
  isHoverable={false}
/>;
```

Without displaying the header row, and make it searchable through a custom input text box (not using the default search box managed by the Table component). This is done by adding our own InputText, and having to manage our own state to keep track of the text.

```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import Table from 'components/ui/Table';

const [searchText, setSearchText] = React.useState('');

// searchable only on the name column
const HEADERS = [
  { id: 'Name', searchable: d => d.name },
  { id: 'Last Name' },
  { id: 'Email' },
];

const DATA = [
  { name: 'Juan Pablo', lastName: 'Sarmiento', email: 'pablo@gmail.com' },
  { name: 'Stephen', lastName: 'Ball', email: 'stephen@gmail.com' },
  { name: 'Moriah', lastName: 'Cesaretti', email: 'moriah@gmail.com' },
];

function renderRow(data) {
  return (
    <Table.Row>
      <Table.Cell>{data.name}</Table.Cell>
      <Table.Cell>{data.lastName}</Table.Cell>
      <Table.Cell>{data.email}</Table.Cell>
    </Table.Row>
  );
}

<React.Fragment>
  <LabelWrapper label="This table is searchable only on the Name column:">
    <InputText
      value={searchText}
      onChange={setSearchText}
      placeholder="This is a custom input box!"
    />
  </LabelWrapper>
  <Table
    searchText={searchText}
    headers={HEADERS}
    data={DATA}
    renderRow={renderRow}
    isHoverable={false}
    showHeaders={false}
  />
</React.Fragment>;
```

A table without data:

```jsx
import Table from 'components/ui/Table';

const HEADERS = [{ id: 'Name' }, { id: 'Last Name' }, { id: 'Email' }];

const DATA = [];

function renderRow(data) {
  return (
    <Table.Row>
      <Table.Cell>{data.name}</Table.Cell>
      <Table.Cell>{data.lastName}</Table.Cell>
      <Table.Cell>{data.email}</Table.Cell>
    </Table.Row>
  );
}

<Table headers={HEADERS} data={DATA} renderRow={renderRow} />;
```

A table with editable rows:

```jsx
import Table from 'components/ui/Table';
import { noop } from 'util/util';

const HEADERS = [{ id: 'Name' }, { id: 'Last Name' }, { id: 'Email' }];

const DATA = [
  { name: 'Juan Pablo', lastName: 'Sarmiento', email: 'pablo@gmail.com' },
  { name: 'Stephen', lastName: 'Ball', email: 'stephen@gmail.com' },
  { name: 'Moriah', lastName: 'Cesaretti', email: 'moriah@gmail.com' },
];

function renderRow(data, isEditMode) {
  if (isEditMode) {
    return (
      <Table.Row
        enableEdit
        onEditCancel={() => alert('Cancel!')}
        onEditSave={() => alert('Save!')}
      >
        <Table.Cell>
          <InputText.Uncontrolled initialValue={data.name} onChange={noop} />
        </Table.Cell>
        <Table.Cell>
          <InputText.Uncontrolled
            initialValue={data.lastName}
            onChange={noop}
          />
        </Table.Cell>
        <Table.Cell>
          <InputText.Uncontrolled initialValue={data.email} onChange={noop} />
        </Table.Cell>
      </Table.Row>
    );
  }
  return (
    <Table.Row enableEdit>
      <Table.Cell>{data.name}</Table.Cell>
      <Table.Cell>{data.lastName}</Table.Cell>
      <Table.Cell>{data.email}</Table.Cell>
    </Table.Row>
  );
}

<Table isEditable headers={HEADERS} data={DATA} renderRow={renderRow} />;
```
