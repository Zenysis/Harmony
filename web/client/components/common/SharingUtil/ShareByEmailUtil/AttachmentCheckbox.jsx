// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import Checkbox from 'components/ui/Checkbox/index';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import TableQueryResultState from 'models/visualizations/Table/TableQueryResultState';
import autobind from 'decorators/autobind';
import exportQueryData from 'components/common/SharingUtil/exportQueryData';
import getFieldsFromQueryResultSpec from 'components/common/SharingUtil/getFieldsFromQueryResultSpec';
import { EXPORT_SELECTIONS } from 'components/common/SharingUtil/registry';
import { cancelPromises } from 'util/promiseUtil';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ExportSelection } from 'components/common/SharingUtil/types';

const TEXT = t('query_result.common.share_analysis');

type Props = {
  addAttachmentToEmail: (
    exportSelection: string,
    filename: string,
    content: string,
  ) => void,
  isDataAttached: boolean,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  resetAttachmentToEmail: () => void,
  setSelectedAttachments: (
    selectedValues: $ReadOnlyArray<ExportSelection>,
  ) => void,
};

type State = {
  loadingData: boolean,
};

export default class AttachmentCheckbox extends React.PureComponent<
  Props,
  State,
> {
  _queryPromises: { [string]: Promise<void>, ... } = {};

  state: State = {
    loadingData: false,
  };

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

  @autobind
  setAttachments(shouldAttachData: boolean) {
    const { querySelections, queryResultSpec } = this.props;
    const dataExport = EXPORT_SELECTIONS.EXCEL_ALL;
    if (shouldAttachData) {
      const promiseId = uniqueId();
      this.setState({ loadingData: true });
      this._queryPromises[promiseId] = TableQueryResultState.runQuery(
        querySelections,
        queryResultSpec,
      ).then(queryResultState => {
        delete this._queryPromises[promiseId];

        const resultData = exportQueryData(
          queryResultState.queryResult(),
          getFieldsFromQueryResultSpec(queryResultSpec, querySelections),
          'csv',
          queryResultSpec.groupBySettings().groupings(),
        );
        this.setState({ loadingData: false });
        this.props.addAttachmentToEmail(
          dataExport,
          resultData.filename,
          resultData.content,
        );
        this.props.setSelectedAttachments([dataExport]);
      });
    } else {
      this.props.resetAttachmentToEmail();
    }
  }

  @autobind
  onCheckBoxToggle() {
    this.setAttachments(!this.props.isDataAttached);
  }

  render(): React.Element<typeof Checkbox> {
    if (this.state.loadingData) {
      return (
        <Checkbox
          className="share-message-label"
          value={this.props.isDataAttached}
          onChange={this.onCheckBoxToggle}
          label={TEXT.attachDataTextPreparingCSV}
          labelPlacement="right"
        >
          <LoadingSpinner />
        </Checkbox>
      );
    }

    return (
      <Checkbox
        className="share-message-label"
        value={this.props.isDataAttached}
        onChange={this.onCheckBoxToggle}
        label={TEXT.attachDataText}
        labelPlacement="right"
      />
    );
  }
}
