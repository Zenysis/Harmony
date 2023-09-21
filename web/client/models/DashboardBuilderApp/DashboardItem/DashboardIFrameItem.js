// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  /**
   * The external URL that will contain content we want to display inside the
   * dashboard tile.
   */
  iFrameURL: string,

  /**
   * The title to show for this iframe tile.
   */
  title: string,
};

type SerializedDashboardIFrameItem = {
  iFrameURL: string,
  title: string,
  type: 'IFRAME_ITEM',
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
    iFrameURL: 'http://example.com',
    title: 'Example',
  };

  static deserialize(
    serilizedDashboardIFrameItem: SerializedDashboardIFrameItem,
  ): Zen.Model<DashboardIFrameItem> {
    const { iFrameURL, title } = serilizedDashboardIFrameItem;

    return DashboardIFrameItem.create({ iFrameURL, title });
  }

  serialize(): SerializedDashboardIFrameItem {
    const { iFrameURL, title } = this.modelValues();
    return { iFrameURL, title, type: this.tag };
  }
}

export default ((DashboardIFrameItem: $Cast): Class<
  Zen.Model<DashboardIFrameItem>,
>);
