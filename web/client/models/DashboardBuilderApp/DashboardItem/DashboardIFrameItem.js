// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  /**
   * The title to show for this iframe tile.
   */
  title: string,

  /**
   * The external URL that will contain content we want to display inside the
   * dashboard tile.
   */
  iFrameURL: string,
};

type SerializedDashboardIFrameItem = {
  title: string,
  type: 'IFRAME_ITEM',
  iFrameURL: string,
};

/**
 * The DashboardIFrameItem represents a dashboard tile that will render an
 * iframe that contains external content.
 */
class DashboardIFrameItem
  extends Zen.BaseModel<DashboardIFrameItem, {}, DefaultValues>
  implements Serializable<SerializedDashboardIFrameItem> {
  +tag: 'IFRAME_ITEM' = 'IFRAME_ITEM';
  static defaultValues: DefaultValues = {
    title: 'Example',
    iFrameURL: 'http://example.com',
  };

  static deserialize(
    serilizedDashboardIFrameItem: SerializedDashboardIFrameItem,
  ): Zen.Model<DashboardIFrameItem> {
    const { title, iFrameURL } = serilizedDashboardIFrameItem;

    return DashboardIFrameItem.create({ title, iFrameURL });
  }

  serialize(): SerializedDashboardIFrameItem {
    const { title, iFrameURL } = this.modelValues();
    return { title, type: this.tag, iFrameURL };
  }
}

export default ((DashboardIFrameItem: $Cast): Class<
  Zen.Model<DashboardIFrameItem>,
>);
