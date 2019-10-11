// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

export type SerializedDashboardLayoutMetadata = {
  upperX: number,
  upperY: number,
  rows: number,
  columns: number,
  isLocked: boolean,
};

type RequiredValues = {
  /**
   * The x co-ordinate of the upper left corner of this item on the dashboard.
   */
  upperX: number,

  /**
   * The y co-ordinate of the upper left corner of this item on the dashboard.
   */
  upperY: number,

  /**
   * The height of this item on the dashboard, as a number of rows.
   */
  rows: number,

  /**
   * The width of this item on the dashboard, as a number of columns if
   column count changes, then this number means something different.
   */
  columns: number,
};

type DefaultValues = {
  /**
   * Indicates whether or not this item is immobile on the dashboard or not.
   * If set to `false`, it cannot be moved directly or indirectly (e.g.
   * by moving neighbouring components).
   */
  isLocked: boolean,
};

class DashboardLayoutMetadata
  extends Zen.BaseModel<DashboardLayoutMetadata, RequiredValues, DefaultValues>
  implements Serializable<SerializedDashboardLayoutMetadata> {
  static defaultValues = {
    isLocked: false,
  };

  serialize(): SerializedDashboardLayoutMetadata {
    const { upperX, upperY, rows, columns, isLocked } = this.modelValues();
    return {
      upperX,
      upperY,
      rows,
      columns,
      isLocked,
    };
  }
}

export default ((DashboardLayoutMetadata: any): Class<
  Zen.Model<DashboardLayoutMetadata>,
>);
