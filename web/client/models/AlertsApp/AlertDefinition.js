// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DirectoryService from 'services/DirectoryService';
import Field from 'models/core/wip/Field';
import I18N from 'lib/I18N';
import User from 'services/models/User';
import { deserializeAlertChecks } from 'models/AlertsApp/AlertCheck';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type {
  AlertCheck,
  SerializedAlertCheck,
} from 'models/AlertsApp/AlertCheck';
import type { Serializable } from 'lib/Zen';
import type { SerializedQueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

export const TIME_GRANULARITY_MAP = {
  day: (I18N.textById('Day'): string),
  month: (I18N.textById('Month'): string),
  week: (I18N.text('Week'): string),
};

type Values = {
  /** The checks made for this alert in stringified form */
  checks: Zen.Array<AlertCheck>,

  // TODO: Make this an optional field
  /** The dimension id for this notification. E.g. "RegionName", "District" */
  dimensionId: string,

  /**
   * The list of Fields for this definition. Different types of AlertChecks will require
   * different number of fields.
   */
  fields: Zen.Array<Field>,

  /** Values to filter the alerts on. */
  filters: Zen.Array<DimensionValueFilterItem>,

  /** Unique id for this alert definition in the resource table. */
  resourceURI: string,

  /** Time granularity for this definition. E.g. month */
  timeGranularity: string,

  /** Title for this definition. */
  title: string,

  /** URI for this definition */
  uri: string,

  /** User attached to dimension */
  user: User,
};

type SerializedAlertField = $Diff<
  Zen.Serialized<Field>,
  {
    customizableFilterItems?: $ReadOnlyArray<SerializedQueryFilterItem>,
    showNullAsZero?: boolean,
  },
>;

type SerializedAlertDefinition = {
  $uri: string,
  checks: $ReadOnlyArray<SerializedAlertCheck>,
  dimensionName: string,
  fields: $ReadOnlyArray<SerializedAlertField>,
  filters: $ReadOnlyArray<Zen.Serialized<DimensionValueFilterItem>>,
  resourceURI: string,
  timeGranularity: string,
  title: string,
  userId: number,
};

/**
 * AlertDefinition contains alert metadata and the rules that must
 * be met for an alert notification to be triggered.
 */
class AlertDefinition extends Zen.BaseModel<AlertDefinition, Values>
  implements Serializable<SerializedAlertDefinition> {
  static deserializeAsync({
    $uri,
    checks,
    dimensionName,
    fields,
    filters,
    userId,
    ...otherFields
  }: SerializedAlertDefinition): Promise<Zen.Model<AlertDefinition>> {
    return Promise.all([
      Promise.all(fields.map(field => Field.deserializeAsync(field))),
      Promise.all(
        filters.map(filter =>
          DimensionValueFilterItem.deserializeAsync(filter),
        ),
      ),
      DirectoryService.getUserByUri(`/api2/user/${userId}`),
    ]).then(([deserializedFields, deserializedFilters, deserializedUser]) => {
      return AlertDefinition.create({
        ...otherFields,
        checks: deserializeAlertChecks(checks),
        dimensionId: dimensionName,
        fields: Zen.Array.create(deserializedFields),
        filters: Zen.Array.create(deserializedFilters),
        uri: $uri,
        user: deserializedUser,
      });
    });
  }

  static serializeAlertField(field: Field): SerializedAlertField {
    const {
      customizableFilterItems,
      showNullAsZero,
      ...serializedAlertField
    } = field.serialize();
    return serializedAlertField;
  }

  serialize(): SerializedAlertDefinition {
    const fields = this._.fields()
      .map(field => AlertDefinition.serializeAlertField(field))
      .arrayView();

    return {
      fields,
      $uri: this._.uri(),
      checks: Zen.serializeArray<AlertCheck>(this._.checks()),
      dimensionName: this._.dimensionId(),
      filters: Zen.serializeArray(this._.filters()),
      resourceURI: this._.resourceURI(),
      timeGranularity: this._.timeGranularity(),
      title: this._.title(),
      userId: DirectoryService.getUserId(),
    };
  }

  getReadableDimension(): string {
    return getFullDimensionName(this._.dimensionId());
  }

  getFiltersLabel(): string {
    const filters = this._.filters();

    if (filters.size() === 0) {
      return I18N.text('None');
    }

    if (filters.size() === 1) {
      return getFullDimensionName(filters.first().dimension());
    }

    return I18N.text('%(number)s applied', {
      number: filters.size(),
    });
  }

  getReadableGranularity(): string {
    return TIME_GRANULARITY_MAP[this._.timeGranularity()];
  }

  getUserFullName(): string {
    const user = this._.user();
    return `${user.firstName()} ${user.lastName()}`.trim();
  }
}

export default ((AlertDefinition: $Cast): Class<Zen.Model<AlertDefinition>>);
