// @flow
import * as Zen from 'lib/Zen';
import type { ConfigurationKey } from 'services/ConfigurationService';
import type { Serializable } from 'lib/Zen';

type BackendConfiguration = {
  description: string,
  defaultValue: any,
  enabled: boolean,
  key: ConfigurationKey,
  value: any,
  $uri: string,
};

/**
 * The Configuration model is used by the `ConfigurationService` to
 * encapsulate configuration settings data.
 */

type RequiredValues = {
  /**
   * The unique name of the configuration setting.
   */
  key: ConfigurationKey,
  /**
   * The current value of the configuration setting.
   */
  value: any,
};

type DefaultValues = {
  /**
   * An explanation of what the configuration setting does.
   */
  description: string,
  /**
   * @readonly
   * The default value of the configuration setting.
   */
  defaultValue: Zen.ReadOnly<any>,
  /**
   * @readonly
   * The unique uri that can be used to locate this user on the server
   */
  uri: Zen.ReadOnly<string>,
};

class Configuration
  extends Zen.BaseModel<Configuration, RequiredValues, DefaultValues>
  implements Serializable<$Shape<BackendConfiguration>> {
  static defaultValues = {
    description: '',
    defaultValue: '',
    uri: '',
  };

  static deserialize({
    key,
    value,
    description,
    defaultValue,
    $uri,
  }: BackendConfiguration): Zen.Model<Configuration> {
    return Configuration.create({
      key,
      value,
      description,
      defaultValue,
      uri: $uri,
    });
  }

  serialize(): $Shape<BackendConfiguration> {
    return { value: this._.value() };
  }
}

export default ((Configuration: any): Class<Zen.Model<Configuration>>);
