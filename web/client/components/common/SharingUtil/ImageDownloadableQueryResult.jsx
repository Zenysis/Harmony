// @flow
import * as React from 'react';

import QueryResult from 'components/QueryResult';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { StyleObject } from 'types/jsCore';

type Props = {
  ...ChartSize,
  isOffScreen: boolean,
  onRender: HTMLDivElement => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ResultViewType,
};

type DefaultProps = {
  isOffScreen: boolean,
};

export default class ImageDownloadableQueryResult extends React.Component<Props> {
  mainDivElt: $ElementRefObject<'div'> = React.createRef();
  static defaultProps: DefaultProps = {
    isOffScreen: false,
  };

  componentDidMount() {
    const { onRender } = this.props;
    const { current } = this.mainDivElt;
    if (!current) {
      return;
    }

    onRender(current);
  }

  getStyle(): StyleObject {
    const { height, width, isOffScreen } = this.props;
    const { outerWidth } = window;

    // once isOffScreen is set,
    // Position the element off the screen with the desired size so it can be
    // converted to a canvas without affecting the current layout.
    // HACK(stephen.byarugaba): outerWidth is multipled by 2 to ensure that the
    // element is way off the screen.
    return {
      position: 'fixed',
      ...(isOffScreen && {
        transform: `translate3d(${outerWidth * 2}px, 0, 0)`,
      }),
      textAlign: 'initial',
      height,
      width,
    };
  }

  render(): React.Node {
    const { queryResultSpec, querySelections, viewType } = this.props;
    return (
      <div ref={this.mainDivElt} style={this.getStyle()}>
        <QueryResult
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
        />
      </div>
    );
  }
}
