### Spacing Variables

You should use our default spacing variables to apply margins or paddings. You should default to using pixel spacings:
- `$space-xxxs-px: 2px`
- `$space-xxs-px: 4px`
- `$space-xs-px: 8px`
- `$space-s-px: 12px`
- `$space-m-px: 16px`
- `$space-l-px: 24px`
- `$space-xl-px: 36px`
- `$space-xxl-px: 48px`
- `$space-xxxl-px: 64px`

In rare circumstances, your component might have dynamically resizable font sizes (for example, if the user can change the font size through a user input) and you won't be able to predict how the spacing should change. In these cases, you should apply margins or paddings using `em` units. This ensures the spacing remains relative to the font size, such that larger font sizes automatically have larger spacings. Each of our spacing variables have an `em` variant:
- `$space-xxxs-em: 0.125em`
- `$space-xxs-em: 0.25em`
- `$space-xs-em: 0.5em`
- `$space-s-em: 0.75em`
- `$space-m-em: 1em`
- `$space-l-em: 1.5em`
- `$space-xl-em: 2.25em`
- `$space-xxl-em: 3em`
- `$space-xxxl-em: 4em`

Assuming a font size of 16px, these `em` values are the same amount of pixels as the `space-*-px` variables.

### The Group Component

Where possible you should space elements using the [`<Group>`](#group) component. This allows you to space components horizontally and vertically, and you can even nest groups together:
```jsx
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';

<Group.Vertical spacing="m">
  <Group.Horizontal spacing="s">
    <Button>Button 1</Button>
    <Button>Button 2</Button>
  </Group.Horizontal>
  <Group.Horizontal spacing="l">
    <Button>Button 1</Button>
    <Button>Button 2</Button>
  </Group.Horizontal>
</Group.Vertical>
```

Sometimes you might want more granular control over individual group items to give them additional padding or change its margin. You can wrap any item in a [`<Group.Item>`](#groupitem) tag in order to override its default spacing. Look at how we can use the [`<Group.Item>`](#groupitem) component on the last row in order to give it an even larger `marginTop` value:
```jsx
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';

<Group.Vertical spacing="m">
  <Group.Horizontal spacing="s">
    <Button>Button 1</Button>
    <Button>Button 2</Button>
  </Group.Horizontal>
  <Group.Horizontal spacing="l">
    <Button>Button 1</Button>
    <Button>Button 2</Button>
  </Group.Horizontal>
  <Group.Item marginTop="xl">
    <Group.Horizontal spacing="s">
      <Button>Button 1</Button>
      <Button>Button 2</Button>
    </Group.Horizontal>
  </Group.Item>
</Group.Vertical>
```
