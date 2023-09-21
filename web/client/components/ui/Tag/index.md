A simple unclickable tag. Note that if all you need is a display tag, you may not need to keep track of a `value` prop. So you can either set `value={undefined}` or use `<Tag.Simple>` instead.
```jsx
<React.Fragment>
  <Tag.Simple>A display tag</Tag.Simple>
  <Tag value={undefined}>Another tag</Tag>
</React.Fragment>
```

Tags can have different intents, represented by different colors. They can also have different sizes:
```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="xs">
  <Group.Horizontal>
    <Tag.Simple size={Tag.Sizes.LARGE} intent={Tag.Intents.PRIMARY}>
      Primary
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.LARGE} intent={Tag.Intents.DANGER}>
      Danger
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.LARGE} intent={Tag.Intents.SUCCESS}>
      Success
    </Tag.Simple>
  </Group.Horizontal>
  <Group.Horizontal>
    <Tag.Simple size={Tag.Sizes.MEDIUM} intent={Tag.Intents.PRIMARY}>
      Primary
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.MEDIUM} intent={Tag.Intents.DANGER}>
      Danger
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.MEDIUM} intent={Tag.Intents.SUCCESS}>
      Success
    </Tag.Simple>
  </Group.Horizontal>
  <Group.Horizontal>
    <Tag.Simple size={Tag.Sizes.SMALL} intent={Tag.Intents.PRIMARY}>
      Primary
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.SMALL} intent={Tag.Intents.DANGER}>
      Danger
    </Tag.Simple>
    <Tag.Simple size={Tag.Sizes.SMALL} intent={Tag.Intents.SUCCESS}>
      Success
    </Tag.Simple>
  </Group.Horizontal>
</Group.Vertical>
```

A clickable tag:
```jsx
import Group from 'components/ui/Group';

function onClick(value) {
  alert(value);
}
<Group.Vertical spacing="xs">
  <Group.Horizontal>
    Tags with gradients:
    <Tag value="my-tag-primary" onClick={onClick} intent={Tag.Intents.PRIMARY}>
      Click me
    </Tag>
    <Tag value="my-tag-danger" onClick={onClick} intent={Tag.Intents.DANGER}>
      Click me
    </Tag>
    <Tag value="my-tag-success" onClick={onClick} intent={Tag.Intents.SUCCESS}>
      Click me
    </Tag>
    <Tag value="my-tag-warning" onClick={onClick} intent={Tag.Intents.WARNING}>
      Click me
    </Tag>
    <Tag value="my-tag-info" onClick={onClick} intent={Tag.Intents.INFO}>
      Click me
    </Tag>
  </Group.Horizontal>
  <Group.Horizontal>
    Tags with solid colors:
    <Tag
      solidColor
      value="my-tag-primary"
      onClick={onClick}
      intent={Tag.Intents.PRIMARY}
    >
      Click me
    </Tag>
    <Tag
      solidColor
      value="my-tag-danger"
      onClick={onClick}
      intent={Tag.Intents.DANGER}
    >
      Click me
    </Tag>
    <Tag
      solidColor
      value="my-tag-success"
      onClick={onClick}
      intent={Tag.Intents.SUCCESS}
    >
      Click me
    </Tag>
    <Tag
      solidColor
      value="my-tag-warning"
      onClick={onClick}
      intent={Tag.Intents.WARNING}
    >
      Click me
    </Tag>
    <Tag
      solidColor
      value="my-tag-info"
      onClick={onClick}
      intent={Tag.Intents.INFO}
    >
      Click me
    </Tag>
  </Group.Horizontal>
</Group.Vertical>
```

Removable tags:
```jsx
import LegacyButton from 'components/ui/LegacyButton';

const initialTags = ZenArray.create(['Vinh', 'Vedant', 'Moriah', 'Stephen']);

const [tagNames, setTagNames] = React.useState(initialTags);

function onTagRemoveClick(name) {
  setTagNames(tagNames.findAndDelete(n => n === name));
}

function resetTags() {
  setTagNames(initialTags);
}

function getTags() {
  return tagNames.map(name => (
    <Tag
      removable
      key={name}
      value={name}
      onRequestRemove={onTagRemoveClick}
    >
      {name}
    </Tag>
  ));
}

<div>
  {getTags()}
  <LegacyButton
    onClick={resetTags}
    type={LegacyButton.Intents.LINK}
  >
    Reset Tags
  </LegacyButton>
</div>
```

Tag with a primary action. This is an action separate from the tag's `onClick` event, and is represented by an icon on the side of the tag. The `onPrimaryAction` event is only triggered when that icon is clicked. This is typically used for tags that might want to render a dropdown menu, or an edit modal, through a separate icon on the tag.
```jsx
function onPrimaryAction(value) {
  alert(value);
}

<React.Fragment>
  <Tag
    hasPrimaryAction
    value="Hello!"
    onPrimaryAction={onPrimaryAction}
  >
    Hello
  </Tag>
  <Tag
    hasPrimaryAction
    removable
    value="Edit this!"
    onPrimaryAction={onPrimaryAction}
    primaryActionIconType="pencil"
  >
    Some other tag
  </Tag>
</React.Fragment>
```
