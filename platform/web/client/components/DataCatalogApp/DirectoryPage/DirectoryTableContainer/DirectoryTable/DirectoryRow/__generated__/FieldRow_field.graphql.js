/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldRow_field$ref: FragmentReference;
declare export opaque type FieldRow_field$fragmentType: FieldRow_field$ref;
export type FieldRow_field = {|
  +id: string,
  +description: ?string,
  +name: string,
  +copiedFromFieldId: ?string,
  +fieldPipelineDatasourceMappings: $ReadOnlyArray<{|
    +pipelineDatasource: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldRow_field$ref,
|};
export type FieldRow_field$data = FieldRow_field;
export type FieldRow_field$key = {
  +$data?: FieldRow_field$data,
  +$fragmentRefs: FieldRow_field$ref,
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
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldRow_field",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    (v1/*: any*/),
    {
      "alias": "copiedFromFieldId",
      "args": null,
      "kind": "ScalarField",
      "name": "copied_from_field_id",
      "storageKey": null
    },
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
            (v0/*: any*/),
            (v1/*: any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFieldCalculation_field"
    }
  ],
  "type": "field",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = 'a15a69baef1044356800df52ba2c2e2a';

export default node;
