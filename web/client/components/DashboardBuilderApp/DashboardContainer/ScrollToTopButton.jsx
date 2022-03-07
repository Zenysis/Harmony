// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import LegacyButton from 'components/ui/LegacyButton';

type Props = {
  containerElt: ?HTMLElement,
};

export default function ScrollToTopButton({ containerElt }: Props): React.Node {
  const [show, setShow] = React.useState(false);

  const onClick = React.useCallback(() => {
    if (containerElt) {
      containerElt.scroll({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [containerElt]);

  const onContainerScroll = React.useCallback(() => {
    if (containerElt) {
      setShow(containerElt.scrollTop > 0);
    }
  }, [containerElt]);

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (containerElt) {
      containerElt.addEventListener('scroll', onContainerScroll);
      return () =>
        containerElt.removeEventListener('scroll', onContainerScroll);
    }
  }, [containerElt, onContainerScroll]);

  return (
    show && (
      <LegacyButton
        className="gd-scroll-to-top-button hide-in-screenshot"
        onClick={onClick}
      >
        <Icon type="menu-up" />
      </LegacyButton>
    )
  );
}
