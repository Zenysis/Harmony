// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  playbackSpeed: 'quarter' | 'half' | 'normal' | 'double' | 'quadruple',
  reversePlayback: boolean,
  startFromMostRecentDate: boolean,
};

type SerializedPlaybackSettings = {
  playbackSpeed: 'quarter' | 'half' | 'normal' | 'double' | 'quadruple',
  reversePlayback: boolean,
  startFromMostRecentDate: boolean,
};

class PlaybackSettings
  extends Zen.BaseModel<PlaybackSettings, {}, DefaultValues>
  implements Serializable<SerializedPlaybackSettings> {
  static defaultValues: DefaultValues = {
    playbackSpeed: 'normal',
    reversePlayback: false,
    startFromMostRecentDate: false,
  };

  static deserialize(
    values: SerializedPlaybackSettings,
  ): Zen.Model<PlaybackSettings> {
    return PlaybackSettings.create(values);
  }

  serialize(): SerializedPlaybackSettings {
    return {
      playbackSpeed: this._.playbackSpeed(),
      reversePlayback: this._.reversePlayback(),
      startFromMostRecentDate: this._.startFromMostRecentDate(),
    };
  }
}

export default ((PlaybackSettings: $Cast): Class<Zen.Model<PlaybackSettings>>);
