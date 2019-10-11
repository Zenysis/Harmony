import { API_VERSION } from 'services/APIService';
import QueryInterface from 'components/visualizations/common/QueryInterface';

// TODO(stephen, pablo): Refactor QueryInterface because this pattern
// inheritance pattern is unnecessary.
export default class Query extends QueryInterface {
  static create(
    endpoint,
    request,
    apiVersion = API_VERSION.V1,
    useCache = true,
  ) {
    return new this(apiVersion, endpoint, useCache).setRequest(request);
  }
}
