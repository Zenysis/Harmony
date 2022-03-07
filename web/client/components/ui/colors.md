You will notice that some colors have semantic variants (active and hover). Use these variants for user interactions.

For example, a button starts with a base color (e.g. `$white`), and then we'd use the `hover` variant (`$white-hover`) for when the user hovers, and then the `active` variant (`$white-active`) for when the user clicks on it. Avoid using the semantic variants (active/hover) as base colors.

### Neutral Colors

```jsx
import Box from 'styleguide/Box';
import Colors from 'components/ui/Colors';
import Group from 'components/ui/Group';

<Group.Vertical spacing="none">
  <Group.Horizontal spacing="none">
    <Box name="White (active)" cssVar="$white-active" hexcode={Colors.WHITE_ACTIVE} darkText />
    <Box name="White" cssVar="$white" hexcode={Colors.WHITE} darkText />
    <Box name="White (hover)" cssVar="$white-hover" hexcode={Colors.WHITE_HOVER} darkText />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Gray Light (active)" cssVar="$gray-light-active" hexcode={Colors.GRAY_LIGHT_ACTIVE} darkText />
    <Box name="Gray Light" cssVar="$gray-light" hexcode={Colors.GRAY_LIGHT} darkText />
    <Box name="Gray Light (hover)" cssVar="$gray-light-hover" hexcode={Colors.GRAY_LIGHT_HOVER} darkText />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Gray (active)" cssVar="$gray-active" hexcode={Colors.GRAY_ACTIVE} />
    <Box name="Gray" cssVar="$gray" hexcode={Colors.GRAY} />
    <Box name="Gray (hover)" cssVar="$gray-hover" hexcode={Colors.GRAY_HOVER} />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Black" cssVar="$black" hexcode={Colors.BLACK} />
    <Box name="Slate" cssVar="$slate" hexcode={Colors.SLATE} />
    <Box name="Slate (hover)" cssVar="$slate-hover" hexcode={Colors.SLATE_HOVER} />
  </Group.Horizontal>
</Group.Vertical>
```

### Brand Colors

```jsx
import Box from 'styleguide/Box';
import Colors from 'components/ui/Colors';
import Group from 'components/ui/Group';

<Group.Vertical spacing="none">
  <Group.Horizontal spacing="none">
    <Box name="Blue Light" cssVar="$blue-light" hexcode={Colors.BLUE_LIGHT} darkText />
    <Box name="Blue Lightest" cssVar="$blue-lightest" hexcode={Colors.BLUE_LIGHTEST} darkText />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Blue Primary (active)" cssVar="blue-primary-active" hexcode={Colors.BLUE_PRIMARY_ACTIVE} />
    <Box name="Blue Primary" cssVar="blue-primary" hexcode={Colors.BLUE_PRIMARY} />
    <Box name="Blue Primary (hover)" cssVar="blue-primary-hover" hexcode={Colors.BLUE_PRIMARY_HOVER} />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Blue Dark (active)" cssVar="$blue-dark-active" hexcode={Colors.BLUE_DARK_ACTIVE} />
    <Box name="Blue Dark" cssVar="$blue-dark" hexcode={Colors.BLUE_DARK} />
    <Box name="Blue Dark (hover)" cssVar="$blue-dark-hover" hexcode={Colors.BLUE_DARK_HOVER} />
  </Group.Horizontal>
</Group.Vertical>
```

### Validation Colors

```jsx
import Box from 'styleguide/Box';
import Colors from 'components/ui/Colors';
import Group from 'components/ui/Group';

<Group.Vertical spacing="none">
  <Group.Horizontal spacing="none">
    <Box name="Success (active)" cssVar="$success-active" hexcode={Colors.SUCCESS_ACTIVE} />
    <Box name="Success" cssVar="$success" hexcode={Colors.SUCCESS} />
    <Box name="Success (hover)" cssVar="$success-hover" hexcode={Colors.SUCCESS_HOVER} />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Error (active)" cssVar="$error-active" hexcode={Colors.ERROR_ACTIVE} />
    <Box name="Error" cssVar="$error" hexcode={Colors.ERROR} />
    <Box name="Error (hover)" cssVar="$error-hover" hexcode={Colors.ERROR_HOVER} />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Warning (active)" cssVar="$warning-active" hexcode={Colors.WARNING_ACTIVE} />
    <Box name="Warning" cssVar="$warning" hexcode={Colors.WARNING} />
    <Box name="Warning (hover)" cssVar="$warning-hover" hexcode={Colors.WARNING_HOVER} />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <Box name="Info (active)" cssVar="$info-active" hexcode={Colors.INFO_ACTIVE} />
    <Box name="Info" cssVar="$info" hexcode={Colors.INFO} />
    <Box name="Info (hover)" cssVar="$info-hover" hexcode={Colors.INFO_HOVER} />
  </Group.Horizontal>
</Group.Vertical>
```

### Gradients

There are no JS variables for the color gradients. Please stick to using regular CSS to use our gradients.

```jsx
import Box from 'styleguide/Box';
import Colors from 'components/ui/Colors';
import Group from 'components/ui/Group';

function GradientBox({ name, cssVar, startHex, endHex, fallbackColor }) {
  return (
    <Box
      name={name}
      cssVar={cssVar}
      hexcode={`${startHex} - ${endHex}`}
      style={{
        backgroundColor: fallbackColor,
        backgroundImage: `linear-gradient(to right, ${startHex}, ${endHex})`,
        width: 250,
      }}
    />
  );
}

<Group.Vertical spacing="none">
  <Group.Horizontal spacing="none">
    <GradientBox
      name="Blue Primary"
      cssVar="$blue-primary-gradient"
      startHex="#2fa4e2"
      endHex="#3c8ae6"
      fallbackColor={Colors.BLUE_PRIMARY}
    />
    <GradientBox
      name="Error"
      cssVar="error-color-gradient"
      startHex="#e33a52"
      endHex="#d62937"
      fallbackColor={Colors.ERROR}
    />
    <GradientBox
      name="Success"
      cssVar="success-color-gradient"
      startHex="#25bb91"
      endHex="#17a56c"
      fallbackColor={Colors.SUCCESS}
    />
  </Group.Horizontal>
  <Group.Horizontal spacing="none">
    <GradientBox
      name="Warning Primary"
      cssVar="$warning-color-gradient"
      startHex="#f1b45f"
      endHex="#f0ad4e"
      fallbackColor={Colors.WARNING}
    />
    <GradientBox
      name="Info"
      cssVar="$info-color-gradient"
      startHex="#7bd1ec"
      endHex="#6accea"
      fallbackColor={Colors.INFO}
    />
  </Group.Horizontal>
</Group.Vertical>
```

