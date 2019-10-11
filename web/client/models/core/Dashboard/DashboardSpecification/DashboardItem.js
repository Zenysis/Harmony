// @flow
import * as Zen from 'lib/Zen';
import DashboardLayoutMetadata from 'models/core/Dashboard/DashboardSpecification/DashboardLayoutMetadata';
import type { ReactGridItem } from 'components/GridDashboardApp/stateChanges';
import type { Serializable } from 'lib/Zen';
import type { SerializedDashboardLayoutMetadata } from 'models/core/Dashboard/DashboardSpecification/DashboardLayoutMetadata';

// Model representation that we receive from the backend
export type SerializedDashboardItem = {
  name: string,
  id: string,
  layoutMetadata: SerializedDashboardLayoutMetadata,
};

type RequiredValues = {
  id: string,
  layoutMetadata: DashboardLayoutMetadata,
};

type DefaultValues = {
  name: string,
};

type DerivedValues = {
  reactGridItem: ReactGridItem,
};

function computeReactGridItem(
  // eslint-disable-next-line no-use-before-define
  currDashboardItem: Zen.Model<DashboardItem>,
): ReactGridItem {
  const {
    upperX,
    upperY,
    columns,
    rows,
    isLocked,
  } = currDashboardItem.layoutMetadata().modelValues();
  return {
    i: currDashboardItem.id(),
    x: upperX,
    y: upperY,
    w: columns,
    h: rows,
    static: isLocked,
  };
}

/**
 * The DashboardItem model represents an item in a Dashboard
 * specification.
 */
class DashboardItem
  extends Zen.BaseModel<
    DashboardItem,
    RequiredValues,
    DefaultValues,
    DerivedValues,
  >
  implements Serializable<SerializedDashboardItem> {
  static defaultValues = {
    name: '',
  };

  static derivedConfig = {
    reactGridItem: [
      Zen.hasChanged<DashboardItem>('layoutMetadata', 'id'),
      computeReactGridItem,
    ],
  };

  static deserialize(
    values: SerializedDashboardItem,
  ): Zen.Model<DashboardItem> {
    const { id, name, layoutMetadata } = values;

    return DashboardItem.create({
      id,
      name,
      layoutMetadata: DashboardLayoutMetadata.create({ ...layoutMetadata }),
    });
  }

  serialize(): SerializedDashboardItem {
    const { id, name, layoutMetadata } = this.modelValues();

    return {
      id,
      name,
      layoutMetadata: layoutMetadata.serialize(),
    };
  }
}
export default ((DashboardItem: any): Class<Zen.Model<DashboardItem>>);
