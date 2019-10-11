// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import type {
  DatasetOption,
  NoSelection,
  UploadDropdownConfig,
} from 'components/DataUploadApp/types';

const TEXT = t('DataUploadApp.UploadDropdown');

// TODO(pablo): we should be able to use `void` instead of creating a fake
// "None" value to represent no selection. But right now our Dropdown doesn't
// allow undefined values as valid values for our Options. So when that gets
// fixed, we can change that here.
export const NO_SELECTION: NoSelection = '__NO_SELECTION__';

type Props = {
  dropdownConfig: UploadDropdownConfig,
  dropdownIndex: number,
  onDropdownSelectionChange: (
    dropdownIndex: number,
    selectedOption: DatasetOption | UploadDropdownConfig | NoSelection,
  ) => void,
};

type State = {
  selectedOption: DatasetOption | UploadDropdownConfig | NoSelection,
};

export default class UploadDropdown extends React.PureComponent<Props, State> {
  state = {
    selectedOption: NO_SELECTION,
  };

  @autobind
  onSelectionChange(
    selectedOption: DatasetOption | UploadDropdownConfig | NoSelection,
  ) {
    const { dropdownIndex } = this.props;
    this.setState({ selectedOption });
    this.props.onDropdownSelectionChange(dropdownIndex, selectedOption);
  }

  renderOptions() {
    const { options } = this.props.dropdownConfig;
    const mainOptions = options.map(opt => (
      <Dropdown.Option key={opt.optionName} value={opt}>
        {opt.optionName || null}
      </Dropdown.Option>
    ));
    return [
      <Dropdown.Option key={NO_SELECTION} value={NO_SELECTION}>
        None
      </Dropdown.Option>,
      ...mainOptions,
    ];
  }

  render() {
    const { dropdownLabelKey } = this.props.dropdownConfig;
    const { selectedOption } = this.state;
    return (
      <LabelWrapper
        inline
        label={TEXT.dropdownLabels[dropdownLabelKey]}
        className="data-upload-dropdown-container"
      >
        <Dropdown
          value={selectedOption}
          onSelectionChange={this.onSelectionChange}
        >
          {this.renderOptions()}
        </Dropdown>
      </LabelWrapper>
    );
  }
}
