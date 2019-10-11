// @flow
import * as React from 'react';

import ResizeService from 'services/ResizeService';
import autobind from 'decorators/autobind';
import { hocSetup } from 'util/util';
import type { Dimensions } from 'types/common';
import type { SubscriptionObject } from 'services/ResizeService';

/**
 * Check if two dimensions have changed.
 * (this uses the common Dimensions type in types/common.js)
 */
export function dimensionsChanged(dim1: Dimensions, dim2: Dimensions): boolean {
  return dim1.width !== dim2.width || dim1.height !== dim2.height;
}

type RequiredProps = {
  /** the wrapped component must have a `windowDimensions` prop */
  windowDimensions: Dimensions,
};

type State = {
  /** Track the window dimensions onResize */
  windowDimensions: Dimensions,
};

const $window = $(window);

type HOCProps<OldProps> = $Diff<OldProps, { windowDimensions: Dimensions }>;

export default function withWindowResizeSubscription<Props: RequiredProps>(
  WrappedComponent: React.ComponentType<Props>,
): Class<React.Component<HOCProps<Props>, State>> {
  class WithWindowResizeSubscription extends React.PureComponent<
    HOCProps<Props>,
    State,
  > {
    state = {
      windowDimensions: { width: $window.width(), height: $window.height() },
    };

    _resizeSubscription: ?SubscriptionObject = undefined;

    componentDidMount() {
      this._resizeSubscription = ResizeService.subscribe(this.onResize);
    }

    componentWillUnmount() {
      ResizeService.unsubscribe(this._resizeSubscription);
    }

    @autobind
    onResize(event: Event, windowDimensions: Dimensions) {
      this.setState({ windowDimensions });
    }

    render() {
      return (
        <WrappedComponent
          windowDimensions={this.state.windowDimensions}
          {...this.props}
        />
      );
    }
  }

  hocSetup(
    'withWindowResizeSubscription',
    WithWindowResizeSubscription,
    WrappedComponent,
  );

  return WithWindowResizeSubscription;
}
