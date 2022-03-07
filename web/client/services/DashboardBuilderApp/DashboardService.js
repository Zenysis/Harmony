// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import Dashboard from 'models/core/Dashboard';
import DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification/index';
import GISMapSettings from 'models/GeoMappingApp/GISMapSettings';
import QuerySelections from 'models/core/wip/QuerySelections';
import User from 'services/models/User';
import autobind from 'decorators/autobind';
import buildDefaultTilePosition from 'services/DashboardBuilderApp/buildDefaultTilePosition';
import { UncancellablePromise } from 'util/promiseUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { DashboardItemType } from 'models/DashboardBuilderApp/DashboardItem/types';
import type {
  GeoLayers,
  GeoLayerSelectionType,
} from 'components/GeoMappingApp/types';
import type { HTTPService } from 'services/APIService';
import type { ShareDashboardEmailInfo } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

// TODO(pablo): add more caching

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

// HACK(vedant) - Pagination should be supported via a Pagination Service.
// The underlying service should not know or care.
const MAXIMUM_PAGE_SIZE = 10000;

class DashboardService {
  _httpService: HTTPService;
  _allDashboardsCache: {
    request: UncancellablePromise<$ReadOnlyArray<DashboardMeta>> | void,
    result: $ReadOnlyArray<DashboardMeta> | void,
  } = {
    request: undefined,
    result: undefined,
  };

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  // Load all dashboards from the backend. Cache the results and reuse the
  // promise so that only one call to the backend is made even if many
  // components request dashboards.
  _getAllDashboards(): Promise<$ReadOnlyArray<DashboardMeta>> {
    if (this._allDashboardsCache.result !== undefined) {
      return Promise.resolve(this._allDashboardsCache.result);
    }

    if (this._allDashboardsCache.request !== undefined) {
      return this._allDashboardsCache.request.use();
    }

    const request = this._httpService
      .get(API_VERSION.V2, `dashboard?per_page=${MAXIMUM_PAGE_SIZE}`)
      .then(dashboards => {
        const dashboardModels = dashboards.map(DashboardMeta.deserialize);
        this._allDashboardsCache.result = dashboardModels;
        this._allDashboardsCache.request = undefined;
        return dashboardModels;
      });

    this._allDashboardsCache.request = UncancellablePromise.create(request);
    return this._allDashboardsCache.request.use();
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
  getDashboards(
    username: ?string = undefined,
  ): Promise<$ReadOnlyArray<DashboardMeta>> {
    if (!username) {
      return this._getAllDashboards();
    }

    // HACK(vedant) We need to convert the `+` character found in some emails
    // to its URL encoded value when querying.
    const _username = username.replace('+', '%2B');

    const pathSuffix = `dashboard?per_page=${MAXIMUM_PAGE_SIZE}&where={"author":"${_username}"}`;
    return this._httpService
      .get(API_VERSION.V2, pathSuffix)
      .then(dashboards => dashboards.map(DashboardMeta.deserialize));
  }

  /**
   * Gets a list of all dashboard that the current user can edit.
   *
   * @returns {Promise<Array<DashboardMeta>>} A listing of all the dashboards.
   */
  @autobind
  getEditableDashboards(): Promise<$ReadOnlyArray<DashboardMeta>> {
    return this._httpService
      .get(API_VERSION.V2, 'dashboard/editable')
      .then(dashboards => {
        const dashboardModels: Array<DashboardMeta> = dashboards.map(
          dashboard => DashboardMeta.deserialize(dashboard),
        );
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
            .then((completeDashboard: Zen.Serialized<Dashboard>) =>
              Dashboard.deserializeAsync(completeDashboard),
            )
            .then(resolve)
            .catch(error => {
              reject(error);
            });
        } else {
          reject(new Error(`Dashboard with slug '${slug}' does not exist`));
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
   * @param {Zen.Serialized<DashboardSpecification>} defaultSpec Optional spec to
   * set as the dashboard's specification. Use this ONLY if you expect that
   * the actual dashboard spec will fail to parse.
   *
   * @returns {Promise<Dashboard>} The Dashboard in question.
   */
  @autobind
  getDashboardByUri(uri: string): Promise<Dashboard> {
    return this._httpService
      .get(API_VERSION.NONE, uri)
      .then(Dashboard.deserializeAsync);
  }

  @autobind
  getViewableOfficialDashboards(): Promise<$ReadOnlyArray<DashboardMeta>> {
    return this._httpService
      .get(
        API_VERSION.V2,
        `/dashboard/viewable?per_page=${MAXIMUM_PAGE_SIZE}&where={"isOfficial": true}`,
      )
      .then(dashboards => dashboards.map(DashboardMeta.deserialize));
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
        .patch(
          API_VERSION.NONE,
          dashboard.uri(),
          dashboard.serializeForSpecUpdate(),
        )
        .then((updatedModel: Zen.Serialized<Dashboard>) =>
          Dashboard.deserializeAsync(updatedModel),
        )
        .then((updatedDashboard: Dashboard) => {
          // Update the official dashboard status if the user has changed it.
          // NOTE(stephen): Previously the official status change was handled by
          // the DashboardSettingsModal. It felt awkward to handle that network
          // call in that component because the `isOfficial` property is a part
          // of the `Dashboard` model. So in theory, any changes to the
          // `Dashboard` that are published would include this change too.
          // Unfortunately, the `isOfficial` status is not sent to the backend
          // when the spec changes, so we must make a separate call.
          // NOTE(stephen): As with everything dashboard related, this is
          // *not concurrent user safe*. If there are multiple dashboard users
          // editing at the same time, it is possible for one user to change the
          // official status and then have a different user overwrite it. This
          // is not something our dashboards can handle right now.
          if (updatedDashboard.isOfficial() !== dashboard.isOfficial()) {
            return this.markDashboardAsOfficial(
              dashboard,
              dashboard.isOfficial(),
            ).then(() => dashboard);
          }
          return Promise.resolve(dashboard);
        })
        .then(resolve)
        .catch(error => {
          reject(error);
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
    this._invalidateCaches();
    const requestUri = `${dashboard.uri()}/favorite`;

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, requestUri, isFavorite)
        .then(resolve)
        .catch(error => {
          reject(error);
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
    this._invalidateCaches();
    const requestUri = `${dashboard.uri()}/official`;

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, requestUri, isOfficial)
        .then(resolve)
        .catch(error => {
          reject(error);
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
      .post(API_VERSION.V2, 'dashboard/upgrade_spec', specification)
      .then((updatedSpecification: Zen.Serialized<DashboardSpecification>) =>
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
   * @returns {Promise<DashboardMeta>} The created dashboard.
   */
  @autobind
  createDashboard(
    dashboardTitle: string,
    slug?: string = '',
  ): Promise<DashboardMeta> {
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
   * @returns {Promise<DashboardMeta>} The created dashboard.
   */
  @autobind
  createDashboardFromSpecification(
    specification: DashboardSpecification,
    slug?: string = '',
  ): Promise<DashboardMeta> {
    this._invalidateCaches();
    const payload = {
      slug,
      specification: specification.serialize(),
    };

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'dashboard', payload)
        .then(result => resolve(DashboardMeta.deserialize(result)))
        .catch(error => reject(error));
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

  @autobind
  addGISItemToDashboard(
    dashboardMeta: DashboardMeta,
    generalSettings: GISMapSettings,
    selectedLayerIds: $ReadOnlyArray<GeoLayerSelectionType>,
    layers: GeoLayers,
  ): Promise<Dashboard> {
    const entityLayers = {};
    const indicatorLayers = {};
    Object.keys(layers).forEach(layerId => {
      const layer = layers[layerId];
      if (layer === undefined) {
        return;
      }

      if (layer.tag === 'ENTITY') {
        // NOTE(stephen): We don't need to store the layer with its data on the
        // DashboardGISItem since the layer data is created when the item is
        // deserialized on the dashboard.
        entityLayers[layerId] = layer.data(undefined);
      } else if (layer.tag === 'INDICATOR') {
        indicatorLayers[layerId] = layer;
      }
    });

    const gisItem = DashboardGISItem.create({
      entityLayers: Zen.Map.create(entityLayers),
      indicatorLayers: Zen.Map.create(indicatorLayers),
      generalSettings,
      selectedLayerIds,
    });

    return this.addItemToDashboard(
      dashboardMeta,
      gisItem,
      buildDefaultTilePosition(gisItem),
    );
  }

  /**
   * Adds the given query to the given dashboard.
   *
   * @param {DashboardMeta} dashboardMeta The dashboard to add the query to
   * @param {QuerySelections} querySelections The selections model holding
   * the query parameters selected by the user.
   * @param {QueryResultSpec} queryResultSpec
   * @param {VisualizationType} visualizationType The active visualization type
   * we are saving.
   * @returns {Promise<Dashboard>} The updated dashboard with the new query.
   */
  @autobind
  addQueryToDashboard(
    dashboardMeta: DashboardMeta,
    querySelections: QuerySelections,
    queryResultSpec: QueryResultSpec,
    visualizationType: VisualizationType,
  ): Promise<Dashboard> {
    const queryItem = DashboardQueryItem.create({
      queryResultSpec,
      querySelections,
      visualizationType,
    });

    return this.addItemToDashboard(
      dashboardMeta,
      queryItem,
      buildDefaultTilePosition(queryItem),
    );
  }

  @autobind
  addItemToDashboard(
    dashboardMeta: DashboardMeta,
    item: DashboardItemType,
    position: TilePosition,
  ): Promise<Dashboard> {
    const endpoint = `${dashboardMeta.uri()}/add_item`;
    const itemHolder = DashboardItemHolder.createWithUniqueId(item, position);
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, endpoint, itemHolder.serialize())
        .then((updatedDashboard: Zen.Serialized<Dashboard>) =>
          Dashboard.deserializeAsync(updatedDashboard),
        )
        .then(resolve)
        .catch(error => reject(error));
    });
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
        .catch(error => reject(error));
    });
  }

  /**
   * Transfers the ownership of `dashboard` to `targetUser`
   *
   * @param {DashboardMeta} dashboard The individual dashboard that
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
    dashboard: DashboardMeta,
    targetUser?: User,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUsername = targetUser
        ? targetUser.username()
        : window.__JSON_FROM_BACKEND.user.username;

      const uri: string = dashboard.uri();

      if (!uri) {
        reject(
          new Error(
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
        .catch(error => reject(error));
    });
  }

  /**
   * Shares a dashboard with a bunch of users
   *
   * @param {Dashboard | DashboardMeta} dashboard The individual dashboard that
   *                                              is being shared.
   *
   * @param {ShareDashboardEmailInfo} emailInfo  The email information that is to be used
   *                                             to send the email.
   *
   * @returns {Promise} A promise that when completed will indicate that the
   *                    dashboard has been successfully shared.
   */
  @autobind
  shareDashboardByEmail(
    dashboard: DashboardMeta,
    emailInfo: ShareDashboardEmailInfo,
    isPreview: boolean = false,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const uri: string = `${dashboard.uri()}/share_via_email`;

      const {
        subject,
        recipients,
        sender,
        message,
        shouldAttachPdf,
        shouldEmbedImage,
        useRecipientQueryPolicy,
        useSingleEmailThread,
        dashboardUrl,
        recipientUserGroups,
      } = emailInfo;

      const newRecipients = new Set([...recipients]);
      if (!isPreview) {
        recipientUserGroups.forEach(group => {
          group.users().forEach(user => newRecipients.add(user.username()));
        });
      }

      const segment = {
        newRecipients,
        numberOfRecipients: newRecipients.size,
        attachedPdf: shouldAttachPdf,
        useSingleEmailThread,
        useRecipientQueryPolicy,
        emailSender: sender,
        message,
        dashboardSlug: dashboard.slug(),
      };

      this._httpService
        .post(API_VERSION.NONE, uri, {
          subject,
          recipients: [...newRecipients],
          sender,
          message,
          shouldAttachPdf,
          shouldEmbedImage,
          useRecipientQueryPolicy,
          useSingleEmailThread,
          dashboardUrl: dashboardUrl || undefined,
        })
        .then(() => {
          analytics.track('Shared Dashboard via Email', {
            ...segment,
            status: 'accepted',
          });
          return resolve();
        })
        .catch(error => {
          analytics.track('Shared Dashboard via Email', {
            ...segment,
            status: 'failed',
          });
          return reject(error);
        });
    });
  }

  /**
   * Checks if a users can view a dashboard.
   */
  @autobind
  getNoDashboardAccessRecipients(
    emails: $ReadOnlyArray<string>,
    dashboard: DashboardMeta,
  ): Promise<$ReadOnlyArray<string>> {
    return new Promise((resolve, reject) => {
      const uri: string = `${dashboard.uri()}/cannot_view`;
      this._httpService
        .post(API_VERSION.NONE, uri, { emails })
        .then(res => {
          return resolve(res);
        })
        .catch(error => {
          return reject(error);
        });
    });
  }

  /**
   * Resets dashboard service caches.
   */
  _invalidateCaches() {
    this._allDashboardsCache = {
      request: undefined,
      result: undefined,
    };
  }
}

export default (new DashboardService(APIService): DashboardService);
