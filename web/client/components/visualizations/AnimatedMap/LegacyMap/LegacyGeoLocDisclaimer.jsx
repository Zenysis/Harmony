import PropTypes from 'prop-types';
import React from 'react';

import BaseModal from 'components/ui/BaseModal';

class LegacyGeoLocDisclaimer extends React.Component {
  constructor() {
    super();
    this.state = {
      showNames: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.toggleNames = this.toggleNames.bind(this);
  }

  toggleNames(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      showNames: !this.state.showNames,
    });
  }

  getGeojsonDisclaimer() {
    if (this.props.currentDisplay === 'tiles') {
      return <div>{t('query_result.map.disclaimer.geojson_text')}</div>;
    }
    return null;
  }

  handleClose() {
    this.setState({
      showNames: false,
    });
  }

  getShowNamesWidget() {
    const namesList = this.props.badGeoObjs.map((geoObj, idx) => (
      <li key={`${geoObj.geoName}_${idx}`}>{geoObj.geoName}</li>
    ));

    return (
      <span>
        <a href="#" onClick={this.toggleNames}>
          {t('query_result.map.disclaimer.view_names')}
        </a>
        <BaseModal
          show={this.state.showNames}
          closeButtonText={t('query_result.map.disclaimer.modal_close')}
          onRequestClose={this.handleClose}
          showPrimaryButton={false}
          width={500}
          height={450}
          title={t('query_result.map.disclaimer.modal_title')}
        >
          <ul>{namesList}</ul>
        </BaseModal>
      </span>
    );
  }

  render() {
    const numBadGeos = this.props.badGeoObjs.length;
    if (numBadGeos < 1) {
      return null;
    }

    return (
      <div className="alert alert-warning" role="alert">
        {this.getGeojsonDisclaimer()}
        {numBadGeos} {t('query_result.map.disclaimer.text')}{' '}
        {this.getShowNamesWidget()}
      </div>
    );
  }
}

LegacyGeoLocDisclaimer.propTypes = {
  currentDisplay: PropTypes.string.isRequired,
  badGeoObjs: PropTypes.array.isRequired,
};

export default LegacyGeoLocDisclaimer;
