/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CalculationInput_unpublishedField$ref = any;
type CategoryInput_unpublishedField$ref = any;
type DatasourceInput_unpublishedField$ref = any;
type DescriptionInput_unpublishedField$ref = any;
type NameInput_unpublishedField$ref = any;
type ShortNameInput_unpublishedField$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type UnpublishedFieldRow_unpublishedField$ref: FragmentReference;
declare export opaque type UnpublishedFieldRow_unpublishedField$fragmentType: UnpublishedFieldRow_unpublishedField$ref;
export type UnpublishedFieldRow_unpublishedField = {|
  +id: string,
  +name: ?string,
  +shortName: ?string,
  +description: ?string,
  +calculation: ?any,
  +unpublishedFieldCategoryMappings: $ReadOnlyArray<{|
    +categoryId: string
  |}>,
  +unpublishedFieldPipelineDatasourceMappings: $ReadOnlyArray<{|
    +pipelineDatasourceId: string
  |}>,
  +$fragmentRefs: CalculationInput_unpublishedField$ref & CategoryInput_unpublishedField$ref & DatasourceInput_unpublishedField$ref & DescriptionInput_unpublishedField$ref & NameInput_unpublishedField$ref & ShortNameInput_unpublishedField$ref,
  +$refType: UnpublishedFieldRow_unpublishedField$ref,
|};
export type UnpublishedFieldRow_unpublishedField$data = UnpublishedFieldRow_unpublishedField;
export type UnpublishedFieldRow_unpublishedField$key = {
  +$data?: UnpublishedFieldRow_unpublishedField$data,
  +$fragmentRefs: UnpublishedFieldRow_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UnpublishedFieldRow_unpublishedField",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": "shortName",
      "args": null,
      "kind": "ScalarField",
      "name": "short_name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "calculation",
      "storageKey": null
    },
    {
      "alias": "unpublishedFieldCategoryMappings",
      "args": null,
      "concreteType": "unpublished_field_category_mapping",
      "kind": "LinkedField",
      "name": "unpublished_field_category_mappings",
      "plural": true,
      "selections": [
        {
          "alias": "categoryId",
          "args": null,
          "kind": "ScalarField",
          "name": "category_id",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": "unpublishedFieldPipelineDatasourceMappings",
      "args": null,
      "concreteType": "unpublished_field_pipeline_datasource_mapping",
      "kind": "LinkedField",
      "name": "unpublished_field_pipeline_datasource_mappings",
      "plural": true,
      "selections": [
        {
          "alias": "pipelineDatasourceId",
          "args": null,
          "kind": "ScalarField",
          "name": "pipeline_datasource_id",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CalculationInput_unpublishedField"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CategoryInput_unpublishedField"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "DatasourceInput_unpublishedField"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "DescriptionInput_unpublishedField"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "NameInput_unpublishedField"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ShortNameInput_unpublishedField"
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '1fd97eb17d23620ece43ecd676b2423f';

export default node;
