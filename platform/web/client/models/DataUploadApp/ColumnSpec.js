// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DimensionService from 'services/wip/DimensionService';
import FieldService from 'services/wip/FieldService';
import I18N from 'lib/I18N';
import patchLegacyServices from 'components/DataCatalogApp/common/patchLegacyServices';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import { getFullDimensionName } from 'models/core/wip/Dimension/index';
import { slugify } from 'util/stringUtil';
import type Field from 'models/core/wip/Field/';
import type { ColumnType } from 'models/DataUploadApp/types';
import type { Deserializable } from 'lib/Zen';

// NOTE: If anymore logic that is different between the column types gets added to this
// file, it should probably just be split into different files.

type Datatype = 'number' | 'string' | 'datetime';

const DATE_CANONICAL_NAME = I18N.textById('Date');

// Patch services to use GraphQL relay queries instead of potions.
patchLegacyServices();

// NOTE: These functions are only called when the ColumnSpec is updated
// Get the canonical name for a dimension column
function getDimensionCanonicalName(match: string | void, name: string): string {
  // If a match exists then use that dimension's name, else use the column name
  return match ? getFullDimensionName(match) : name;
}

// Get the canonical name for a field column
function getFieldCanonicalName(name: string, field?: Field | void): string {
  // If a match exists (and thus field is not undefined) then use that field's name, else use
  // the column name
  if (!field) {
    return name;
  }
  return field.canonicalName();
}

function getSlugifiedFieldId(sourceId: string, name: string): string {
  return `${sourceId}_${slugify(name, '_', false)}`;
}

type RequiredValues = {
  /** The canonical name in the platform for the column */
  // NOTE: This value is derived in that it is completely dependent on the columnType,
  // name, and match values. However, as changing the column type or match calls a custom
  // function, just set this value there as this value may require a field lookup that would
  // have already been done in those functions.
  canonicalName: string,

  /** Type of the column when integrated */
  columnType: ColumnType,

  /** Type of the data */
  datatype: Datatype,

  /** Whether the column should be included in the integration */
  ignoreColumn: boolean,

  /** Whether this field column will be a new field. This will be expanded to dimensions soon. */
  isNewColumn: boolean,

  /** Canonical dimension or field match */
  match: string | void,

  /** Column name in the uploaded file */
  name: string,
};

type DerivedValues = {
  /**
   * Does the spec contain an error.
   * Note that this is separate from whether the column is ignored ie. a column can have error
   * and ignoreColumn be true.
   */
  error: boolean,
};

export type SerializedColumnSpec = {
  columnType: ColumnType,
  datatype: Datatype,
  ignoreColumn: boolean,
  match: string | null,
  name: string,
};

/**
 * ColumnSpec contains information about a column from an input CSV.
 */
