// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import UploadDropdown, {
  NO_SELECTION,
} from 'components/DataUploadApp/UploadDropdown';
import autobind from 'decorators/autobind';
import type {
  DatasetOption,
  NoSelection,
  UploadDropdownConfig,
} from 'components/DataUploadApp/types';

const TEXT = t('DataUploadApp');

type Props = {
  uploadDropdownConfig: UploadDropdownConfig,
};

type State = {
  dataset: DatasetOption | void,

  // an array of which dropdowns to currently display
  dropdownsToDisplay: Zen.Array<UploadDropdownConfig>,

  progress: number,
  success: boolean,
  error: any, // TODO(pablo, ian): what type should this be?
};

export default class DataUploadApp extends React.Component<Props, State> {
  static renderToDOM(elementId: string = 'app') {
    const {
      uploadCategories,
    } = window.__JSON_FROM_BACKEND.dataUploadAppOptions;
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(
      <DataUploadApp uploadDropdownConfig={uploadCategories} />,
      elt,
    );
  }

  state = {
    dataset: undefined,
    dropdownsToDisplay: Zen.Array.create([this.props.uploadDropdownConfig]),
    progress: -1,
    success: false,
    error: undefined,
  };

  isDatasetSelected(): boolean {
    return this.state.dataset !== undefined;
  }

  @autobind
  handleChange(e: SyntheticEvent<HTMLInputElement>) {
    const { dataset } = this.state;
    if (dataset && e.target instanceof HTMLInputElement) {
      const formData = new FormData();
      const filesArray = Array(...e.target.files);
      filesArray.forEach(file => {
        formData.append('files[]', file);
      });

      formData.append('category', dataset.filePrepend);
      $.ajax({
        url: '/upload-data', // Server script to process data
        type: 'POST',
        xhr: () => {
          if ($.ajaxSettings.xhr) {
            const myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
              // For handling the progress of the upload
              myXhr.upload.addEventListener(
                'progress',
                this.progressHandlingFunction,
                false,
              );
            }
            return myXhr;
          }
          return undefined;
        },
        success: () => {
          this.setState({ success: true });
        },
        error: err => {
          this.setState({
            success: false,
            error: err,
          });
        },
        data: formData,

        // Options to tell jQuery not to process data or worry about
        // content-type.
        cache: false,
        contentType: false,
        processData: false,
      });

      analytics.track('Uploaded file(s)', {
        files: filesArray.map(f => f.name),
      });
    }
  }

  @autobind
  progressHandlingFunction(e: ProgressEvent) {
    if (e.lengthComputable) {
      this.setState({
        // prettier-ignore
        progress: (e.loaded / e.total) * 100
      });
    }
  }

  @autobind
  onDropdownSelectionChange(
    dropdownIndex: number,
    selectedOption: DatasetOption | UploadDropdownConfig | NoSelection,
  ) {
    this.setState(prevState => {
      const { dropdownsToDisplay } = prevState;
      if (selectedOption === NO_SELECTION) {
        // remove all dropdowns that come after this one
        return {
          dropdownsToDisplay: dropdownsToDisplay.slice(0, dropdownIndex + 1),
          dataset: undefined,
        };
      }

      // we selected a dataset
      if (
        typeof selectedOption !== 'string' &&
        'filePrepend' in selectedOption
      ) {
        return {
          dataset: Zen.cast<DatasetOption>(selectedOption),
        };
      }

      // we selected an UploadDropdownConfig, so remove everything that came
      // after and insert this new UploadDropdownConfig
      const newDropdownConfig = Zen.cast<UploadDropdownConfig>(selectedOption);
      return {
        dropdownsToDisplay: dropdownsToDisplay
          .slice(0, dropdownIndex + 1)
          .push(newDropdownConfig),
      };
    });
  }

  maybeRenderProgress() {
    const { progress, success, error } = this.state;
    if (progress <= 0) {
      return null;
    }
    if (success) {
      return (
        <div>
          <p>
            {TEXT.successMessage}{' '}
            <strong>{TEXT.dataNotAvailableYetMessage}</strong>
            {TEXT.waitForAnEngineerMessage}
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="alert-danger">
          <p>{TEXT.failureMessage}</p>
        </div>
      );
    }
    return (
      <p>
        {TEXT.uploadProgress} {progress.toFixed(1)}%
      </p>
    );
  }

  renderUploadDropdowns(): React.Node {
    return this.state.dropdownsToDisplay.map((dropdownConfig, i) => {
      const { dropdownLabelKey, optionName } = dropdownConfig;
      return (
        <UploadDropdown
          key={`${dropdownLabelKey}-${optionName || ''}`}
          dropdownConfig={dropdownConfig}
          dropdownIndex={i}
          onDropdownSelectionChange={this.onDropdownSelectionChange}
        />
      );
    });
  }

  renderFilePickerButton() {
    const disableButton = !this.isDatasetSelected();
    const disabledClass = disableButton ? 'disabled' : '';
    return (
      <p>
        <span
          className={`btn btn-primary btn-file upload-button ${disabledClass}`}
        >
          {TEXT.browseFiles}{' '}
          <input
            type="file"
            onChange={this.handleChange}
            multiple
            disabled={disableButton}
          />
        </span>
      </p>
    );
  }

  render() {
    return (
      <div className="page-container">
        <div className="page-container__inner">
          <div className="upload-app">
            <p className="upload-app__main-instructions">
              <strong>{TEXT.selectFiles}</strong>
            </p>
            {this.renderUploadDropdowns()}
            {this.renderFilePickerButton()}
            {this.maybeRenderProgress()}
          </div>
        </div>
      </div>
    );
  }
}
