// @flow
import React, { Component } from 'react';
import moment from 'moment';
import numeral from 'numeral';

import DataQuality from 'models/DataQualityApp/DataQuality';
import Field from 'models/core/Field';
import autobind from 'decorators/autobind';
import type { FieldInfo } from 'services/FieldInfoService';

const TEXT = t('query_form.selections.infoBox');

const SHOW_SELECTION_DATE_RANGES =
  window.__JSON_FROM_BACKEND.ui.showSelectionDateRanges;

type Props = {
  dataQuality: DataQuality | null,
  field: Field,
  onRemoveClick: Field => void,

  fieldInfo: FieldInfo | null,
};

type State = {
  showDetails: boolean,
};

export default class SelectionsRow extends Component<Props, State> {
  static defaultProps = {
    fieldInfo: null,
  };

  state = {
    showDetails: false,
  };

  maybeGetRenderedInfo() {
    const info = this.props.fieldInfo;
    if (!info) {
      return null;
    }
    const humanReadableFormula = info.humanReadableFormulaHtml ? (
      <p>
        <strong>Formula</strong>: &nbsp;
        <span
          className="query-health-indicator__formula"
          dangerouslySetInnerHTML={{ __html: info.humanReadableFormulaHtml }}
        />
      </p>
    ) : null;

    const details =
      humanReadableFormula && this.state.showDetails ? (
        <div className="query-health-indicator__tooltip_text">
          {humanReadableFormula}
        </div>
      ) : null;

    const dateRange = this.maybeRenderDateRange();
    let line = `${numeral(info.count).format('0,0')} ${TEXT.dataPointsSuffix}`;

    if (dateRange) {
      line = `${line}, ${dateRange}`;
    }

    const dataQuality = this.maybeRenderDataQuality();

    if (dataQuality) {
      line = (
        <span>
          {`${line}, `}
          {dataQuality}
        </span>
      );
    }

    const content = (
      <span>
        {line}
        <span className="query-health-indicator__tooltip">
          {info.humanReadableFormulaHtml ? 'ⓘ' : ''}
          {details}
        </span>
      </span>
    );
    return <span className="query-health-indicator__info">{content}</span>;
  }

  @autobind
  onRemoveClick() {
    this.props.onRemoveClick(this.props.field);
  }

  @autobind
  onToggleDetailsClick() {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  }

  maybeRenderDataQuality() {
    const { dataQuality, field } = this.props;

    if (!dataQuality || !dataQuality.success()) {
      return null;
    }

    const score = dataQuality.score().toFixed(2);

    return (
      <a
        href={`/data-quality?indicator=${field.id()}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {`${TEXT.dataQuality}: ${score}/10`}
      </a>
    );
  }

  maybeRenderDateRange() {
    const { fieldInfo } = this.props;
    if (!fieldInfo || !SHOW_SELECTION_DATE_RANGES) {
      return null;
    }

    const { endDate, startDate } = fieldInfo;
    const formattedStartDate = moment(startDate).format('D MMM YYYY');
    if (startDate === endDate) {
      return `${TEXT.dataAvailable} ${formattedStartDate}`;
    }

    const formattedEndDate = moment(endDate).format('D MMM YYYY');
    return `${TEXT.dataAvailable} ${formattedStartDate} - ${formattedEndDate}`;
  }

  render() {
    return (
      <div className="query-health-indicator">
        <div
          role="button"
          className="query-health-indicator__title"
          onClick={this.onToggleDetailsClick}
        >
          {this.props.field.getCanonicalName()}
          {this.maybeGetRenderedInfo()}
        </div>
        <button
          type="button"
          className="query-health-indicator__close"
          aria-label="Close"
          onClick={this.onRemoveClick}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    );
  }
}
