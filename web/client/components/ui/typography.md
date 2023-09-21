### Headings

Use the [`<Heading>`](#heading) component and its variants: `<Heading.Large>`, `<Heading.Medium>`, and `<Heading.Small>`. Do not use the HTML heading components (`<h1>`, `<h2>`, etc.) directly.

```jsx
import Heading from 'components/ui/Heading';

<React.Fragment>
  <Heading.Large>Heading Large</Heading.Large>
  <Heading.Medium>Heading Medium</Heading.Medium>
  <Heading.Small>Heading Size</Heading.Small>
</React.Fragment>
```

If you can't use a Heading component, you can still use a `<div>` styled as a heading by using the `'u-heading-large'`, `'u-heading-medium'`, and `'u-heading-small'` utility classes:

```jsx
import Heading from 'components/ui/Heading';

<React.Fragment>
  <div className="u-heading-large">Heading Large</div>
  <div className="u-heading-medium">Heading Medium</div>
  <div className="u-heading-small">Heading Size</div>
</React.Fragment>
```

### Text

We have five different types of text. Paragraph text, highlighted text, info text, label text, placeholder text, and caption text.

**NOTE:** these guidelines are bound to change as we currently aren't following any standardized text styles across the platform. As such you'll find several places using 15px text, labels that don't actually follow the "label" style in this section. We also never use the highlighted text class anywhere. These standards needs to be reworked. The Heading section is accurate though and you should use those.

```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="s">
  <p>This is paragraph text. It is 16px.</p>
  <div className="u-paragraph-text">
    This is paragraph text as a div using the <code>'u-paragraph-text'</code> class.
    It is also 16px.
  </div>
  <div className="u-info-text">
    This is info text. It is 14px.
  </div>
  <div className="u-label-text">
    This is label text. It is 14px.
  </div>
  <div className="u-placeholder-text">
    This is placeholder text... it is the same style as label text. It is 14px.
  </div>
  <div className="u-caption-text">
    This is caption text. It is 12px.
  </div>
</Group.Vertical>
```

Any text can be highlighted by using the `'u-highlighted-text'` class:

```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="s">
  <p>
    This is <span className="u-highlighted-text">highlighted</span> text. Use the `'u-highlighted-text'` class to highlight any text.
  </p>
  <div className="u-info-text">
    We can also <span className="u-highlighted-text">highlight</span> info text.
  </div>
  <div className="u-label-text">
    Go absolutely <span className="u-highlighted-text">wild</span>.
  </div>
</Group.Vertical>
```

