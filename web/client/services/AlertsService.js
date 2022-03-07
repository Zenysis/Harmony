// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, {
  API_VERSION,
  API_VERSION_TO_PREFIX,
} from 'services/APIService';
import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import AlertNotification from 'models/AlertsApp/AlertNotification';
import User from 'services/models/User';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

// HACK(toshi): This is not sustainable, but will work for now. Figure out how
// to better support pagination.
const MAXIMUM_PAGE_SIZE = 1000;

const PER_PAGE_SUFFIX = `?per_page=${MAXIMUM_PAGE_SIZE}`;

class AlertsService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  @autobind
  getAlertDefinition(uriWithPrefix: string): Promise<AlertDefinition> {
    // NOTE(abby): The stored URI already has the api version prefix attached.
    const uri = uriWithPrefix.slice(
      `${API_VERSION_TO_PREFIX[API_VERSION.V2]}/`.length,
    );
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, uri)
        .then(alertDefinition =>
          resolve(AlertDefinition.deserializeAsync(alertDefinition)),
        )
        .catch(reject);
    });
  }

  @autobind
  getAlertDefinitions(
    username: ?string = undefined,
  ): Promise<Array<AlertDefinition>> {
    // TODO(toshi): Put this into a utility function
    const usernameClean = username ? username.replace('+', '%2B') : '';
    const filterSuffix = usernameClean
      ? `&where={"user":"${usernameClean}"}`
      : '';
    const uri = `alert_definitions${PER_PAGE_SUFFIX}${filterSuffix}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, uri)
        .then(alertDefinitions =>
          resolve(
            Promise.all(
              Zen.deserializeAsyncArray(AlertDefinition, alertDefinitions),
            ),
          ),
        )
        .catch(error => reject(error));
    });
  }

  @autobind
  postAlertDefinition(
    alertDefinitionObj: $Diff<
      Zen.Serialized<AlertDefinition>,
      { $uri: string, resourceURI: string },
    >,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'alert_definitions', alertDefinitionObj)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  @autobind
  updateAlertDefinition(
    alertDefinitionObj: $Diff<
      Zen.Serialized<AlertDefinition>,
      { $uri: string, resourceURI: string },
    >,
    uri: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, uri, alertDefinitionObj)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  @autobind
  deleteAlertDefinition(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .delete(API_VERSION.NONE, uri)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  @autobind
  getLatestAlertNotifications(): Promise<Array<AlertNotification>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, 'alert_definitions/latest_notifications')
        .then(notifs =>
          resolve(
            Zen.deserializeArray<AlertNotification>(AlertNotification, notifs),
          ),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Load all alert notifications from postgres. Use wisely. Might return a
   * lot of data.
   */
  @autobind
  getAllAlertNotifications(): Promise<Array<AlertNotification>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.V2,
          `alert_notifications/all_filtered${PER_PAGE_SUFFIX}`,
        )
        .then(notifs =>
          resolve(
            Zen.deserializeArray<AlertNotification>(AlertNotification, notifs),
          ),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Load a single alert notification from its ID.
   * @param {number} id The alert id
   * TODO(toshi, pablo): We are trying to move toward a world where we store
   * URIs instead of IDs. Probably will get around to refactoring this at a
   * later point.
   */
  @autobind
  getAlertNotification(id: string): Promise<AlertNotification> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `alert_notifications/${id}`)
        .then(notif => resolve(AlertNotification.deserialize(notif)))
        .catch(error => reject(error));
    });
  }

  /**
   * Get all alerts for a given dimension value. If an alertDefinitionUri is
   * passed, we will only return the alerts that have that same alert
   * definition.
   */
  @autobind
  getAlertsForDimensionValue(
    dimensionVal: string,
    alertDefinitionUri?: string,
  ): Promise<Array<AlertNotification>> {
    const filters = {
      dimensionVal,
      alertDefinition: undefined,
    };

    // TODO(stephen, pablo, toshi, vedant): Switch the AlertDefinition model
    // to store $ref instead of an integer ID.
    if (alertDefinitionUri !== undefined) {
      filters.alertDefinition = {
        $ref: alertDefinitionUri,
      };
    }

    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.V2,
          `alert_notifications?where=${JSON.stringify(filters)}`,
        )
        .then(notifs =>
          resolve(
            Zen.deserializeArray<AlertNotification>(AlertNotification, notifs),
          ),
        )
        .catch(error => reject(error));
    });
  }

  @autobind
  transferAllAlerts(sourceUser: User, targetUser?: User): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUsername = targetUser
        ? targetUser.username()
        : window.__JSON_FROM_BACKEND.user.username;

      const requestData = {
        sourceUser: sourceUser.username(),
        targetUser: targetUsername,
      };

      this._httpService
        .post(
          API_VERSION.V2,
          'alert_definitions/transfer/username',
          requestData,
        )
        .then(() => resolve())
        .catch(error => reject(new ZenError(error)));
    });
  }
}

export default (new AlertsService(APIService): AlertsService);
