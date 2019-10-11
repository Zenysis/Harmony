// @flow
import RichTextEditor from 'react-rte';

import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
export type SerializedDashboardEditableText = {
  id: string,
  itemId: string,
  text: string,
};

type RequiredValues = {
  id: string,
  itemId: string,
};

type DefaultValues = {
  text: Object,
};

/**
 * The DashboardEditableText model represents an editable
 * text item in a Dashboard
 * specification.
 */
class DashboardEditableText
  extends Zen.BaseModel<DashboardEditableText, RequiredValues, DefaultValues>
  implements Serializable<SerializedDashboardEditableText> {
  static defaultValues = {
    text: RichTextEditor.createEmptyValue(),
  };

  static deserialize(
    values: SerializedDashboardEditableText,
  ): Zen.Model<DashboardEditableText> {
    const { id, itemId, text } = values;

    return DashboardEditableText.create({
      id,
      itemId,
      text: RichTextEditor.createValueFromString(text, 'html'),
    });
  }

  serialize(): SerializedDashboardEditableText {
    const { id, itemId, text } = this.modelValues();

    return {
      id,
      itemId,
      text: text.toString('html'),
    };
  }
}
export default ((DashboardEditableText: any): Class<
  Zen.Model<DashboardEditableText>,
>);
