// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  subtitle: string,
  subtitleFontSize: string,
  title: string,
  titleFontColor: string,
  titleFontFamily: string,
  titleFontSize: string,
};

type SerializedTitleSettings = {
  subtitle?: string,
  subtitleFontSize?: string,
  title?: string,
  titleFontColor?: string,
  titleFontFamily?: string,
  titleFontSize?: string,
};

/**
 * TitleSettings represents the Title metadata for a QueryResultSpec.
 * A query result can have a title, subtitle, and font sizes for each of these.
 */
class TitleSettings extends Zen.BaseModel<TitleSettings, {}, DefaultValues>
  implements Serializable<SerializedTitleSettings> {
  static defaultValues: DefaultValues = {
    subtitle: '',
    subtitleFontSize: '15px',
    title: '',
    titleFontColor: 'black',
    titleFontFamily: 'Arial',
    titleFontSize: '17px',
  };

  static deserialize({
    subtitle,
    subtitleFontSize,
    title,
    titleFontColor,
    titleFontFamily,
    titleFontSize,
  }: SerializedTitleSettings): Zen.Model<TitleSettings> {
    return TitleSettings.create({
      subtitle,
      subtitleFontSize,
      title,
      titleFontColor,
      titleFontFamily,
      titleFontSize,
    });
  }

  serialize(): SerializedTitleSettings {
    return { ...this.modelValues() };
  }
}

export default ((TitleSettings: $Cast): Class<Zen.Model<TitleSettings>>);
