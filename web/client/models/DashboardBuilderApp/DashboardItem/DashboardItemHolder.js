// @flow
import Promise from 'bluebird';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

import * as Zen from 'lib/Zen';
import { deserializeAsyncDashboardItem } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemSerializationUtil';
import { uuid } from 'util/util';
import type { DashboardItemType } from 'models/DashboardBuilderApp/DashboardItem/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedDashboardItem } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemSerializationUtil';

// The position of a dashboard tile on the grid.
export type TilePosition = {
  +columnCount: number,
  +rowCount: number,
  +x: number,
  +y: number,
};

type Values = {
  /**
   * The tile ID for this item.
   */
  id: string,

  /**
   * The actual tile data that this DashboardItemHolder holds. This contains
   * all the data needed to render a tile.
   */
  item: DashboardItemType,

  /**
   * The position of a dashboard tile on the grid.
   */
  position: TilePosition,
};

type DerivedValues = {
  /**
   * The react-grid-layout position type. The react-grid-layout position's
   * variable names are pretty short, so we prefer to have a more verbose
   * representation stored in the actual model.
   */
  reactGridPosition: ReactGridPosition,
};

type SerializedDashboardItemHolder = {
  id: string,
  item: SerializedDashboardItem,
  position: TilePosition,
};

function buildReactGridPosition(
  id: string,
  position: TilePosition,
): ReactGridPosition {
  const { columnCount, rowCount, x, y } = position;
  return {
    h: rowCount,
    i: id,
    w: columnCount,
    x,
    y,
  };
}

/**
 * The DashboardItemHolder stores the position of an individual dashboard tile
 * alongside the data needed to render that tile.
 */
class DashboardItemHolder
  extends Zen.BaseModel<DashboardItemHolder, Values, {}, DerivedValues>
  implements Serializable<SerializedDashboardItemHolder> {
  static derivedConfig: Zen.DerivedConfig<
    DashboardItemHolder,
    DerivedValues,
  > = {
    reactGridPosition: [
      Zen.hasChanged('id', 'position'),
      item => buildReactGridPosition(item.id(), item.position()),
    ],
  };

  static createWithUniqueId(
    item: DashboardItemType,
    position: TilePosition,
  ): Zen.Model<DashboardItemHolder> {
    return DashboardItemHolder.create({
      id: uuid(),
      item,
      position,
    });
  }

  static deserializeAsync(
    serializedDashboardItemHolder: SerializedDashboardItemHolder,
  ): Promise<Zen.Model<DashboardItemHolder>> {
    const {
      id,
      item: serializedItem,
      position,
    } = serializedDashboardItemHolder;

    return deserializeAsyncDashboardItem(serializedItem).then(item =>
      DashboardItemHolder.create({
        id,
        item,
        position,
      }),
    );
  }

  serialize(): SerializedDashboardItemHolder {
    const { id, item, position } = this.modelValues();
    return {
      id,
      item: item.serialize(),
      position,
    };
  }

  /**
   * Determine if the ReactGridPosition provided matches the internal position
   * of this item exactly.
   */
  doesReactGridPositionMatch(reactGridPosition: ReactGridPosition): boolean {
    const { columnCount, rowCount, x, y } = this._.position();
    return (
      reactGridPosition.w === columnCount &&
      reactGridPosition.h === rowCount &&
      reactGridPosition.x === x &&
      reactGridPosition.y === y
    );
  }

  /**
   * Determine if the ReactGridPosition provided matches the internal width and
   * height of this item exactly.
   */
  doReactGridDimensionsMatch(reactGridPosition: ReactGridPosition): boolean {
    const { columnCount, rowCount } = this._.position();
    return (
      reactGridPosition.w === columnCount && reactGridPosition.h === rowCount
    );
  }

  /**
   * Given a react-grid-layout position, update the DashboardItemHolder's
   * position to match it.
   */
  updatePositionFromReactGrid(
    reactGridPosition: ReactGridPosition,
  ): Zen.Model<DashboardItemHolder> {
    return this._.position({
      columnCount: reactGridPosition.w,
      rowCount: reactGridPosition.h,
      x: reactGridPosition.x,
      y: reactGridPosition.y,
    });
  }

  isEqual(
    item: DashboardItemType,
    id: string,
    position: TilePosition,
  ): boolean {
    return (
      this._.id() === id &&
      this._.item() === item &&
      this._.position() === position
    );
  }
}

export default ((DashboardItemHolder: $Cast): Class<
  Zen.Model<DashboardItemHolder>,
>);
