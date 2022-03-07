// @flow

const FOOTER_HEIGHT = 38;

// Calculate the available height for the table's rows, excluding header and
// footer.
export default function calculateTableBodyHeight(
  tableContainerHeight: number,
  headerHeight: number,
): number {
  return Math.max(tableContainerHeight - headerHeight - FOOTER_HEIGHT, 0);
}
