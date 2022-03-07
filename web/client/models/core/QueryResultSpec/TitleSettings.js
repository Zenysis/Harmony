// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
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
class TitleSettings extends Zen.BaseModel<TitleSettings, {}, DefaultValues>
  implements Serializable<SerializedTitleSettings> {
  static defaultValues: DefaultValues = {
    title: '',
    titleFontSize: '17px',
    subtitle: '',
    subtitleFontSize: '15px',
    titleFontFamily: 'Arial',
    titleFontColor: 'black',
  };

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

export default ((TitleSettings: $Cast): Class<Zen.Model<TitleSettings>>);
