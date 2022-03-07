/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CreateCalculationIndicatorView_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ContainerHeader_fieldConnection$ref: FragmentReference;
declare export opaque type ContainerHeader_fieldConnection$fragmentType: ContainerHeader_fieldConnection$ref;
export type ContainerHeader_fieldConnection = {|
  +$fragmentRefs: CreateCalculationIndicatorView_fieldConnection$ref,
  +$refType: ContainerHeader_fieldConnection$ref,
|};
export type ContainerHeader_fieldConnection$data = ContainerHeader_fieldConnection;
export type ContainerHeader_fieldConnection$key = {
  +$data?: ContainerHeader_fieldConnection$data,
  +$fragmentRefs: ContainerHeader_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ContainerHeader_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CreateCalculationIndicatorView_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'afb5471af939c499678e81695275c99e';

export default node;
