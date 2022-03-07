// @flow
// NOTE(stephen): This is a copy of the JoditEditor component from the
// `jodit-editor` third party package with minor modifications. That package is
// pretty large, and the component wrapper that it builds is quite simple. We
// choose to copy it here to reduce dependency size and to have more control
// over how the CSS is included in the site.
// Version this was based off:
// https://github.com/jodit/jodit-react/blob/5408f24286a9f6dc43d9a2dc8841a555281aeb2e/src/JoditEditor.js
import * as React from 'react';
import { Jodit } from 'jodit';

import { STATIC_JODIT_CONFIG } from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/TextEditView/useJoditConfig';

// NOTE(stephen): Stubbing out type here based on what is used.
export type JoditShape = {
  destruct: () => void,
  events: {
    on: (string, (string) => void) => void,
  },
  workplace: { tabIndex: number },
} & HTMLTextAreaElement;

type Props = {
  config: mixed,
  value: string,
  editorRef?: ((JoditShape | null) => void) | void,
  id?: string | void,
  name?: string | void,
  onBlur?: (string => void) | void,
  onChange?: (string => void) | void,
  tabIndex?: number | void,
};

const JoditEditor = React.forwardRef(
  (
    { config, value, editorRef, id, name, onBlur, onChange, tabIndex }: Props,
    ref: $Ref<JoditShape> | void = undefined,
  ) => {
    const textArea = React.useRef<JoditShape | null>(null);

    React.useLayoutEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(textArea.current);
        } else {
          // eslint-disable-next-line no-param-reassign
          ref.current = textArea.current;
        }
      }
    }, [ref, textArea]);

    // NOTE(stephen): The hooks in this component are very badly written in
    // the original source. I have updated them to be cleaner.
    React.useEffect(() => {
      const { current } = textArea;
      if (!current) {
        return;
      }

      if (id !== undefined) {
        current.id = id;
      }

      if (name !== undefined) {
        current.name = name;
      }
    }, [id, name]);

    React.useEffect(() => {
      const element = textArea.current;
      // Customize text editing dropdown options by overriding
      // attributes of default controls (e.g. tooltip).
      const editor = (Jodit.make(element, {
        ...config,
        ...STATIC_JODIT_CONFIG,
      }): JoditShape);
      textArea.current = editor;
      editor.workplace.tabIndex = tabIndex || -1;

      // adding event handlers
      editor.events.on('blur', val => onBlur && onBlur(val));
      editor.events.on('change', val => onChange && onChange(val));

      if (typeof editorRef === 'function') {
        editorRef(textArea.current);
      }

      return () => {
        const { current } = textArea;
        if (current) {
          current.destruct();
        }
        textArea.current = element;
      };
    }, [config, editorRef, onBlur, onChange, tabIndex]);

    React.useEffect(() => {
      const { current } = textArea;
      if (current && current.value !== value) {
        current.value = value;
      }
    }, [value]);

    return <textarea ref={(textArea: $AllowAny)} />;
  },
);

export default (JoditEditor: React.AbstractComponent<Props>);
