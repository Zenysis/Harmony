// @flow
import * as Zen from 'lib/Zen';
import type Field from 'models/core/Field';
import type { Serializable } from 'lib/Zen';

type Values = {
  title: string,
  titleFontSize: string,
  subtitle: string,
  subtitleFontSize: string,
  titleFontFamily: string,
  titleFontColor: string,
};

type SerializedTitleSettings = {
  title?: string,
  titleFontSize?: string,
  subtitle?: string,
  subtitleFontSize?: string,
  titleFontFamily?: string,
  titleFontColor?: string,
};

/**
 * TitleSettings represents the Title metadata for a QueryResultSpec.
 * A query result can have a title, subtitle, and font sizes for each of these.
 */
class TitleSettings extends Zen.BaseModel<TitleSettings, {}, Values>
  implements Serializable<SerializedTitleSettings> {
  static defaultValues = {
    title: '',
    titleFontSize: '24px',
    subtitle: '',
    subtitleFontSize: '16px',
    titleFontFamily: 'Arial',
    titleFontColor: 'black',
  };

  static fromFields(fields: Array<Field>, denominator?: Field): TitleSettings {
    let title = '';
    if (fields.length > 0) {
      // Title defaults to first indicator
      title = fields[0].getCanonicalName();
      if (denominator) {
        // TODO(stephen): Translate this, solicit feedback and change the
        // wording if it is ambiguous or confusing
        title += `\nscaled by ${denominator.getCanonicalName()}`;
      }
      title = title.trim();
    }
    return TitleSettings.create({ title });
  }

  static deserialize({
    title,
    titleFontSize,
    subtitle,
    subtitleFontSize,
    titleFontFamily,
    titleFontColor,
  }: SerializedTitleSettings): Zen.Model<TitleSettings> {
    return TitleSettings.create({
      title,
      titleFontSize,
      subtitle,
      subtitleFontSize,
      titleFontFamily,
      titleFontColor,
    });
  }

  serialize(): SerializedTitleSettings {
    return { ...this.modelValues() };
  }
}

export default ((TitleSettings: any): Class<Zen.Model<TitleSettings>>);
