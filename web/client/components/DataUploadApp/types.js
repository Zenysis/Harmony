// @flow

// TODO(pablo): we should be able to use `void` instead of creating a fake
// NoSelection value to represent no selection. But right now our Dropdown
// doesn't allow undefined values as valid values for our Options. So when
// that gets fixed, we can change that here.
export type NoSelection = '__NO_SELECTION__';

export type DatasetOption = {
  optionName: string,
  filePrepend: string,
};

export type UploadDropdownConfig = {
  dropdownLabelKey: string,
  optionName: string | void,
  options: $ReadOnlyArray<UploadDropdownConfig | DatasetOption>,
};