class ColumnSpec
  extends Zen.BaseModel<ColumnSpec, RequiredValues, {}, DerivedValues>
  implements Deserializable<SerializedColumnSpec> {
  static derivedConfig: Zen.DerivedConfig<ColumnSpec, DerivedValues> = {
    error: [
      // NOTE: datatype will never change
      Zen.hasChanged<ColumnSpec>(
        'columnType',
        'datatype',
        'isNewColumn',
        'match',
      ),
      column => {
        switch (column.columnType()) {
          case COLUMN_TYPE.DATE:
            return column.datatype() !== 'datetime';
          case COLUMN_TYPE.FIELD:
            return (
              column.datatype() !== 'number' ||
              (!column.isNewColumn() && !column.match())
            );
          case COLUMN_TYPE.DIMENSION:
            // TODO: when data catalog is connected and unmatched dimensions are allowed, remove the
            // match check and corresponding error message
            return !column.match();
          default:
            return true;
        }
      },
    ],
  };

  static deserializeAsync(
    serializedColumnSpec: SerializedColumnSpec,
  ): Promise<Zen.Model<ColumnSpec>> {
    const { columnType, name } = serializedColumnSpec;
    const match = serializedColumnSpec.match || undefined;
    switch (columnType) {
      case COLUMN_TYPE.FIELD: {
        // No automatic matching is done for fields. If the match is not undefined, we will
        // verify the field exists. Otherwise, all fields default to being new fields.
        const promise = match
          ? FieldService.get(match)
          : Promise.resolve(undefined);
        return promise.then(field => {
          const newMatch = field === undefined ? undefined : match;
          return ColumnSpec.create({
            ...serializedColumnSpec,
            canonicalName: getFieldCanonicalName(name, field),
            columnType: COLUMN_TYPE.FIELD,
            isNewColumn: !newMatch,
            match: newMatch,
          });
        });
      }
      case COLUMN_TYPE.DATE:
        return Promise.resolve(
          ColumnSpec.create({
            ...serializedColumnSpec,
            canonicalName: DATE_CANONICAL_NAME,
            isNewColumn: false,
            match: undefined,
          }),
        );
      case COLUMN_TYPE.DIMENSION:
        return Promise.resolve(
          ColumnSpec.create({
            ...serializedColumnSpec,
            match,
            canonicalName: getDimensionCanonicalName(match, name),
            isNewColumn: false,
          }),
        );
      default:
        throw new Error(
          `[ColumnSpec Deserialization] Invalid column type '${columnType}'.`,
        );
    }
  }

  toDimensionType(): Promise<Zen.Model<ColumnSpec>> {
    return DimensionService.get(this._.name()).then(dimension => {
      const match = dimension === undefined ? undefined : this._.name();
      return this._.modelValues({
        match,
        canonicalName: getDimensionCanonicalName(match, this._.name()),
        columnType: COLUMN_TYPE.DIMENSION,
        isNewColumn: false,
      });
    });
  }

  toDateType(): Zen.Model<ColumnSpec> {
    return this.modelValues({
      canonicalName: DATE_CANONICAL_NAME,
      columnType: COLUMN_TYPE.DATE,
      isNewColumn: false,
      match: undefined,
    });
  }

  toFieldType(): Zen.Model<ColumnSpec> {
    const { name } = this.modelValues();
    return this._.modelValues({
      canonicalName: getFieldCanonicalName(name),
      columnType: COLUMN_TYPE.FIELD,
      isNewColumn: true,
      match: undefined,
    });
  }

  updateDimensionMatch(newMatch: string): Zen.Model<ColumnSpec> {
    invariant(
      this._.columnType() === COLUMN_TYPE.DIMENSION,
      `This function is only for type dimension, not type ${this._.columnType()}`,
    );
    return this.modelValues({
      canonicalName: getDimensionCanonicalName(newMatch, this._.name()),
      match: newMatch,
    });
  }

  updateFieldMatch(field: Field): Zen.Model<ColumnSpec> {
    invariant(
      this._.columnType() === COLUMN_TYPE.FIELD,
      `This function is only for type field, not type ${this._.columnType()}`,
    );
    return this.modelValues({
      canonicalName: field.canonicalName(),
      match: field.id(),
    });
  }

  // The invalid cards do not include cards that are ignored, since they do not
  // have issues that the user needs to address before submitting
  isInvalid(): boolean {
    return !this._.ignoreColumn() && this._.error();
  }

  serialize(sourceId: string): SerializedColumnSpec {
    const {
      columnType,
      datatype,
      ignoreColumn,
      isNewColumn,
      match,
      name,
    } = this.modelValues();
    // Store new field matches as the slugified column name
    const newMatch =
      columnType === COLUMN_TYPE.FIELD && isNewColumn
        ? getSlugifiedFieldId(sourceId, name)
        : match || null;
    return { columnType, datatype, ignoreColumn, name, match: newMatch };
  }
}

export default ((ColumnSpec: $Cast): Class<Zen.Model<ColumnSpec>>);
