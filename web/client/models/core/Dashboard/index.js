// @flow
import PropTypes from 'prop-types';

import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import Moment from 'models/core/wip/DateTime/Moment';
import ZenModel, { def } from 'util/ZenModel';
import override from 'decorators/override';
import type { SerializedDashboardSpecification } from 'models/core/Dashboard/DashboardSpecification';

// The dashboard format we receive from the backend
export type SerializedDashboard = {
  $uri: string,
  authorUsername: string,
  created: string,
  isOfficial: boolean,
  isFavorite: boolean,
  lastAccessedByCurrentUser: string,
  lastModified: string,
  lastModifiedByCurrentUser: string,
  resource: string,
  slug: string,
  title: string,
  specification: SerializedDashboardSpecification,
  totalViewsByUser: number,
  totalViews: number,
};

/**
 * The Dashboard model is used by the `DashboardService` to
 * represent all the data required to load and render a Dashboard.
 */
export default class Dashboard extends ZenModel.withTypes({
  /**
   * @readonly
   * The username of the author who created this dashboard.
   */
  author: def(PropTypes.string, '', ZenModel.PRIVATE),

  /**
   * @readonly
   * The unique uri that can be used to look up the authorization resource
   * corresponding to this dashboard.
   */
  authorizationUri: def(PropTypes.string, undefined, ZenModel.PRIVATE),

  /**
   * @readonly
   * The time at which this dashboard was created.
   */
  created: def(PropTypes.instanceOf(Moment), undefined, ZenModel.PRIVATE),

  /**
   * @readonly
   * Indicates whether or not an administrator has flagged the dashboard as
   * "official" or not.
   */
  isOfficial: def(PropTypes.bool, false, ZenModel.PRIVATE),

  /**
   * @readonly
   * Indicates whether or not the dashboard has been favorited by the current
   * user.
   */
  isFavorite: def(PropTypes.bool, false, ZenModel.PRIVATE),

  /**
   * @readonly
   * The last time the dashboard was accessed (if ever) by the current user.
   */
  lastAccessedByCurrentUser: def(
    PropTypes.instanceOf(Moment),
    undefined,
    ZenModel.PRIVATE,
  ),

  /**
   * @readonly
   * The last time the dashboard was modified (if ever) by the current user.
   */
  lastModifiedByCurrentUser: def(
    PropTypes.instanceOf(Moment),
    undefined,
    ZenModel.PRIVATE,
  ),

  /**
   * @readonly
   * The number of times the dashboard has been view by the current user.
   */
  totalViewsByUser: def(PropTypes.number, 0, ZenModel.PRIVATE),

  /**
   * @readonly
   * The number of times the dashboard has been view.
   */
  totalViews: def(PropTypes.number, 0, ZenModel.PRIVATE),

  /**
   * @readonly
   * The time at which any attribute of the Dashboard model was last modified.
   */
  lastModified: def(PropTypes.instanceOf(Moment), undefined, ZenModel.PRIVATE),

  /**
   * The short-name of the dashboard that the user can use to navigate
   * directly to the UI representation of the dashboard.
   */
  slug: def(PropTypes.string.isRequired, ''),

  /**
   * The dashboard specification object.
   */
  specification: def(DashboardSpecification.type(), undefined),

  /**
   * @readonly
   * The title of the dashboard.
   */
  title: def(PropTypes.string, '', ZenModel.PRIVATE),

  /**
   * @readonly
   * The unique uri that can be used to locate this dashboard on the server
   */
  uri: def(PropTypes.string, undefined, ZenModel.PRIVATE),
}) {
  @override
  static deserializeAsync(dashboard: SerializedDashboard): Promise<Dashboard> {
    const {
      $uri,
      authorUsername,
      created,
      isOfficial,
      isFavorite,
      lastModified,
      lastAccessedByCurrentUser,
      lastModifiedByCurrentUser,
      resource,
      slug,
      specification,
      title,
      totalViewsByUser,
      totalViews,
    } = dashboard;

    const specificationPromise = specification
      ? DashboardSpecification.deserializeAsync(specification)
      : Promise.resolve(undefined);

    return specificationPromise.then(
      (dashboardSpec: DashboardSpecification | void) =>
        Dashboard.create({
          author: authorUsername || '',
          created: Moment.create(created),
          slug,
          title,
          uri: $uri,
          specification: dashboardSpec,
          isOfficial,
          isFavorite,
          totalViewsByUser,
          totalViews,
          lastAccessedByCurrentUser: Moment.create(lastAccessedByCurrentUser),
          lastModified: Moment.create(lastModified),
          lastModifiedByCurrentUser: Moment.create(lastModifiedByCurrentUser),
          authorizationUri: resource,
        }),
    );
  }

  getDashboardMeta(): DashboardMeta {
    const {
      author,
      authorizationUri,
      created,
      isOfficial,
      isFavorite,
      lastModified,
      lastAccessedByCurrentUser,
      lastModifiedByCurrentUser,
      totalViewsByUser,
      totalViews,
      slug,
      title,
      uri,
    } = this.modelValues();
    return DashboardMeta.create({
      author,
      authorizationUri,
      created,
      isOfficial,
      isFavorite,
      lastModified,
      lastAccessedByCurrentUser,
      lastModifiedByCurrentUser,
      totalViewsByUser,
      totalViews,
      slug,
      title,
      uri,
    });
  }

  @override
  serialize(): $Shape<SerializedDashboard> {
    const { slug, specification } = this.modelValues();
    const output = {
      slug,
      specification: specification.serialize(),
    };

    return output;
  }

  getTitle(): string {
    return this.specification().getTitle();
  }
}
