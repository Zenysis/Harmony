// @flow
import * as React from 'react';

import QueryResult from 'components/QueryResult';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = ChartSize & {
  onRender: HTMLDivElement => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  viewType: ResultViewType,
};

// This is the time we should wait before triggering the onRender callback.
// NOTE(stephen): This is an inexact science. Since the visualizations use
// third-party libraries, it is possible that the new rendering size will cause
// the library to do more work or make extra network requests than the one
// that is currently in view.
const RENDER_DELAY = 1000;

/**
 * Render the provided QueryResultSpec off screen so the QueryResult can be
 * easily exported.
 */
export default class DownloadableQueryResult extends React.Component<Props> {
  _mainDivElt: $RefObject<'div'> = React.createRef();
  _timeoutId: TimeoutID | void = undefined;

  componentDidMount() {
    this._timeoutId = setTimeout(() => {
      if (this._mainDivElt.current) {
        this.props.onRender(this._mainDivElt.current);
      }
    }, RENDER_DELAY);
  }

  shouldComponentUpdate() {
    // DownloadableQueryResult should never have the queryResultSpec changed
    // behind the scenes. It is strictly a use-once, render, throw away type
    // of component.
    return false;
  }

  componentWillUnmount() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }

  getStyle() {
    const { height, width } = this.props;
    const { outerWidth } = window;

    // Position the element off the screen with the desired size so it can be
    // converted to a canvas without affecting the current layout.
    return {
      position: 'fixed',
      transform: `translate3d(${outerWidth}px, 0, 0)`,
      textAlign: 'initial',
      height,
      width,
    };
  }

  render() {
    const { queryResultSpec, querySelections, viewType } = this.props;
    return (
      <div ref={this._mainDivElt} style={this.getStyle()}>
        <QueryResult
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
        />
      </div>
    );
  }
}
