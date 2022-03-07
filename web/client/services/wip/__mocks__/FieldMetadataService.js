// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dataset from 'models/core/wip/Dataset';
import FieldMetadata from 'models/core/wip/FieldMetadata';
import LinkedCategory from 'models/core/wip/LinkedCategory';

const TEST_DATASET = Dataset.create({
  id: 'DATASET_1',
  name: 'Test Dataset 1',
});

const TEST_CATEGORY = LinkedCategory.create({
  id: 'CATEGORY_1',
  name: 'Test Category 1',
});

export const TEST_FIELD_METADATA: Array<FieldMetadata> = [
  FieldMetadata.create({
    id: 'FIELD_METADATA_1',
    category: TEST_CATEGORY,
    dimensions: [],
    source: TEST_DATASET,
  }),
  FieldMetadata.create({
    id: 'FIELD_METADATA_2',
    category: TEST_CATEGORY,
    dimensions: [],
    source: TEST_DATASET,
  }),
];

export const TEST_FIELD_METADATA_MAP: {
  [string]: FieldMetadata,
  ...,
} = Zen.ModelUtil.modelArrayToObject(TEST_FIELD_METADATA, 'id');

class MockFieldMetadataService {
  get(id: string): Promise<FieldMetadata | void> {
    return Promise.resolve(TEST_FIELD_METADATA_MAP[id]);
  }

  getAll(): Promise<$ReadOnlyArray<FieldMetadata>> {
    return Promise.resolve(TEST_FIELD_METADATA);
  }

  getMap(): Promise<{ +[id: string]: FieldMetadata }> {
    return Promise.resolve(TEST_FIELD_METADATA_MAP);
  }
}

export default (new MockFieldMetadataService(): MockFieldMetadataService);
