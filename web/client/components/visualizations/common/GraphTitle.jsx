import React from 'react';
import PropTypes from 'prop-types';

import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';

const propTypes = {
  settings: TitleSettings.type().isRequired,
  isMobile: PropTypes.bool,
};

const defaultProps = {
  isMobile: false,
};

export default function GraphTitle({ isMobile, settings }) {
  const {
    titleFontSize,
    subtitleFontSize,
    title,
    subtitle,
    titleFontFamily,
    titleFontColor,
  } = settings.modelValues();
  const subtitleStyle = {
    fontSize: isMobile ? '10px' : subtitleFontSize,
    color: titleFontColor,
    fontFamily: titleFontFamily,
  };
  const titleStyle = {
    fontSize: isMobile ? '12px' : titleFontSize,
    lineHeight: isMobile ? '16px' : '',
    marginTop: isMobile ? '12px' : '',
    color: titleFontColor,
    fontFamily: titleFontFamily,
  };
  return (
    <div className="graph-title-block">
      <div className="graph-title" style={titleStyle}>
        {title}
      </div>
      <div className="date-range" style={subtitleStyle}>
        {subtitle}
      </div>
    </div>
  );
}

GraphTitle.propTypes = propTypes;
GraphTitle.defaultProps = defaultProps;
