/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldAboutPanelContent_field$ref: FragmentReference;
declare export opaque type FieldAboutPanelContent_field$fragmentType: FieldAboutPanelContent_field$ref;
export type FieldAboutPanelContent_field = {|
  +name: string,
  +description: ?string,
  +fieldCategoryMappings: $ReadOnlyArray<{|
    +category: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +fieldPipelineDatasourceMappings: $ReadOnlyArray<{|
    +pipelineDatasource: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldAboutPanelContent_field$ref,
|};
export type FieldAboutPanelContent_field$data = FieldAboutPanelContent_field;
export type FieldAboutPanelContent_field$key = {
  +$data?: FieldAboutPanelContent_field$data,
  +$fragmentRefs: FieldAboutPanelContent_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  },
  (v0/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldAboutPanelContent_field",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    {
      "alias": "fieldCategoryMappings",
      "args": null,
      "concreteType": "field_category_mapping",
      "kind": "LinkedField",
      "name": "field_category_mappings",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "category",
          "kind": "LinkedField",
          "name": "category",
          "plural": false,
          "selections": (v1/*: any*/),
          "storageKey": null
        }
      ],
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
          "selections": (v1/*: any*/),
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
(node/*: any*/).hash = '899be540fb628ee501788fbc9194892f';

export default node;
