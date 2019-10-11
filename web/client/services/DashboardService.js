// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import Dashboard from 'models/core/Dashboard';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification/index';
import QuerySelections from 'models/core/wip/QuerySelections';
import User from 'services/models/User';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type QueryResultSpec, {
  SerializedQueryResultSpecForDashboard,
} from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { HTTPService } from 'services/APIService';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SerializedDashboard } from 'models/core/Dashboard';
import type { SerializedDashboardSpecification } from 'models/core/Dashboard/DashboardSpecification/index';

// TODO(pablo): add more caching

// Saved dashboard meta response.
let DASHBOARD_META_CACHE: Array<DashboardMeta> | void;

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

// HACK(vedant) - Pagination should be supported via a Pagination Service.
// The underlying service should not know or care.
const MAXIMUM_PAGE_SIZE = 1000;

class DashboardService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Gets a list of all the dashboards on the site.
   *
   * @param {?string} username An optional username to use as a filter when
   *                           looking for dashboards created by a particular
   *                           user.
   *
   * @returns {Promise<Array<DashboardMeta>>} A listing of all the dashboards.
   */
  @autobind
  getDashboards(username: ?string = undefined): Promise<Array<DashboardMeta>> {
    const useCache = !username;

    if (DASHBOARD_META_CACHE && useCache) {
      return Promise.resolve(DASHBOARD_META_CACHE);
    }

    // HACK(vedant) We need to convert the `+` character found in some emails
    // to its URL encoded value when querying.
    const _username = username ? username.replace('+', '%2B') : '';

    const pathSuffix = _username
      ? `dashboard?per_page=${MAXIMUM_PAGE_SIZE}&where={"author":"${_username}"}`
      : `dashboard?per_page=${MAXIMUM_PAGE_SIZE}`;

    return this._httpService
      .get(API_VERSION.V2, pathSuffix)
      .then(dashboards => {
        const dashboardModels: Array<DashboardMeta> = dashboards.map(
          dashboard => DashboardMeta.deserialize(dashboard),
        );

        if (useCache) {
          DASHBOARD_META_CACHE = dashboardModels;
        }

        return dashboardModels;
      });
  }

  /**
   * Gets a specific dashboard by its slug.
   *
   * @param {String} slug The Dashboard's slug
   * @returns {Promise<Dashboard>} The Dashboard in question.
   */
  @autobind
  getDashboard(slug: string): Promise<Dashboard> {
    return new Promise((resolve, reject) => {
      this._searchByName(slug).then(allEntries => {
        const exists = allEntries.length > 0;
        if (exists) {
          const entityUri = allEntries[0].uri();
          this._httpService
            .get(API_VERSION.NONE, entityUri)
            .then((completeDashboard: SerializedDashboard) =>
              Dashboard.deserializeAsync(completeDashboard),
            )
            .then(resolve)
            .catch(error => {
              reject(error);
            });
        } else {
          reject(new ZenError(`Dashboard with slug '${slug}' does not exist`));
        }
      });
    });
  }

  /**
   * Gets a specific dashboard by its unique id-based URI.
   *
   * @param {String} uri The uri of the dashboard.
   *                     (Example: `/api2/dashboard/23` - The `id` would be
   *                     `23`)
   * @param {SerializedDashboardSpecification} defaultSpec Optional spec to
   * set as the dashboard's specification. Use this ONLY if you expect that
   * the actual dashboard spec will fail to parse.
   * TODO(pablo): `defaultSpec` is so hacky. We use this in GridDashboardApp
   * so that we can still load a dashboard without a specification. Ideally, we
   * would just load a DashboardMeta model instead of a full Dashboard model
   * that forces us to have a specification.
   *
   * @returns {Promise<Dashboard>} The Dashboard in question.
   */
  @autobind
  getDashboardByUri(
    uri: string,
    defaultSpec?: SerializedDashboardSpecification,
  ): Promise<Dashboard> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.NONE, uri)
        .then((result: SerializedDashboard) => {
          if (defaultSpec) {
            // dashboard spec failed to parse, so use the defaultSpec
            return Dashboard.deserializeAsync({
              ...result,
              specification: defaultSpec,
            });
          }
          return Dashboard.deserializeAsync(result);
        })
        .then(resolve)
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Updates the slug and specification of the specified dashboard.
   *
   * @param {Dashboard} dashboard The dashboard to update.
   *
   * @returns {Promise<Dashboard>} The updated dashboard.
   */
  @autobind
  updateDashboard(dashboard: Dashboard): Promise<Dashboard> {
    this._invalidateCaches();

    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, dashboard.uri(), dashboard.serialize())
        .then((updatedModel: SerializedDashboard) =>
          Dashboard.deserializeAsync(updatedModel),
        )
        .then(resolve)
        .catch(error => {
          reject(new ZenError(error));
        });
    });
  }

  /**
   * Sets the favorite flag on the given dashboard for the current user.
   *
   * @param {Dashboard} dashboard The dashboard to update.
   * @param {boolean} isFavorite Indicates whether or not the dashboard has
   *                             been favorited by the current user.
   *
   * @returns {Promise<void>} A promise that when complete will indicate that
   *                          the favorite status of the dashboard has been
   *                          updated for the current user.
   */
  @autobind
  markDashboardAsFavorite(
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ): Promise<void> {
    const requestUri = `${dashboard.uri()}/favorite`;

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, requestUri, isFavorite)
        .then(resolve)
        .catch(error => {
          reject(new ZenError(error));
        });
    });
  }

  /**
   * Marks the given dashboard as "official".
   *
   * @param {Dashboard} dashboard The dashboard to update.
   * @param {boolean} isOfficial Indicates whether or not the dashboard
   *                             is an "official" dashboard or not.
   *
   * @returns {Promise<void>} A promise that when complete will indicate that
   *                          the "official" status of the dashboard has been
   *                          updated.
   */
  @autobind
  markDashboardAsOfficial(
    dashboard: Dashboard,
    isOfficial: boolean,
  ): Promise<void> {
    const requestUri = `${dashboard.uri()}/official`;

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, requestUri, isOfficial)
        .then(resolve)
        .catch(error => {
          reject(new ZenError(error));
        });
    });
  }

  /**
   * Upgrades the raw dashboard specification to ensure that it conforms to the
   * latest server-supported scehma version. As part of the validation process,
   * the contents of the dashboard are also validated to ensure that it is
   * valid for the defined schema. Orphaned filters, date ranges and any other
   * dashboard elements which are not directly consumed by a dashboard item
   * are also removed as part of this process.
   *
   * @param {[string]: mixed} specification The raw JSON representation of the
   *                                        Dashboard Specification.
   *
   * @returns {Promise<DashboardSpecification>}
   * A promise that when completed succesfully will resolve to the fully
   * upgraded and validated dashboard.
   */
  @autobind
  upgradeDashboard(specification: {
    [string]: mixed,
  }): Promise<DashboardSpecification> {
    return this._httpService
      .post(API_VERSION.V2, 'dashboard/upgrade', specification)
      .then((updatedSpecification: SerializedDashboardSpecification) =>
        DashboardSpecification.deserializeAsync(updatedSpecification),
      );
  }

  _searchByName(slug: string): Promise<Array<DashboardMeta>> {
    return this._httpService
      .get(API_VERSION.V2, `dashboard?where={"slug":"${slug}"}`)
      .then(rawData =>
        rawData.map(rawDashboardMeta =>
          DashboardMeta.deserialize(rawDashboardMeta),
        ),
      );
  }

  /**
   * Creates a new dashboard with the specified title.
   *
   * @param {String} dashboardTitle The title for the new dashboard
   * @param {String} slug The slug for the new dashboard. This is optional.
   * If not provided, it will be derived from the dashboardTitle.
   *
   * @returns {Promise<Dashboard>} The created dashboard.
   */
  @autobind
  createDashboard(
    dashboardTitle: string,
    slug?: string = '',
  ): Promise<Dashboard> {
    this._invalidateCaches();

    const specification = DashboardSpecification.create({
      dashboardOptions: DashboardOptions.create({
        title: dashboardTitle,
      }),
    });
    return this.createDashboardFromSpecification(specification, slug);
  }

  /**
   * Creates a new dashboard with the given specification and optionally, slug.
   *
   * @param {DashboardSpecification} specification The specification to create
   *                                               the dashboard with.
   *
   * @param {String} slug (optional) The dashboard's slug. If not specified, it
   *                      will be inferred from the specification.
   *
   * @returns {Promise<Dashboard>} The created dashboard.
   */
  @autobind
  createDashboardFromSpecification(
    specification: DashboardSpecification,
    slug?: string = '',
  ): Promise<Dashboard> {
    this._invalidateCaches();

    const payload = Dashboard.create({
      slug,
      specification,
    });

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'dashboard', payload.serialize())
        .then(result => Dashboard.deserializeAsync(result))
        .then(resolve)
        .catch(error => reject(new ZenError(error)));
    });
  }

  /**
   * Deletes the dashboard in question.
   *
   * @param {Dashboard} dashboard The dashboard to delete.
   *
   * @returns {Promise} A promise that when completed successfully,
   *                    will indicate that the specified dashboard
   *                    has been deleted.
   */
  @autobind
  deleteDashboard(dashboard: Dashboard): Promise<void> {
    return this._httpService.delete(API_VERSION.NONE, dashboard.uri());
  }

  _addQueryToDashboard(
    endpoint: string,
    dashboard: Dashboard,
    activeViewType: ResultViewType,
    querySelections:
      | Zen.Serialized<SimpleQuerySelections>
      | Zen.Serialized<QuerySelections>,
    queryResultSpec: SerializedQueryResultSpecForDashboard,
  ): Promise<Dashboard> {
    const requestData = { activeViewType, querySelections, queryResultSpec };
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, endpoint, requestData)
        .then((updatedDashboard: SerializedDashboard) =>
          Dashboard.deserializeAsync(updatedDashboard),
        )
        .then(resolve)
        .catch(error => reject(new ZenError(error)));
    });
  }

  /**
   * Adds the given query to the given dashboard.
   *
   * @param {Dashboard} dashboard The dashboard to add the query to
   * @param {ResultViewType} activeViewType The active view we're saving
   * @param {QuerySelections | SimpleQuerySelections} querySelections The
   * selections model holding the query parameters selected by the user.
   * @param {QueryResultSpec} queryResultSpec
   * @returns {Promise<Dashboard>} The updated dashboard with the new query.
   */
  @autobind
  addQueryToDashboard<Selections: QuerySelections | SimpleQuerySelections>(
    dashboard: Dashboard,
    activeViewType: ResultViewType,
    querySelections: Selections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Dashboard> {
    const endpoint =
      querySelections instanceof QuerySelections
        ? `${dashboard.uri()}/visualization/advanced`
        : `${dashboard.uri()}/visualization`;
    const serializedSelections = querySelections.serialize();

    return this._addQueryToDashboard(
      endpoint,
      dashboard,
      activeViewType,
      serializedSelections,
      queryResultSpec.serializeForDashboard(),
    );
  }

  /**
   * Transfers all dashboards owned by `sourceUser` to `targetUser`
   *
   * @param {User} sourceUser The user that dashboard ownership is being
   *                          transferred from.
   *
   * @param {User} targetUser The (optional) user that dashboard ownership
   *                           should be transferred to. If not specified,
   *                           it is assumed to be the current user.
   *
   * @returns {Promise} A promise that when completed will indicate that all
   *                    dashboards have been transferred successfully.
   */
  @autobind
  transferAllDashboards(sourceUser: User, targetUser?: User): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUsername = targetUser
        ? targetUser.username()
        : window.__JSON_FROM_BACKEND.user.username;

      const requestData = {
        sourceAuthor: sourceUser.username(),
        targetAuthor: targetUsername,
      };

      this._httpService
        .post(API_VERSION.V2, 'dashboard/transfer/username', requestData)
        .then(() => resolve())
        .catch(error => reject(new ZenError(error)));
    });
  }

  /**
   * Transfers the ownership of `dashboard` to `targetUser`
   *
   * @param {Dashboard | DashboardMeta} dashboard The individual dashboard that
   *                                              ownership is being changed
   *                                              for.
   *
   * @param {User} targetUser  The (optional) user that dashboard ownership
   *                           should be transferred to. If not specified, it
   *                           is assumed to be the current user.
   *
   * @returns {Promise} A promise that when completed will indicate that the
   *                    dashboard ownership has been successfully updated.
   */
  @autobind
  transferDashboard(
    dashboard: Dashboard | DashboardMeta,
    targetUser?: User,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUsername = targetUser
        ? targetUser.username()
        : window.__JSON_FROM_BACKEND.user.username;

      const uri: string = dashboard.uri();

      if (!uri) {
        reject(
          new ZenError(
            'No Dashboard uri specified. One must be specified if trying to ' +
              'transfer ownership from one user to another. ',
          ),
        );
      }

      this._httpService
        .post(
          API_VERSION.NONE,
          `${dashboard.uri()}/transfer/username`,
          targetUsername,
        )
        .then(() => resolve())
        .catch(error => reject(new ZenError(error)));
    });
  }

  /**
   * Resets dashboard service caches.
   */
  _invalidateCaches() {
    DASHBOARD_META_CACHE = undefined;
  }
}

export default new DashboardService(APIService);
