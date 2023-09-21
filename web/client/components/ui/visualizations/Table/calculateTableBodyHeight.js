// @flow

const FOOTER_HEIGHT = 38;

// Calculate the available height for the table's rows, excluding header and
// footer.
export default function calculateTableBodyHeight(
  tableContainerHeight: number,
  headerHeight: number,
  showFooter: boolean,
): number {
  const footerHeight = showFooter && FOOTER_HEIGHT || 0;
  return Math.max(tableContainerHeight - headerHeight - footerHeight, 0);
}
