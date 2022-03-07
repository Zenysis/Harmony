// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import EmbeddedContent from 'components/EmbeddedQueryApp/EmbeddedContent';
import ExportButton from 'components/common/ExportButton';
import ProgressBar from 'components/ui/ProgressBar';
import autobind from 'decorators/autobind';
import type { EmbedRequest } from 'components/EmbeddedQueryApp/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type DefaultProps = {
  dashboard: $PropertyType<EmbedRequest, 'dashboard'>,
  enableExport: boolean,
  height: number,
  query: $PropertyType<EmbedRequest, 'query'>,
  smallMode: boolean,
  width: number,
};

type Props = DefaultProps;

type State = {
  hasError: boolean,
  showExportButton: boolean,
};

const EMBED_REQUEST: EmbedRequest | void = window.__JSON_FROM_BACKEND.embedded;

/**
 * Render an embedded query (either in serialized AQT query selections + spec
 * form or in dashboard spec form) and draw it to the page at the specified
 * height/width.
 */
export default class EmbeddedQueryApp extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    dashboard:
      EMBED_REQUEST !== undefined ? EMBED_REQUEST.dashboard : undefined,
    enableExport: true,
    height: EMBED_REQUEST !== undefined ? EMBED_REQUEST.height : 100,
    query: EMBED_REQUEST !== undefined ? EMBED_REQUEST.query : undefined,
    smallMode: false,
    width: EMBED_REQUEST !== undefined ? EMBED_REQUEST.width : 100,
  };

  static renderToDOM(elementId?: string = 'app') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<EmbeddedQueryApp />, elt);
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  ref: $ElementRefObject<'div'> = React.createRef();
  state: State = {
    hasError: false,
    showExportButton: false,
  };

  @autobind
  onHoverStart() {
    this.setState({ showExportButton: true });
  }

  @autobind
  onHoverEnd() {
    this.setState({ showExportButton: false });
  }

  maybeRenderErrorMessage(): string | null {
    if (!this.state.hasError) {
      return null;
    }

    // TODO(stephen): Render a more useful error message.
    return 'Something went wrong :(';
  }

  maybeRenderExportButton(): React.Node {
    const { hasError, showExportButton } = this.state;
    if (!this.props.enableExport || hasError || !showExportButton) {
      return null;
    }
    return (
      <ExportButton
        className="embedded-query-app__export-button"
        parentElt={this.ref.current}
        size="small"
      />
    );
  }

  render(): React.Node {
    const { dashboard, height, query, smallMode, width } = this.props;
    return (
      <div
        ref={this.ref}
        className="embedded-query-app"
        onMouseLeave={this.onHoverEnd}
        onMouseMove={this.onHoverStart}
        style={{ height, width }}
      >
        {this.maybeRenderErrorMessage()}
        {this.maybeRenderExportButton()}
        {!this.state.hasError && (
          <EmbeddedContent
            dashboard={dashboard}
            query={query}
            smallMode={smallMode}
          />
        )}
      </div>
    );
  }
}
