// @flow
import * as Zen from 'lib/Zen';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import computeEnabledVisualizations from 'models/AdvancedQueryApp/VisualizationType/computeEnabledVisualizations';
import computeRequirementsStatusMap from 'models/AdvancedQueryApp/VisualizationType/computeRequirementsStatusMap';
import {
  AQT_DEFAULT_VIEW_TYPE,
  AQT_RESULT_VIEW_ORDER,
} from 'components/AdvancedQueryApp/registry/viewTypes';
import { uniqueId } from 'util/util';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';
import type {
  VisualizationRequirementStatusMap,
  VisualizationType,
} from 'models/AdvancedQueryApp/VisualizationType/types';

type Values = {
  id: string,
  name: string,
};

type DefaultValues = {
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,
};

type DerivedValues = {
  /**
   * A map of all visualization types to their requirements status (i.e. which
   * have been satisified yet or not).
   */
  vizRequirementsStatusMap: VisualizationRequirementStatusMap,

  /**
   * An array of all visualization types that have fulfilled all their
   * requirements to render.
   */
  enabledVisualizationTypes: $ReadOnlyArray<VisualizationType>,

  /**
   * An array of all visualization types that have fulfilled all their
   * loose requirements to render.
   */
  looselyEnabledVisualizationTypes: $ReadOnlyArray<VisualizationType>,
};

type SerializedQueryTabItem = {
  id: string,
  name: string,
  queryResultSpec: Zen.Serialized<QueryResultSpec> | void,
  querySelections: Zen.Serialized<QuerySelections>,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,
};

const TEXT = t('AdvancedQueryApp.QueryTabItem');

let TABS_CREATED = 0;
function buildTabName(): string {
  TABS_CREATED++;
  return `${TEXT.newQueryNamePrefix} ${TABS_CREATED}`;
}

function extractTabNumber(name: string): number {
  if (!name.startsWith(TEXT.newQueryNamePrefix)) {
    return -1;
  }

  const tabNumber = Number(name.replace(TEXT.newQueryNamePrefix, ''));
  return Number.isInteger(tabNumber) && tabNumber >= 0 ? tabNumber : -1;
}

