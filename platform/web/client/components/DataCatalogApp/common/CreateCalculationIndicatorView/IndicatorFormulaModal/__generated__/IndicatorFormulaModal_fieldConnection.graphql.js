/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type IndicatorFormulaModal_fieldConnection$ref: FragmentReference;
declare export opaque type IndicatorFormulaModal_fieldConnection$fragmentType: IndicatorFormulaModal_fieldConnection$ref;
export type IndicatorFormulaModal_fieldConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +serializedCalculation: any,
    |}
  |}>,
  +$refType: IndicatorFormulaModal_fieldConnection$ref,
|};
export type IndicatorFormulaModal_fieldConnection$data = IndicatorFormulaModal_fieldConnection;
export type IndicatorFormulaModal_fieldConnection$key = {
  +$data?: IndicatorFormulaModal_fieldConnection$data,
  +$fragmentRefs: IndicatorFormulaModal_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "IndicatorFormulaModal_fieldConnection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "fieldEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "field",
          "kind": "LinkedField",
          "name": "node",
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
            },
            {
              "alias": "serializedCalculation",
              "args": null,
              "kind": "ScalarField",
              "name": "calculation",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '137be6a0335cbd22cf8e753be7a282c3';

export default node;
