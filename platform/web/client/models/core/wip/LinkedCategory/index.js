// @flow
import * as Zen from 'lib/Zen';
// No way to avoid this circular dependency unfortunately.
// eslint-disable-next-line import/no-cycle
import CategoryService from 'services/wip/CategoryService';
import { uniqueId } from 'util/util';
import type { Customizable } from 'types/interfaces/Customizable';
import type { JSONRef } from 'services/types/api';

type RequiredValues = {
  id: string,
  name: string,
};

type DefaultValues = {
  +description: string,

  // eslint-disable-next-line no-use-before-define
  +parent: Zen.Model<LinkedCategory> | void,
};

type SerializedLinkedCategory = JSONRef;

/**
 * The LinkedCategory model represents a simple mapping from an ID to a display
 * name. It is a simple key/value mapping (with an optional description).
 *
 * It also has an optional parent node that can be used to represent
 * defined hierarchical relationships between categories. When using a
 * LinkedCategory, you should store a reference to the *most granular* category
 * that represents your data. By storing the child node of the LinkedCategory
 * tree, you can traverse upwards using the `parent` property to find the levels
 * this category applies to.
 */
class LinkedCategory
  extends Zen.BaseModel<LinkedCategory, RequiredValues, DefaultValues>
  implements Customizable<LinkedCategory> {
  tag: 'LINKED_CATEGORY' = 'LINKED_CATEGORY';
  static defaultValues: DefaultValues = {
    description: '',
    parent: undefined,
  };

  static deserializeAsync(
    values: SerializedLinkedCategory,
  ): Promise<Zen.Model<LinkedCategory>> {
    return CategoryService.forceGet(
      CategoryService.convertURIToID(values.$ref),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedLinkedCategory,
  ): Zen.Model<LinkedCategory> {
    return CategoryService.UNSAFE_forceGet(
      CategoryService.convertURIToID(values.$ref),
    );
  }

  customize(): Zen.Model<LinkedCategory> {
    return LinkedCategory.create({
      ...this.modelValues(),
      id: `${this._.id()}__${uniqueId()}`,
    });
  }

  serialize(): SerializedLinkedCategory {
    return {
      $ref: CategoryService.convertIDToURI(this._.id()),
    };
  }
}

export default ((LinkedCategory: $Cast): Class<Zen.Model<LinkedCategory>>);