class QueryTabItem
  extends Zen.BaseModel<QueryTabItem, Values, DefaultValues, DerivedValues>
  implements Serializable<SerializedQueryTabItem> {
  static defaultValues: DefaultValues = {
    queryResultSpec: undefined,
    querySelections: QuerySelections.create({
      fields: Zen.Array.create(),
      groups: Zen.Array.create(),
      filter: Zen.Array.create(),
    }),
    viewType: AQT_DEFAULT_VIEW_TYPE,
    visualizationType: undefined,
  };

  static derivedConfig: Zen.DerivedConfig<QueryTabItem, DerivedValues> = {
    vizRequirementsStatusMap: [
      Zen.hasChanged('querySelections'),
      tab => computeRequirementsStatusMap(tab.querySelections()),
    ],
    enabledVisualizationTypes: [
      Zen.hasChanged('querySelections'),
      tab => computeEnabledVisualizations(tab.querySelections(), 'CORE'),
    ],
    looselyEnabledVisualizationTypes: [
      Zen.hasChanged('querySelections'),
      tab => computeEnabledVisualizations(tab.querySelections(), 'LOOSE'),
    ],
  };

  /*
   * Create a new QueryTabItem with a unique id. If given a dictionary with
   * existing values, a unique id will be generated and attached.
   */
  static createWithUniqueId(
    values: $Shape<{ ...Values, ...DefaultValues }> = {},
  ): Zen.Model<QueryTabItem> {
    // If ID is not set, provide a new unique id for the model.
    const id = `tab-${uniqueId()}`;
    const name = values.name ? values.name : buildTabName();
    return QueryTabItem.create({
      id,
      name,
      queryResultSpec: values.queryResultSpec,
      querySelections: values.querySelections,
      viewType: values.viewType,
      visualizationType: values.visualizationType,
    });
  }

  cloneWithNewName(cloneName: string): Zen.Model<QueryTabItem> {
    const newId = `${this._.id()}--${uniqueId()}`;
    return this._.id(newId).name(cloneName);
  }

  /*
   * Note that this guarantees that the id of the tab is unique
   */
  static deserializeAsync(
    value: SerializedQueryTabItem,
  ): Promise<Zen.Model<QueryTabItem>> {
    const { name, querySelections, viewType, visualizationType } = value;
    return QuerySelections.deserializeAsync(querySelections).then(
      deserializedQuerySelections => {
        // HACK(stephen): Keep the TABS_CREATED variable in sync during
        // deserialization. Need a better way to do this.
        const tabNumber = extractTabNumber(name);
        if (tabNumber >= 0 && tabNumber > TABS_CREATED) {
          TABS_CREATED = tabNumber;
        }

        let queryResultSpec;
        if (value.queryResultSpec !== undefined) {
          // Always keep the `viewTypes` in the spec in sync with the current
          // available view types. QueryResultSpec does not know when the
          // allowable `viewTypes` has changed, and it will not create new
          // viz settings for new viewTypes that are missing from the serialized
          // spec. This will occur whenever a new visualization is added to
          // AQT.
          // eslint-disable-next-line no-param-reassign
          value.queryResultSpec.viewTypes = AQT_RESULT_VIEW_ORDER;
          queryResultSpec = QueryResultSpec.deserialize(value.queryResultSpec);
        }

        return QueryTabItem.createWithUniqueId({
          name,
          queryResultSpec,
          visualizationType,
          querySelections: deserializedQuerySelections,
          viewType: AQT_RESULT_VIEW_ORDER.includes(viewType)
            ? viewType
            : AQT_DEFAULT_VIEW_TYPE,
        });
      },
    );
  }

  // Override the BaseModel's `set` method so that we can perform extra work if
  // `querySelections` has changed. This is needed because `queryResultSpec` has
  // to be kept in sync with `querySelections`, otherwise visualizations will
  // crash. Since setting `querySelections` normally will not touch
  // `queryResultSpec`, we must override the base setter so that we can keep
  // `queryResultSpec` in sync.
  // TODO(pablo): this is not type safe. We should consider adding an API-level
  // way to trigger updates after a set call, for the cases where a non-derived
  // value has to be updated after something changes.
  set(key: any, value: any): Zen.Model<QueryTabItem> {
    const output = super.set(key, value);

    // If `querySelections` is not being changed, do nothing special.
    // NOTE(stephen): Checking `instanceof` vs `key !== 'querySelections'`
    // because flow thinks that a string literal is incompatible with K.
    if (!(value instanceof QuerySelections)) {
      return output;
    }

    // Need to cast the value because Flow cannot infer the type after we make
    // it past the `if` block.
    const querySelections = (value: QuerySelections);
    let queryResultSpec: QueryResultSpec | void = this._.queryResultSpec();

    // If there are no fields to query, clear the stored QueryResultSpec.
    if (querySelections.fields().isEmpty()) {
      queryResultSpec = undefined;
    } else if (queryResultSpec === undefined) {
      // Create the queryResultSpec now that our QuerySelections has at least
      // one field.
      queryResultSpec = QueryResultSpec.fromQuerySelections(
        AQT_RESULT_VIEW_ORDER,
        querySelections,
      );
    } else {
      queryResultSpec = queryResultSpec.updateSpecFromNewQuerySelections(
        querySelections,
        this._.querySelections(),
      );
    }

    return output.queryResultSpec(queryResultSpec);
  }

  /**
   * Resets the values of the current tab. Note that this does not create a new
   * id or name, because we want to preserve the identity of the tab.
   */
  reset(): Zen.Model<QueryTabItem> {
    return QueryTabItem.create({
      id: this._.id(),
      name: this._.name(),
    });
  }

  /**
   * Check if a given visualization type is enabled for this tab (i.e. it has
   * fulfilled all its requirements in order to render)
   */
  isVisualizationTypeEnabled(visualizationType: VisualizationType): boolean {
    return this._.enabledVisualizationTypes().includes(visualizationType);
  }

  /**
   * Check if a given visualization type is loosely enabled i.e it fullfills minimum
   * requirements for it to be kept in view
   */
  isVisualizationTypeLooselyEnabled(
    visualizationType: VisualizationType,
  ): boolean {
    return this._.looselyEnabledVisualizationTypes().includes(
      visualizationType,
    );
  }

  /**
   * Check if the active viz type for this tab is enabled (i.e. it has
   * fulfilled all its requirements in order to render)
   */
  isActiveVisualizationTypeEnabled(): boolean {
    const activeVisualizationType = this._.visualizationType();
    return this._.enabledVisualizationTypes().includes(activeVisualizationType);
  }

  serialize(): SerializedQueryTabItem {
    const queryResultSpec = this._.queryResultSpec();
    return {
      queryResultSpec: queryResultSpec
        ? queryResultSpec.serialize()
        : undefined,
      querySelections: this._.querySelections().serialize(),
      viewType: this._.viewType(),
      visualizationType: this._.visualizationType(),
      id: this._.id(),
      name: this._.name(),
    };
  }
}

export default ((QueryTabItem: $Cast): Class<Zen.Model<QueryTabItem>>);
