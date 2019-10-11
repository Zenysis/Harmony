import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Select from 'react-select';

function filterOptions(options, filter) {
  if (!filter) {
    return options;
  }

  // Goal of the following is to show the group label when one of it's
  // children is matched
  const lowercaseFilter = filter.toLowerCase();
  const matchedOptions = {};
  const matchedGroups = {};
  options.forEach((option) => {
    if (option.label.toLowerCase().indexOf(lowercaseFilter) >= 0) {
      matchedOptions[option.value] = true;
      if (option.isChildOption) {
        matchedGroups[option.groupLabel] = true;
      }
    }
  });

  return options.filter(
    option =>
      matchedOptions[option.value] ||
      (option.isGroupLabel && matchedGroups[option.label]),
  );
}

function renderOption(option) {
  const className = classNames({
    'select-with-groups-group-label': option.isGroupLabel,
    'select-with-groups-child-option': option.isChildOption,
  });

  return <div className={className}>{option.label}</div>;
}

const propTypes = {
  options: PropTypes.array.isRequired,

  disabled: PropTypes.bool,
};

const defaultProps = {
  disabled: false,
};

export default class SelectWithGroups extends React.Component {
  translateOptions() {
    const newOptions = [];

    this.props.options.forEach((option) => {
      if (!option.groupLabel) {
        newOptions.push(option);
        return;
      }

      newOptions.push({
        label: option.groupLabel,
        isGroupLabel: true,
        value: `groupLabel-${option.groupLabel}`,
        disabled: true,
      });
      option.childOptions.forEach((childOption) => {
        newOptions.push(
          Object.assign(childOption, {
            isChildOption: true,
            groupLabel: option.groupLabel,
          }),
        );
      });
    });

    return newOptions;
  }

  render() {
    return (
      <Select
        {...this.props}
        optionRenderer={renderOption}
        options={this.translateOptions.call(this)}
        filterOptions={filterOptions}
      />
    );
  }
}

SelectWithGroups.propTypes = propTypes;
SelectWithGroups.defaultProps = defaultProps;
