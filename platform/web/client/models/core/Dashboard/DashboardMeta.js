// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';

type RequiredValues = {
  /** The username of the author who created this dashboard. */
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
   */
  lastAccessedByCurrentUser: Moment,

  /**
   * The time at which any attribute of the Dashboard model was last modified.
   */
  lastModified: Moment,

  /**
   * The last time the dashboard was modified (if ever) by the current user.
   */
  lastModifiedByCurrentUser: Moment,

  /* List of roles current user has for the dashboard */
  myRoles: $ReadOnlyArray<string>,

  /**
   * The short-name of the dashboard that the user can use to navigate
   * directly to the UI representation of the dashboard.
   */
  slug: string,

  /** The title of the dashboard. */
  title: string,

  /** The number of times the dashboard has been view. */
  totalViews: number,

  /**
   * The number of times the dashboard has been view by the current user.
   */
  totalViewsByUser: number,

  /**
   * The unique uri that can be used to locate this dashboard on the server.
   */
  uri: string,
};

type SerializedDashboardMeta = {
  $uri: string,
  authorUsername: string,
  created: string,
  isFavorite: boolean,
  isOfficial: boolean,
  lastAccessedByCurrentUser: string,
  lastModified: string,
  lastModifiedByCurrentUser: string,
  myRoles: $ReadOnlyArray<string>,
  resource: string,
  slug: string,
  title: string,
  totalViews: number,
  totalViewsByUser: number,
};

/**
 * The DashboardMeta is used by the `DashboardService` to represent all the
 * metadata associated with a dashboard (but not the actual dashboard itself).
 */
class DashboardMeta extends Zen.BaseModel<DashboardMeta, RequiredValues> {
  static deserialize({
    $uri,
    authorUsername,
    created,
    isFavorite,
    isOfficial,
    lastAccessedByCurrentUser,
    lastModified,
    lastModifiedByCurrentUser,
    myRoles,
    resource,
    slug,
    title,
    totalViews,
    totalViewsByUser,
  }: SerializedDashboardMeta): Zen.Model<DashboardMeta> {
    // all dates should be processed in UTC timezones, then converted to the
    // user's local timezone.
    return DashboardMeta.create({
      isFavorite,
      isOfficial,
      myRoles,
      slug,
      title,
      totalViews,
      totalViewsByUser,
      author: authorUsername || '',
      authorizationUri: resource,
      created: Moment.utc(created).local(),
      lastAccessedByCurrentUser: Moment.utc(lastAccessedByCurrentUser).local(),
      lastModified: Moment.utc(lastModified).local(),
      lastModifiedByCurrentUser: Moment.utc(lastModifiedByCurrentUser).local(),
      uri: $uri,
    });
  }
}

export default ((DashboardMeta: $Cast): Class<Zen.Model<DashboardMeta>>);
