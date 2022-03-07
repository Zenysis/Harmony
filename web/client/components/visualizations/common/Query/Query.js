// @flow
import QueryInterface from 'components/visualizations/common/QueryInterface';
import { API_VERSION } from 'services/APIService';
import type { APIVersion } from 'services/APIService';

// TODO(stephen, pablo): Refactor QueryInterface because this pattern
// inheritance pattern is unnecessary.
export default class Query<Request, Response> extends QueryInterface<
  Request,
  Response,
> {
  static create<Req, Res>(
    endpoint: string,
    request: Req,
    apiVersion: APIVersion = API_VERSION.V1,
    useCache?: boolean = true,
  ): Query<Req, Res> {
    return new Query<Req, Res>(apiVersion, endpoint, useCache).setRequest(
      request,
    );
  }
}
