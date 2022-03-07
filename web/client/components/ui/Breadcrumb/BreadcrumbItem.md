Use `value` in event handler:

```jsx
import Breadcrumb from 'components/ui/Breadcrumb';

<Breadcrumb onItemClick={value => alert(value)}>
  <BreadcrumbItem value="First">First</BreadcrumbItem>
  <BreadcrumbItem value="Second">Second</BreadcrumbItem>
</Breadcrumb>
```

We can also restrict the width of each breadcrumb and hover for the complete text.

```jsx
import Breadcrumb from 'components/ui/Breadcrumb';

<Breadcrumb onItemClick={value => alert(value)}>
  <BreadcrumbItem maxWidth={100} value="First">
    Some very long breadcrumb name
  </BreadcrumbItem>
  <BreadcrumbItem maxWidth={100} value="Second">
    Another very long breadcrumb name
  </BreadcrumbItem>
</Breadcrumb>
```
