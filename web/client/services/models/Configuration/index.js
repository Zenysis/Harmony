// @flow
import * as Zen from 'lib/Zen';
import type { ConfigurationKey } from 'services/ConfigurationService';
import type { Serializable } from 'lib/Zen';

type BackendConfiguration = {
  $uri: string,
  defaultValue: any,
  enabled: boolean,
  key: ConfigurationKey,
  value: any,
};

/**
 * The Configuration model is used by the `ConfigurationService` to
 * encapsulate configuration settings data.
 */

type RequiredValues = {
  /** The unique name of the configuration setting. */
  key: ConfigurationKey,

  /** The current value of the configuration setting. */
  value: any,
};

type DefaultValues = {
  /** The default value of the configuration setting. */
  defaultValue: any,

  /** The unique uri that can be used to locate this user on the server */
  uri: string,
};

class Configuration
  extends Zen.BaseModel<Configuration, RequiredValues, DefaultValues>
  implements Serializable<$Shape<BackendConfiguration>> {
  static defaultValues: DefaultValues = {
    defaultValue: '',
    uri: '',
  };

  static deserialize({
    $uri,
    defaultValue,
    key,
    value,
  }: BackendConfiguration): Zen.Model<Configuration> {
    return Configuration.create({
      defaultValue,
      key,
      value,
      uri: $uri,
    });
  }

  serialize(): $Shape<BackendConfiguration> {
    return { value: this._.value() };
  }
}

export default ((Configuration: $Cast): Class<Zen.Model<Configuration>>);
