// @flow
import * as Zen from 'lib/Zen';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import Moment from 'models/core/wip/DateTime/Moment';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  /**
   * The username of the author who created this dashboard.
   */
  author: string,

  /**
   * The unique uri that can be used to look up the authorization resource
   * corresponding to this dashboard.
   */
  authorizationUri: string,

  /** The time at which this dashboard was created. */
  created: Moment,

  /**
   * Indicates whether or not the dashboard has been favorited by the current
   * user.
   */
  isFavorite: boolean,

  /**
   * Indicates whether or not an administrator has flagged the dashboard as
   * "official" or not.
   */
  isOfficial: boolean,

  /**
   * The last time the dashboard was accessed (if ever) by the current user.
   * If it has never been accessed by the current user, the Moment will be
   * invalid. This can be checked with date.isValid()
   */
  lastAccessedByCurrentUser: Moment,

  /**
   * The time at which any attribute of the Dashboard model was last modified.
   */
  lastModified: Moment,

  /**
   * The last time the dashboard was modified (if ever) by the current user.
   * If it has never been modified by the current user, the Moment will be
   * invalid. This can be checked with date.isValid()
   */
  lastModifiedByCurrentUser: Moment,

  /**
   * Indicates whether or not registered users can download analysis data from this
   * dashboard
   */
  registeredUsersCanDownloadData: boolean,

  /**
   * The short-name of the dashboard that the user can use to navigate
   * directly to the UI representation of the dashboard.
   */
  slug: string,

  /** The dashboard specification object. */
  specification: DashboardSpecification,

  /** The title of the dashboard. */
  title: string,

  /**
   * The number of times the dashboard has been view.
   */
  totalViews: number,

  /**
   * The number of times the dashboard has been view by the current user.
   */
  totalViewsByUser: number,

  /**
   * Indicates whether or not unregistered users can download analysis data from this
   * dashboard
   */
  unregisteredUsersCanDownloadData: boolean,

  /**
   * The unique uri that can be used to locate this dashboard on the server
   */
  uri: string,
};

type SerializedDashboard = {
  $uri: string,
  authorUsername: string,
  created: string,
  isFavorite: boolean,
  isOfficial: boolean,
  lastAccessedByCurrentUser: string | null,
  lastModified: string | null,
  lastModifiedByCurrentUser: string,
  registeredUsersCanDownloadData: boolean,
  resource: string,
  slug: string,
  specification: Zen.Serialized<DashboardSpecification>,
  title: string,
  totalViews: number,
  totalViewsByUser: number,
  unregisteredUsersCanDownloadData: boolean,
};

/**
 * The Dashboard model is used by the `DashboardService` to
 * represent all the data required to load and render a Dashboard.
 */
class Dashboard extends Zen.BaseModel<Dashboard, RequiredValues>
  implements Deserializable<SerializedDashboard> {
  static deserializeAsync(
    dashboard: SerializedDashboard,
  ): Promise<Zen.Model<Dashboard>> {
    const {
      $uri,
      // eslint-disable-next-line no-unused-vars
      authorUsername,
      created,
      isFavorite,
      isOfficial,
      lastAccessedByCurrentUser,
      lastModified,
      lastModifiedByCurrentUser,
      registeredUsersCanDownloadData,
      // eslint-disable-next-line no-unused-vars
      resource,
      slug,
      specification,
      title,
      totalViews,
      totalViewsByUser,
      unregisteredUsersCanDownloadData,
    } = dashboard;

    // all dates should be processed in UTC timezones, then converted to the
    // user's local timezone.
    return DashboardSpecification.deserializeAsync(specification).then(
      (dashboardSpec: DashboardSpecification) =>
        Dashboard.create({
          isFavorite,
          isOfficial,
          registeredUsersCanDownloadData,
          slug,
          title,
          totalViews,
          totalViewsByUser,
          unregisteredUsersCanDownloadData,
          author: authorUsername || '',
          authorizationUri: resource,
          created: Moment.utc(created).local(),
          lastAccessedByCurrentUser: Moment.utc(
            lastAccessedByCurrentUser,
          ).local(),
          lastModified: Moment.utc(lastModified).local(),
          lastModifiedByCurrentUser: Moment.utc(
            lastModifiedByCurrentUser,
          ).local(),
          specification: dashboardSpec,
          uri: $uri,
        }),
    );
  }

  getDashboardMeta(): DashboardMeta {
    const {
      author,
      authorizationUri,
      created,
      isFavorite,
      isOfficial,
      lastAccessedByCurrentUser,
      lastModified,
      lastModifiedByCurrentUser,
      slug,
      title,
      totalViews,
      totalViewsByUser,
      uri,
    } = this.modelValues();
    return DashboardMeta.create({
      author,
      authorizationUri,
      created,
      isFavorite,
      isOfficial,
      lastAccessedByCurrentUser,
      lastModified,
      lastModifiedByCurrentUser,
      slug,
      title,
      totalViews,
      totalViewsByUser,
      uri,
      // NOTE: this is only required when building the dashboard lists table
      // and never used with `getDashboardMeta` so is set by default to an empty array for
      // the type-checker
      myRoles: [],
    });
  }

  /**
   * Serialize this dashboard specifically for API calls that only update
   * its specification.
   */
  serializeForSpecUpdate(): {
    slug: string,
    specification: Zen.Serialized<DashboardSpecification>,
  } {
    const { slug, specification } = this.modelValues();
    return {
      slug,
      specification: specification.serialize(),
    };
  }
}

export default ((Dashboard: $Cast): Class<Zen.Model<Dashboard>>);
