import React, { Component } from 'react';
import PropTypes from 'prop-types';

import RankedCardItem from 'components/dashboard/ranked_card_item';
import RankedListItem from 'components/dashboard/ranked_list_item';
import { getPercentChange } from 'components/dashboard/rank_util';

function _shouldHideItem(itemData, historicalLevel) {
  return (
    typeof getPercentChange(
      itemData.currentData[historicalLevel],
      itemData.historicalData[historicalLevel],
    ) !== 'number'
  );
}

class RankedDisplay extends Component {
  /* eslint-disable class-methods-use-this, no-console */
  getComponentClass() {
    console.error('Method should be provided by subclass');
  }

  getRankedItemComponent() {
    console.error('Method should be provided by subclass');
  }
  /* eslint-enable class-methods-use-this, no-console */

  renderItems() {
    const rankedItems = [];
    const {
      data,
      hideMissingValues,
      historicalDisplayOrder,
      historicalLevel,
      maxVisible,
    } = this.props;
    const RankedItemComponent = this.getRankedItemComponent();

    // Show all results if maxVisible < 0
    let itemsToShow = data.length;
    if (maxVisible > 0 && maxVisible < data.length) {
      itemsToShow = maxVisible;
    }

    // HACK(stephen): I have no idea what the original `name` variable was
    // supposed to point to.
    const name = this.getComponentClass();
    for (let i = 0; i < itemsToShow; i++) {
      if (rankedItems.length === itemsToShow) {
        break;
      }
      // TODO(stephen): Make child items clickable and linked to child pages
      if (!hideMissingValues || !_shouldHideItem(data[i], historicalLevel)) {
        const item = (
          <RankedItemComponent
            key={`${name}-${i}`}
            index={i + 1}
            data={data[i]}
            denomSuffix={this.props.denomSuffix}
            groupSize={data.length}
            historicalDisplayOrder={historicalDisplayOrder}
            historicalLevel={historicalLevel}
          />
        );
        rankedItems.push(item);
      }
    }

    return rankedItems;
  }

  renderTitle() {
    if (!this.props.title.length) {
      return null;
    }
    return <h1 className="title">{this.props.title}</h1>;
  }

  render() {
    if (!this.props.data) {
      return null;
    }

    return (
      <div className={this.getComponentClass()}>
        {this.renderTitle()}
        <div className="items">{this.renderItems()}</div>
      </div>
    );
  }
}

RankedDisplay.propTypes = {
  data: PropTypes.array.isRequired,
  historicalLevel: PropTypes.string.isRequired,
  hideMissingValues: PropTypes.bool,
  denomSuffix: PropTypes.string,
  historicalDisplayOrder: PropTypes.array,
  maxVisible: PropTypes.number,
  title: PropTypes.string,
};

RankedDisplay.defaultProps = {
  denomSuffix: '',
  historicalDisplayOrder: [],
  maxVisible: 10,
  title: '',
  hideMissingValues: false,
};

/* eslint-disable class-methods-use-this */
class RankedCardDisplay extends RankedDisplay {
  getComponentClass() {
    return 'ranked-card-list';
  }

  getRankedItemComponent() {
    return RankedCardItem;
  }
}

class RankedListDisplay extends RankedDisplay {
  getComponentClass() {
    return 'ranked-list';
  }
  getRankedItemComponent() {
    return RankedListItem;
  }
}
/* eslint-enable class-methods-use-this */

export { RankedCardDisplay, RankedListDisplay };
