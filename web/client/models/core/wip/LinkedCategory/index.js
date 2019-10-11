// @flow
import * as Zen from 'lib/Zen';
import CategoryService from 'services/wip/CategoryService';
import type { JSONRef } from 'services/types/api';

const TEXT = t('select_filter.labels');

type RequiredValues = {
  id: Zen.ReadOnly<string>,
  name: Zen.ReadOnly<string>,
};

type DefaultValues = {
  description: Zen.ReadOnly<string>,

  // eslint-disable-next-line no-use-before-define
  parent: Zen.ReadOnly<Zen.Model<LinkedCategory> | void>,
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
class LinkedCategory extends Zen.BaseModel<
  LinkedCategory,
  RequiredValues,
  DefaultValues,
> {
  static defaultValues = {
    description: '',
    parent: undefined,
  };

  static fromObject(
    rawLinkedCategory: RequiredValues,
    parent?: Zen.Model<LinkedCategory>,
  ): Zen.Model<LinkedCategory> {
    const { id, name } = rawLinkedCategory;

    // This allows for some categories to have translated names,
    // and for some categories to have overwritten/unique names.
    const translatedName = name !== '' ? name : TEXT[id] || id;
    return LinkedCategory.create({ id, name: translatedName, parent });
  }

  static deserializeAsync(
    values: SerializedLinkedCategory,
  ): Promise<Zen.Model<LinkedCategory>> {
    return CategoryService.get(CategoryService.convertURIToID(values.$ref));
  }

  static UNSAFE_deserialize(
    values: SerializedLinkedCategory,
  ): Zen.Model<LinkedCategory> {
    return CategoryService.UNSAFE_get(
      CategoryService.convertURIToID(values.$ref),
    );
  }

  serialize(): SerializedLinkedCategory {
    return {
      $ref: CategoryService.convertIDToURI(this._.id()),
    };
  }
}

export default ((LinkedCategory: any): Class<Zen.Model<LinkedCategory>>);
