/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DatasourceRow_field$ref: FragmentReference;
declare export opaque type DatasourceRow_field$fragmentType: DatasourceRow_field$ref;
export type DatasourceRow_field = {|
  +fieldPipelineDatasourceMappings: $ReadOnlyArray<{|
    +pipelineDatasource: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: DatasourceRow_field$ref,
|};
export type DatasourceRow_field$data = DatasourceRow_field;
export type DatasourceRow_field$key = {
  +$data?: DatasourceRow_field$data,
  +$fragmentRefs: DatasourceRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DatasourceRow_field",
  "selections": [
    {
      "alias": "fieldPipelineDatasourceMappings",
      "args": null,
      "concreteType": "field_pipeline_datasource_mapping",
      "kind": "LinkedField",
      "name": "field_pipeline_datasource_mappings",
      "plural": true,
      "selections": [
        {
          "alias": "pipelineDatasource",
          "args": null,
          "concreteType": "pipeline_datasource",
          "kind": "LinkedField",
          "name": "pipeline_datasource",
          "plural": false,
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
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '37950b528590511f79d1fa4212a187f9';

export default node;
