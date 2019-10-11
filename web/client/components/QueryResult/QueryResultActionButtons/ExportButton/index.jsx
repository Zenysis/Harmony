// @flow
import * as React from 'react';
import memoizeOne from 'memoize-one';

import AQTExportDropdown from 'components/QueryResult/QueryResultActionButtons/ExportButton/AQTExportDropdown';
import DirectoryService from 'services/DirectoryService';
import Icon from 'components/ui/Icon';
import QuerySelections from 'models/core/wip/QuerySelections';
import SQTExportDropdown from 'components/QueryResult/QueryResultActionButtons/ExportButton/SQTExportDropdown';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { fetchSiteViewerInfo } from 'permissions';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type User from 'services/models/User';

const TEXT = t('QueryApp.ExportButton');

const SITE_ROLE = 'SITE';
const VIEW_ONLY_TAG = 'view_only';
const WEBSITE_RESOURCE = 'website';

type Props = {
  getUser: string => Promise<Array<User>>,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  showLabel: boolean,
  labelClassName: string,
  buttonClassName: string,
  className: string,
};

type State = {
  authorizationChecked: boolean,
  isUserAuthForDownload: boolean,
};

class ExportButton extends React.PureComponent<Props, State> {
  static defaultProps = {
    getUser: DirectoryService.getUser,
    labelClassName: 'action-button-text',
    buttonClassName:
      'action-button dashboard-item-button query-result-export-button__dropdown-button',
    className: 'query-result-export-button__dropdown',
  };

  state = {
    authorizationChecked: false,
    isUserAuthForDownload: false,
  };

  componentDidMount() {
    fetchSiteViewerInfo(
      this.props.getUser,
      DirectoryService.getActiveUsername(),
    ).then(isUserAuthForDownload => {
      this.setState({
        authorizationChecked: true,
        isUserAuthForDownload,
      });
    });
  }

  renderDropdownLabel() {
    const label = this.props.showLabel ? (
      <span className={this.props.labelClassName}>{TEXT.title}</span>
    ) : null;

    return (
      <React.Fragment>
        <Icon type="download" />
        {label}
      </React.Fragment>
    );
  }

  renderDropdownComponent() {
    const { querySelections, queryResultSpec } = this.props;
    if (querySelections instanceof SimpleQuerySelections) {
      return (
        <SQTExportDropdown
          buttonClassName={this.props.buttonClassName}
          className={this.props.className}
          label={this.renderDropdownLabel()}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
        />
      );
    }

    if (querySelections instanceof QuerySelections) {
      return (
        <AQTExportDropdown
          buttonClassName={this.props.buttonClassName}
          className={this.props.className}
          label={this.renderDropdownLabel()}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
        />
      );
    }

    throw new Error('[ExportButton] Invalid type of `querySelections` props');
  }

  render() {
    const { authorizationChecked, isUserAuthForDownload } = this.state;
    if (!(authorizationChecked && isUserAuthForDownload)) {
      return null;
    }

    return this.renderDropdownComponent();
  }
}

export default withScriptLoader(ExportButton, VENDOR_SCRIPTS.toastr);
