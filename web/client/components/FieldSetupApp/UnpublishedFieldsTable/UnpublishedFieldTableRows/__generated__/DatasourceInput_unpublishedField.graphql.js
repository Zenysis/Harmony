/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DatasourceInput_unpublishedField$ref: FragmentReference;
declare export opaque type DatasourceInput_unpublishedField$fragmentType: DatasourceInput_unpublishedField$ref;
export type DatasourceInput_unpublishedField = {|
  +id: string,
  +unpublishedFieldPipelineDatasourceMappings: $ReadOnlyArray<{|
    +datasource: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: DatasourceInput_unpublishedField$ref,
|};
export type DatasourceInput_unpublishedField$data = DatasourceInput_unpublishedField;
export type DatasourceInput_unpublishedField$key = {
  +$data?: DatasourceInput_unpublishedField$data,
  +$fragmentRefs: DatasourceInput_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DatasourceInput_unpublishedField",
  "selections": [
    (v0/*: any*/),
    {
      "alias": "unpublishedFieldPipelineDatasourceMappings",
      "args": null,
      "concreteType": "unpublished_field_pipeline_datasource_mapping",
      "kind": "LinkedField",
      "name": "unpublished_field_pipeline_datasource_mappings",
      "plural": true,
      "selections": [
        {
          "alias": "datasource",
          "args": null,
          "concreteType": "pipeline_datasource",
          "kind": "LinkedField",
          "name": "pipeline_datasource",
          "plural": false,
          "selections": [
            (v0/*: any*/),
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
  "type": "unpublished_field",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '9e6cfdf83e418eff4700e797c47ad63d';

export default node;
