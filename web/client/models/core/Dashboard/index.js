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
   * The last time the dashboard was modified (if ever) by the current user.
   * If it has never been modified by the current user, the Moment will be
   * invalid. This can be checked with date.isValid()
   */
  lastModifiedByCurrentUser: Moment,

  /**
   * The time at which any attribute of the Dashboard model was last modified.
   */
  lastModified: Moment,

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
   * The unique uri that can be used to locate this dashboard on the server
   */
  uri: string,
};

type SerializedDashboard = {
  $uri: string,
  authorUsername: string,
  created: string,
  isOfficial: boolean,
  isFavorite: boolean,
  lastAccessedByCurrentUser: string | null,
  lastModified: string | null,
  lastModifiedByCurrentUser: string,
  resource: string,
  slug: string,
  title: string,
  specification: Zen.Serialized<DashboardSpecification>,
  totalViewsByUser: number,
  totalViews: number,
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

    // all dates should be processed in UTC timezones, then converted to the
    // user's local timezone.
    return DashboardSpecification.deserializeAsync(specification).then(
      (dashboardSpec: DashboardSpecification) =>
        Dashboard.create({
          author: authorUsername || '',
          created: Moment.utc(created).local(),
          slug,
          title,
          uri: $uri,
          specification: dashboardSpec,
          isOfficial,
          isFavorite,
          totalViewsByUser,
          totalViews,
          lastAccessedByCurrentUser: Moment.utc(
            lastAccessedByCurrentUser,
          ).local(),
          lastModified: Moment.utc(lastModified).local(),
          lastModifiedByCurrentUser: Moment.utc(
            lastModifiedByCurrentUser,
          ).local(),
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
