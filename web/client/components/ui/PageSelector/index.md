```jsx
const [currentPage, setCurrentPage] = React.useState(2);

<PageSelector
  currentPage={currentPage}
  pageSize={5}
  resultCount={100}
  onPageChange={setCurrentPage}
/>
```
