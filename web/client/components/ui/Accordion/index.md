Only one accordion item can be open at once. Try clicking on one of the headers.

```jsx
const [selectedAccordionItem, setSelectedAccordionItem] = React.useState(
  undefined,
);

<Accordion
  selectedAccordionItem={selectedAccordionItem}
  onSelectionChange={setSelectedAccordionItem}
>
  <Accordion.Item name="First Accordion Item">
    <p>This is the first accordion item</p>
  </Accordion.Item>
  <Accordion.Item name="Second Accordion Item">
    <p>And this is the second accordion item</p>
  </Accordion.Item>
  <Accordion.Item name="Third Accordion Item">
    <p>Surprise! A third accordion item.</p>
  </Accordion.Item>
  <Accordion.Item name="Fourth Accordion Item">
    <p>WOW! INCREDIBLE! A fourth accordion item.</p>
  </Accordion.Item>
</Accordion>;
```
