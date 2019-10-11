```jsx
initialState = {
  currentPage: 2,
}

function onPageChange(currentPage) {
  setState({ currentPage });
}

<PageSelector
  currentPage={state.currentPage}
  pageSize={5}
  resultCount={100}
  onPageChange={onPageChange}
/>
```
