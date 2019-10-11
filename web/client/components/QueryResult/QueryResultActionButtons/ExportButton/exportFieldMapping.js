// @flow
const TEXT = t('QueryApp.ExportButton.options');
export default function exportFieldMapping(
  event: SyntheticEvent<HTMLElement>,
): void {
  event.preventDefault();
  analytics.track('Export field mapping');
  window.location.href = '/api/fields.csv';
  window.toastr.success(TEXT.successMessage);
}
