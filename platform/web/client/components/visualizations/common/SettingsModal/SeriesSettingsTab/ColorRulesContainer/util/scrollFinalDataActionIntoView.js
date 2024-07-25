// @flow

export function scrollFinalDataActionIntoView() {
  const elt = document.getElementById('data-actions-container-bottom-divider');
  if (elt) {
    // Wait for 1 millisecond and scroll into the final data action
    setTimeout(() => {
      elt.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      });
    }, 1);
  }
}
