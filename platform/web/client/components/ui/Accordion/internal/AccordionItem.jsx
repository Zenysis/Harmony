// @flow
import * as React from 'react';

type Props = {
  children: React.Node,

  /**
   * The name of this Accordion item. It must be unique, and it is the name that
   * is passed to the `onSelectionChange` in `<Accordion>`
   */
  name: string,
};

export default function AccordionItem({ children }: Props): React.Node {
  return children;
}
