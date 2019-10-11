import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DashboardSection extends Component {
  maybeRenderTitleBlock() {
    const {
      hideMissingValues,
      title,
      titleLink,
      toggleHideMissingValues,
    } = this.props;

    if (!title) {
      return null;
    }

    const hideValuesCheckbox = toggleHideMissingValues ? (
      <label className="hideValues-control">
        <input
          className="hideValues-checkbox"
          type="checkbox"
          onChange={() => toggleHideMissingValues(title)}
          checked={hideMissingValues}
        />
        {t('dashboard.hide_value_checkbox')}
      </label>
    ) : null;

    const sectionTitle = <span className="section-title">{title}</span>;
    return (
      <div className="section-title-block">
        {titleLink ? <a href={titleLink}>{sectionTitle}</a> : sectionTitle}
        {hideValuesCheckbox}
      </div>
    );
  }

  render() {
    return (
      <div className="dashboard-section">
        {this.maybeRenderTitleBlock()}
        {this.props.children}
      </div>
    );
  }
}

DashboardSection.propTypes = {
  children: PropTypes.node.isRequired,
  hideMissingValues: PropTypes.bool,
  toggleHideMissingValues: PropTypes.func,
  title: PropTypes.string,
  titleLink: PropTypes.string,
};

DashboardSection.defaultProps = {
  hideMissingValues: false,
  toggleHideMissingValues: undefined,
  title: '',
  titleLink: '',
};

export default DashboardSection;
