// @flow
import I18N from 'lib/I18N';

export type VisibilityStatus = 'VISIBLE' | 'HIDDEN';

const VISIBLE_STATUS = 'VISIBLE';
const HIDDEN_STATUS = 'HIDDEN';

export const VISIBILITY_STATUS_MAP = {
  hidden: HIDDEN_STATUS,
  visible: VISIBLE_STATUS,
};

export const VISIBILITY_STATUS_VALUES = [VISIBLE_STATUS, HIDDEN_STATUS];

export const VISIBILITY_STATUS_DISPLAY_VALUES_MAP: {
  [status: VisibilityStatus]: string,
} = {
  [VISIBILITY_STATUS_MAP.visible]: I18N.text('Visible', 'visible'),
  [VISIBILITY_STATUS_MAP.hidden]: I18N.text('Hidden', 'hidden'),
};
