// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  name: string,
  uri: string,
};

type SerializedPipelineDatasource = {
  id: string,
  name: string,
  $uri: string,
};

/**
 * Pipeline data source class for indicator management.
 */
class PipelineDatasource extends Zen.BaseModel<PipelineDatasource, Values>
  implements Serializable<SerializedPipelineDatasource> {
  static deserialize(
    values: SerializedPipelineDatasource,
  ): Zen.Model<PipelineDatasource> {
    const { id, name, $uri } = values;
    return PipelineDatasource.create({ id, name, uri: $uri });
  }

  serialize(): SerializedPipelineDatasource {
    const { id, name, uri } = this.modelValues();
    return { id, name, $uri: uri };
  }
}

export default ((PipelineDatasource: $Cast): Class<
  Zen.Model<PipelineDatasource>,
>);
