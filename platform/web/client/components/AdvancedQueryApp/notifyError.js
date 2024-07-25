// @flow
import Toaster from 'components/ui/Toaster';

export default function notifyError(errorString: string, error: Error): void {
  Toaster.error(errorString);
  // eslint-disable-next-line no-console
  console.error(error);
}
