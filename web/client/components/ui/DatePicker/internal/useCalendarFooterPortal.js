// @flow
import * as React from 'react';

/**
 * Custom hook to attach a portal node to the react-day-picker's footer
 *
 * @returns HTMLDivElement The DOM node to attach the portal to
 */
export default function useCalendarFooterPortal(): HTMLDivElement {
  const calendarFooterPortal = React.useRef(document.createElement('div'));
  React.useEffect(() => {
    calendarFooterPortal.current.classList.add(
      'zen-calendar-editor__footer-portal',
    );

    const footer = document.getElementsByClassName('DayPicker-Footer')[0];
    if (footer) {
      footer.appendChild(calendarFooterPortal.current);
    }
  }, []);
  return calendarFooterPortal.current;
}
