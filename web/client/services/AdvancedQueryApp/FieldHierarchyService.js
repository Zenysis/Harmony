// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DirectoryService from 'services/DirectoryService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LRUCache from 'lib/LRUCache';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import LocalStorageService from 'services/LocalStorageService';
import { autobind, memoizeOne } from 'decorators';
import { buildFieldHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import type Field from 'models/core/wip/Field';
import type { Cache } from 'services/wip/CachedMapService';

const TEXT = t('services.AdvancedQueryApp.FieldHierarchyService');

const MRU_NODE_ID = '__mru';

class FieldHierarchyService {
  hierarchyChildren: Zen.Array<
    HierarchyItem<Field | LinkedCategory>,
  > = Zen.Array.create();

  mruCache: LRUCache<HierarchyItem<Field>>;
  mruHierarchyItem: HierarchyItem<
    Field | LinkedCategory,
  > = HierarchyItem.create({
    children: Zen.Array.create(),
    id: MRU_NODE_ID,
    metadata: LinkedCategory.create({
      id: MRU_NODE_ID,
      name: TEXT.mruGroupingName,
    }),
  });

  storageKey: string;

  constructor(maxSize: number, deploymentName: string, userId: number) {
    this.mruCache = new LRUCache(maxSize);

    this._standardizeLegacyStorageKeys(deploymentName, userId);
    this.storageKey = `${deploymentName}_mru_fields__${userId}`;

    // Sync the MRU cache when the browser unloads so that we can persist the
    // MRU fields.
    window.addEventListener('beforeunload', () =>
      this.syncPersistentMRUCache(),
    );
  }

  /**
   * It's possible, due to older versions of this service, that the local storage
   * is storing keys WITHOUT the user id. In those cases, just copy the old
   * data under the correct key name that includes the userId.
   */
  _standardizeLegacyStorageKeys(deploymentName: string, userId: number): void {
    const legacyStorageKey = `${deploymentName}_mru_fields`;
    const oldItem = LocalStorageService.getItem(legacyStorageKey);
    if (oldItem != null) {
      LocalStorageService.removeItem(legacyStorageKey);
      LocalStorageService.setItem(`${legacyStorageKey}__${userId}`, oldItem);
    }
  }

  /**
   * Restore the MRU fields selected in previous sessions from persistent
   * storage.
   */
  @autobind
  initializeMRUFieldList(fieldMap: $ReadOnly<Cache<Field>>): void {
    const rawMRUFieldIdArr = LocalStorageService.getItem(this.storageKey);
    const mruFieldIdArr = rawMRUFieldIdArr ? JSON.parse(rawMRUFieldIdArr) : [];
    // The MRU field ID array is stored from most recently used to least
    // recently used. When loading the mruCache, we need to load it in reverse
    // since the data structure backing it is an LRUCache.
    let hasValidField = false;
    mruFieldIdArr.reverse().forEach(fieldId => {
      const field = fieldMap[fieldId];
      if (field === undefined) {
        return;
      }
      this.addFieldToCache(fieldId, field);
      hasValidField = true;
    });

    // If none of the fields could be deserialized properly, clear out the
    // persisted fields.
    if (mruFieldIdArr.length > 0 && !hasValidField) {
      this.syncPersistentMRUCache(true);
    }
  }

  /**
   * Add the selected field to the cache using the provided ID.
   */
  addFieldToCache(id: string, field: Field) {
    // Fields in the MRU list should be stored with their full name as the
    // short name since they are being shown out of context from their normal
    // placement in the hierarchical selector.
    const metadata = field.shortName(field.name());
    this.mruCache.set(id, HierarchyItem.create({ id, metadata }));
    this.updateMRUHierarchyItem();
  }

  /**
   * Process the list of fields into a hierarchy and initialize the MRU fields.
   *
   * NOTE(stephen): This call is memoized so that we only do this work once.
   * The cache only needs to be read once, and the base hierarchy should only be
   * initialized once as well.
   */
  @memoizeOne
  _initializeFieldHierarchy(
    fields: $ReadOnlyArray<Field>,
    fieldMap: $ReadOnly<Cache<Field>>,
    fieldCategoryMapping: { +[fieldId: string]: LinkedCategory },
    sortValues: boolean,
  ) {
    const hierarchy = buildFieldHierarchy(
      fields,
      fieldCategoryMapping,
      sortValues,
    );
    const children = hierarchy.children();
    invariant(
      children,
      'Cannot initialize a field hierarchy that has no children at the root level',
    );
    this.hierarchyChildren = children;
    this.initializeMRUFieldList(fieldMap);
  }

  /**
   * Initialize the Field hierarchy from the list of fields supplied and return
   * a HierarchyItem root node that includes both the fields and MRU items.
   */
  @autobind
  initializeFieldHierarchy(
    fields: $ReadOnlyArray<Field>,
    fieldMap: $ReadOnly<Cache<Field>>,
    fieldCategoryMapping: { +[fieldId: string]: LinkedCategory },
    sortValues: boolean = false,
  ): HierarchyItem<LinkedCategory | Field> {
    this._initializeFieldHierarchy(
      fields,
      fieldMap,
      fieldCategoryMapping,
      sortValues,
    );
    return this.getFieldHierarchy();
  }

  /**
   * Return the cached MRU hierarchy items ordered from most recently used to
   * least recently used.
   */
  getMRUHierarchyItems(): $ReadOnlyArray<HierarchyItem<Field>> {
    // Pull the MRU fields from the cache. The order will be from LRU to MRU
    // since the datastructure being used is an LRUCache.
    const cacheValues = Array.from(this.mruCache.snapshotView().values());
    // Reverse the ordering of values so that the order is from MRU to LRU.
    return cacheValues.reverse();
  }

  /**
   * Create a HierarchyItem node that contains the MRU selected Fields as its
   * children.
   */
  updateMRUHierarchyItem() {
    this.mruHierarchyItem = this.mruHierarchyItem.children(
      Zen.Array.create(this.getMRUHierarchyItems()),
    );
  }

  /**
   * Build the full hierarchy root that includes the standard Field hierarchy
   * items and the MRU hierarchy items.
   */
  @memoizeOne
  buildFullFieldHierarchy(
    hierarchyChildren: Zen.Array<HierarchyItem<Field | LinkedCategory>>,
    mruHierarchyItem: HierarchyItem<Field | LinkedCategory>,
  ): HierarchyItem<Field | LinkedCategory> {
    // Insert the MRU node as the first item in the list.
    const children = hierarchyChildren.unshift(mruHierarchyItem);
    return HierarchyItem.createRoot().children(children);
  }

  /**
   * Return the full hierarchy root with the MRU hierarchy items included.
   */
  getFieldHierarchy(): HierarchyItem<Field | LinkedCategory> {
    return this.buildFullFieldHierarchy(
      this.hierarchyChildren,
      this.mruHierarchyItem,
    );
  }

  /**
   * Add a newly selected item to the MRU cache and return the new hierarchy
   * root with the updated cache.
   */
  @autobind
  addSelectedItem(
    item: HierarchyItem<Field>,
  ): HierarchyItem<Field | LinkedCategory> {
    this.addFieldToCache(item.id(), item.metadata());
    return this.getFieldHierarchy();
  }

  /**
   * Save the current MRU fields to a persistent cache.
   */
  syncPersistentMRUCache(allowSyncingEmptyList: boolean = false): void {
    const items = this.getMRUHierarchyItems();

    // Avoid syncing an empty list if we are not explicitly allowed to. This can
    // happen if the FieldHierarchyService is used on a page but never
    // initialized (like on dashboards).
    if (items.length === 0 && !allowSyncingEmptyList) {
      return;
    }

    // NOTE(stephen): There is an implicit dependency that the HierarchyItem's
    // ID is the actual original Field ID.
    const fieldIds = items.map(item => item.id());
    LocalStorageService.setItem(this.storageKey, JSON.stringify(fieldIds));
  }
}

export default (new FieldHierarchyService(
  25,
  window.__JSON_FROM_BACKEND.deploymentName,
  DirectoryService.getUserId(),
): FieldHierarchyService);
