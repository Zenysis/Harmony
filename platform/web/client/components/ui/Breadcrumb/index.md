Breadcrumb with an event handler:

```jsx
import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';

<Breadcrumb onItemClick={ value => alert(value) }>
  <BreadcrumbItem value="First">First</BreadcrumbItem>
  <BreadcrumbItem value="Second">Second</BreadcrumbItem>
  <BreadcrumbItem value="Third">Third</BreadcrumbItem>
</Breadcrumb>
```
