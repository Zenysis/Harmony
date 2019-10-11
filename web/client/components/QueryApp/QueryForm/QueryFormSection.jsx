// @flow
import * as React from 'react';

import Card from 'components/ui/Card';

type Props = {
  children: React.Node,
  title: string,
};

export default class QueryFormSection extends React.PureComponent<Props> {
  render() {
    return (
      <Card
        title={this.props.title}
        className="query-form-section"
        headingBackground="offwhite"
      >
        <div className="query-form-section__options">{this.props.children}</div>
      </Card>
    );
  }
}
