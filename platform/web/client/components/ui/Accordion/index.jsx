// @flow
import * as React from 'react';
import classNames from 'classnames';

import AccordionItem from 'components/ui/Accordion/internal/AccordionItem';
import AccordionItemContent from 'components/ui/Accordion/internal/AccordionItemContent';
import AccordionItemHeader from 'components/ui/Accordion/internal/AccordionItemHeader';

type Props = {
  children: React.ChildrenArray<?React.Element<typeof AccordionItem>>,

  /** Called when the active accordion item changes */
  onSelectionChange: (string | void) => void,

  /**
   * The current active accordion item. If it is undefined, no accordion item is
   * active.
   */
  selectedAccordionItem: string | void,
};

/**
 * This component can be used to create a series of collapsable sections. It
 * is useful to make it easier to navigate a page or component that otherwise
 * would be very tall.
 *
 * This is a controlled component.
 */
export default function Accordion({
  children,
  onSelectionChange,
  selectedAccordionItem,
}: Props): React.Node {
  const onAccordionItemClick = (accordionName: string) => {
    const accordionItemIsSelected = selectedAccordionItem === accordionName;
    const newSelectedAccordionItem = accordionItemIsSelected
      ? undefined
      : accordionName;

    onSelectionChange(newSelectedAccordionItem);
  };

  const maybeRenderAccordionItem = accordion => {
    if (accordion === null) {
      return null;
    }

    const { name } = accordion.props;
    const childContent = accordion.props.children;

    const isActive = name === selectedAccordionItem;

    const className = classNames({
      'zen-accordion-item-wrapper--active': isActive,
    });
    return (
      <div className={className}>
        <AccordionItemHeader
          isActive={isActive}
          name={name}
          onClick={() => onAccordionItemClick(name)}
        />
        <AccordionItemContent isActive={isActive}>
          {childContent}
        </AccordionItemContent>
      </div>
    );
  };

  return (
    <div className="zen-accordion">
      {React.Children.map(children, maybeRenderAccordionItem)}
    </div>
  );
}

Accordion.Item = AccordionItem;
