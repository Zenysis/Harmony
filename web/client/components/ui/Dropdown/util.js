// @flow
export function stopDropdownClickEvent(event: SyntheticEvent<HTMLElement>) {
  // Prevent UI from scrolling to top due to link click
  event.preventDefault();
  event.stopPropagation();

  // stop other listeners of this same click event from propagating (this
  // stops the dropdown from hiding)
  event.nativeEvent.stopImmediatePropagation();
}
