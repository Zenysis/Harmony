import React from 'react';

import PercentChange from 'components/dashboard/percent_change';
import RankedListItem from 'components/dashboard/ranked_list_item';

// TODO(stephen, ian): Figure out better footer for the national level
const NATION_NAME = window.__JSON_FROM_BACKEND.nationName;

// Default ordering of historical results within a card.
// TODO(stephen): Pass in config
const HISTORICAL_ORDER = [
  'month',
  'quarter',
  'year',
  'monthOfYear',
  'quarterToDate',
  'yearToDate',
];

function renderMetadataLine(name, value) {
  return (
    <div key={name} className="metadata-line">
      <span className="metadata-name">{name}</span>
      <span className="metadata-value">{value}</span>
    </div>
  );
}

class RankedCardItem extends RankedListItem {
  renderHistoricalData() {
    const { data } = this.props;
    const lines = [];
    for (let i = 0; i < HISTORICAL_ORDER.length; i++) {
      const key = HISTORICAL_ORDER[i];
      // Don't include current level in output
      if (key !== this.props.historicalLevel) {
        const name = t(`dashboard.historical_labels.${key}`);
        const percentChangeItem = (
          <PercentChange
            decreaseIsGood={data.decreaseIsGood}
            currentValue={data.currentData[key]}
            initialValue={data.historicalData[key]}
          />
        );
        lines.push(renderMetadataLine(name, percentChangeItem));
      }
    }

    return lines;
  }

  renderMetadata() {
    const rawValueLabel = 'Current'; // TODO(stephen): Translate
    const rawValueItem = this.renderRawValue();
    return (
      <div className="metadata">
        {renderMetadataLine(rawValueLabel, rawValueItem)}
        {this.renderHistoricalData()}
      </div>
    );
  }

  renderCardFooter() {
    const { denomSuffix, groupSize, index } = this.props;

    // Nation level searches have no granularity.
    // TODO(stephen, ian): This was a really annoying bug.
    // Should nation be a granularity?
    let geoRank = <span>Across {NATION_NAME}</span>;
    if (denomSuffix.length) {
      // TODO(stephen): Get rank title from non geo-specific location
      geoRank = (
        <span>
          <b>{t('dashboard.geo_rank.title')}:</b> {index} / {groupSize}{' '}
          {denomSuffix}
        </span>
      );
    }
    return <span className="geo-rank">{geoRank}</span>;
  }

  render() {
    const { historicalLevel } = this.props;
    // TODO(stephen): Compute this based on the data. Translate when ready
    const placeholderSubtitle = `This ${historicalLevel}`;
    const url = this.getClickUrl();
    const description = this.renderItemDescription();
    const percentChange = this.renderPercentChange(placeholderSubtitle, false);
    const metadata = this.renderMetadata();
    const footer = this.renderCardFooter();

    return (
      <div className="ranked-card-container">
        <div className="ranked-card-item">
          <a href={url}>
            <div className="card-header">{description}</div>
            <div className="card-body">
              <div className="percent-change-panel">{percentChange}</div>
              {metadata}
            </div>
            <div className="card-footer">{footer}</div>
          </a>
        </div>
      </div>
    );
  }
}

export default RankedCardItem;
