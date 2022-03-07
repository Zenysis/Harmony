// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Field from 'models/core/wip/Field';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';

export const TEST_FIELDS: Array<Field> = [
  // simple field with nothing special about it. Plain old SUM calculation.
  Field.create({
    id: 'FIELD_1',
    canonicalName: 'Test Field 1',
    shortName: 'Field 1',
    calculation: SumCalculation.create({
      filter: FieldFilter.create({
        fieldId: 'FIELD_1',
      }),
    }),
  }),

  // another simple field with nothing special about it. Just a SUM calculation.
  Field.create({
    id: 'FIELD_2',
    canonicalName: 'Test Field 2',
    shortName: 'Field 2',
    calculation: SumCalculation.create({
      filter: FieldFilter.create({
        fieldId: 'FIELD_2',
      }),
    }),
  }),
];

export const TEST_FIELDS_MAP: {
  [string]: Field,
  ...,
} = Zen.ModelUtil.modelArrayToObject(TEST_FIELDS, 'id');

class MockFieldService {
  get(id: string): Promise<Field | void> {
    return Promise.resolve(TEST_FIELDS_MAP[id]);
  }

  getAll(): Promise<$ReadOnlyArray<Field>> {
    return Promise.resolve(TEST_FIELDS);
  }

  getMap(): Promise<{ +[id: string]: Field }> {
    return Promise.resolve(TEST_FIELDS_MAP);
  }
}

export default (new MockFieldService(): MockFieldService);
