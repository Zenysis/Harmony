// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import APIService, { API_VERSION } from 'services/APIService';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import { deserializeArray } from 'lib/Zen';
import type { DeserializableModel, AnyModel, Serializable } from 'lib/Zen';
import type { HTTPService } from 'services/APIService';

export default class ModelService<M: AnyModel & Serializable<$AllowAny>> {
  _httpService: HTTPService;
  _uri: string;
  model: DeserializableModel<M>;

  constructor(uri: string) {
    this._httpService = APIService;
    this._uri = uri;
  }

  @autobind
  getAll(): Promise<Array<M>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.NONE, this._uri)
        .then(objects => resolve(deserializeArray<M>(this.model, objects)))
        .catch(error => reject(new ZenError(error)));
    });
  }

  @autobind
  add(info: M): Promise<M> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, this._uri, info.serialize())
        .then(report => resolve(this.model.deserialize(report)))
        .catch(error => reject(new ZenError(error)));
    });
  }

  @autobind
  delete(model: M): Promise<void> {
    return new Promise((resolve, reject) => {
      const { id } = model.modelValues();
      invariant(
        typeof id === 'number',
        'Dashboard report schedule should have an id',
      );
      this._httpService
        .delete(API_VERSION.NONE, this.getUriWithId(id))
        .then(() => resolve())
        .catch(error => reject(new ZenError(error)));
    });
  }

  getUriWithId(id: number): string {
    return `${this._uri}/${id}`;
  }

  @autobind
  update(model: M): Promise<M> {
    return new Promise((resolve, reject) => {
      const { id } = model.modelValues();
      invariant(
        typeof id === 'number',
        'Dashboard report schedule should have an id',
      );
      this._httpService
        .patch(API_VERSION.NONE, this.getUriWithId(id), model.serialize())
        .then(report => resolve(this.model.deserialize(report)))
        .catch(error => reject(new ZenError(error)));
    });
  }
}
