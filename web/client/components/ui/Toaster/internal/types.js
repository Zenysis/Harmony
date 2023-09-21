// @flow
import * as React from 'react';

export type ToastSettings = $Shape<{
  description: React.Node,
  duration: number,
  hasCloseButton: boolean,
  id: string,
  intent: 'none' | 'success' | 'error' | 'warning',
}>;
