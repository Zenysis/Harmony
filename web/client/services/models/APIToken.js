// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type SerializedAPIToken = {
  $uri: string,
  created: string,
  id: string,
  isRevoked: boolean,
  revoked: string,
  token?: string,
};

type RequiredValues = {
  created: Moment,
  id: string,
  isRevoked: boolean,
  revoked: Moment,
  uri: string,
};

type DefaultValues = {
  token: ?string,
  uri: string,
};

const SERIALIZED_DATE_FORMAT = 'YYYY-MM-DD';

class APIToken extends Zen.BaseModel<APIToken, RequiredValues, DefaultValues>
  implements Serializable<SerializedAPIToken> {
  static defaultValues: DefaultValues = {
    token: undefined,
    uri: '',
  };

  static deserialize(values: SerializedAPIToken): Zen.Model<APIToken> {
    const { $uri, created, id, isRevoked, revoked, token } = values;
    return APIToken.create({
      id,
      isRevoked,
      token,
      created: Moment.utc(created).local(),
      revoked: Moment.utc(revoked).local(),
      uri: $uri,
    });
  }

  serialize(): SerializedAPIToken {
    const { created, id, isRevoked, revoked, uri } = this.modelValues();
    return {
      id,
      isRevoked,
      $uri: uri,
      created: created.format(SERIALIZED_DATE_FORMAT),
      revoked: revoked.format(SERIALIZED_DATE_FORMAT),
    };
  }
}

export default ((APIToken: $Cast): Class<Zen.Model<APIToken>>);
