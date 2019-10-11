import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { autobind } from 'decorators';

// The default speed the timeline plays at.
const DEFAULT_TIMELINE_SPEED = 300;

// The date bucket to display when the map is first rendered
const TIMELINE_START_IDX = 0;

const propTypes = {
  dates: PropTypes.array.isRequired,
  onDateChange: PropTypes.func.isRequired, // f(newDate, newDateIndex)
};

export default class MapTimeline extends Component {
  constructor(props) {
    super(props);
    this._dateFields = null;
    this.state = {
      usingPlay: false,
      timelineDateSelected: props.dates[TIMELINE_START_IDX],
    };

    this.handleLeftClick = this.handleDateChange.bind(this, 'left');
    this.handleRightClick = this.handleDateChange.bind(this, 'right');
    this._mapSliderRef = undefined;
  }

  componentWillUnmount() {
    clearInterval(this.state.usingPlay);
  }

  getSliderValue() {
    return parseInt(this._mapSliderRef.value, 10);
  }

  @autobind
  handleMapRangeChange() {
    this.onDateIndexChange(this.getSliderValue());
  }

  handleDateChange(direction) {
    const dateChangeValue = direction === 'right' ? 1 : -1;
    const newDateIndex = this.getSliderValue() + dateChangeValue;
    if (newDateIndex < 0 || newDateIndex >= this.props.dates.length) {
      return;
    }

    // Propagate the new date index change.
    this.onDateIndexChange(newDateIndex);
    // Update the slider to reflect the new value.
    this._mapSliderRef.value = newDateIndex;
  }

  @autobind
  playButton() {
    if (this.state.usingPlay) {
      return;
    }
    const newPlayState = setInterval(() => {
      let newDateIndex = this.getSliderValue() + 1;
      if (newDateIndex >= this.props.dates.length) {
        newDateIndex = 0;
      }

      // Update the slider with the new date index.
      this._mapSliderRef.value = newDateIndex;
      this.onDateIndexChange(newDateIndex);
      // Jonathon wants this speed, it's pretty speedy.
      // maybe dropdown?
    }, DEFAULT_TIMELINE_SPEED);

    this.setState({
      usingPlay: newPlayState,
    });
  }

  @autobind
  pauseButton() {
    this.setState(prevState => {
      const newPlayState = clearInterval(prevState.usingPlay);
      return { usingPlay: newPlayState };
    });
  }

  onDateIndexChange(newDateIndex) {
    const newDate = this.props.dates[newDateIndex];
    this.props.onDateChange(newDateIndex);
    this.setState({
      timelineDateSelected: newDate,
    });
  }

  render() {
    if (!this.props.dates.length) {
      return null;
    }

    return (
      <div>
        <div className="date-view">
          <span className="timeline-title">
            {t('query_result.map.timeline_curr_date_selected')}:
          </span>
          <span className="timeline-date-selected">
            {this.state.timelineDateSelected}
          </span>
        </div>
        <div className="forward-reverse-buttons">
          <span>
            <button
              type="button"
              className="btn-lg glyphicon glyphicon-menu-left"
              onClick={this.handleLeftClick}
            />
          </span>
          <span>
            {this.state.usingPlay ? (
              <button
                type="button"
                className="btn-lg glyphicon glyphicon-pause"
                onClick={this.pauseButton}
              />
            ) : (
              <button
                type="button"
                className="btn-lg glyphicon glyphicon-play"
                onClick={this.playButton}
              />
            )}
          </span>
          <span>
            <button
              type="button"
              className="btn-lg glyphicon glyphicon-menu-right"
              onClick={this.handleRightClick}
            />
          </span>
        </div>
        <input
          type="range"
          ref={ref => {
            this._mapSliderRef = ref;
          }}
          min={0}
          max={this.props.dates.length - 1}
          defaultValue={TIMELINE_START_IDX}
          onChange={this.handleMapRangeChange}
          className="map-slider"
        />
      </div>
    );
  }
}

MapTimeline.propTypes = propTypes;
