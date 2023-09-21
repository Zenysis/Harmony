// @flow
import { Jodit } from 'jodit';

const ALL_BUTTONS = [
  'bold',
  'strikethrough',
  'underline',
  'italic',
  '|',
  'ul',
  'olCustom',
  'align',
  '|',
  'brush',
  'paragraphCustom',
  '|',
  'link',
  'image',
  'hr',
];

const { brush, hr, image, ol, paragraph, ul } = Jodit.defaultOptions.controls;

const CUSTOM_CONTROLS = {
  brush: {
    ...brush,
    tooltip: 'Color',
  },
  hr: {
    ...hr,
    tooltip: 'Insert horizontal line',
  },
  image: {
    ...image,
    tooltip: 'Insert image',
  },
  olCustom: {
    ...ol,
    icon: 'ol',
    list: {
      default: 'Numeric',
      'lower-alpha': 'Lower Alpha',
      'lower-roman': 'Lower Roman',
      'upper-alpha': 'Upper Alpha',
      'upper-roman': 'Upper Roman',
    },
    tooltip: 'Ordered list',
  },
  paragraphCustom: {
    ...paragraph,
    icon: 'paragraph',
    list: {
      h1: 'Title',
      h2: 'Header 1',
      h3: 'Header 2',
      p: 'Normal',
    },
    tooltip: 'Styling',
  },
  ul: {
    ...ul,
    tooltip: 'Unordered list',
  },
};

export const STATIC_JODIT_CONFIG = {
  buttons: ALL_BUTTONS,
  buttonsMD: ALL_BUTTONS,
  buttonsSM: ALL_BUTTONS,
  buttonsXS: ALL_BUTTONS,
  controls: CUSTOM_CONTROLS,
  minWidth: 0,
  showCharsCounter: false,
  showTooltipDelay: 200,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  toolbarSticky: false,
};
