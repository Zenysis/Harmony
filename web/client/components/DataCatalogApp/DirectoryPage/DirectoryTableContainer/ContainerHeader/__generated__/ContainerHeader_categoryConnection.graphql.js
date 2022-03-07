/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CreateCalculationIndicatorView_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ContainerHeader_categoryConnection$ref: FragmentReference;
declare export opaque type ContainerHeader_categoryConnection$fragmentType: ContainerHeader_categoryConnection$ref;
export type ContainerHeader_categoryConnection = {|
  +$fragmentRefs: CreateCalculationIndicatorView_categoryConnection$ref,
  +$refType: ContainerHeader_categoryConnection$ref,
|};
export type ContainerHeader_categoryConnection$data = ContainerHeader_categoryConnection;
export type ContainerHeader_categoryConnection$key = {
  +$data?: ContainerHeader_categoryConnection$data,
  +$fragmentRefs: ContainerHeader_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ContainerHeader_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CreateCalculationIndicatorView_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '84b7b2bcef5733e8f8d805b410a6ac0d';

export default node;
