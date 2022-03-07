// @flow

import Field from 'models/core/wip/Field';
import VendorScript from 'vendor/models/VendorScript';
import buildFilename from 'components/common/SharingUtil/buildFilename';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type CustomField from 'models/core/Field/CustomField';
import type { ExportDataRow } from 'util/export';

/**
 * Returns an unformatted XML to a formatted XML
 * Example:
 * Input:
 * <stratifier><stratum /></stratifier>
 *
 * Output:
 * <stratifier>
 *   <stratum />
 * </stratifier>
 *
 * @param unformattedXML
 */
function formatXML(unformattedXML: string): string {
  const PADDING = ' '.repeat(2); // set desired indent size here
  const reg = /(>)(<)(\/*)/g;
  let pad = 0;

  const xml = unformattedXML.replace(reg, '$1\r\n$2$3');

  return xml
    .split('\r\n')
    .map(node => {
      // Node is an element. E.g. <stratifier> is a node and </stratifier> is
      // also a node.
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        // Match nodes that span multiple lines
        // e.g. <test
        //        value
        //      >
        indent = 0;
      } else if (node.match(/^<\/\w/) && pad > 0) {
        // Matches nodes that contain "/"
        pad -= 1;
      } else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
        // Match nodes that do not contain "/"
        indent = 1;
      } else {
        indent = 0;
      }

      pad += indent;

      return PADDING.repeat(pad - indent) + node;
    })
    .join('\r\n');
}

const DEPENDENT_SCRIPTS = [VENDOR_SCRIPTS.filesaver, VENDOR_SCRIPTS.fhir];

/**
 * Function to convert a json query result into a formatted HL7 FHIR XML file.
 * More on HL7 http://hl7.org/fhir/
 * Currently using HL7 FHIR MeasureReport schema as that is the type mADX says
 * is compatible with mADX. http://hl7.org/fhir/measurereport.html
 * NOTE(vinh): I chose to add all the data objects into stratifier as that is
 * the the only acceptable option of adding a list that can contain an object
 * (stratum) that can support the different types of values we have within our
 * rows.
 * For row example:
 * input: {
 *    a1_number_of_sws_reached__27: 433,
 *    subdistrict: 'Ray Nkonyeni',
 *    timestamp: '2019-04-01'
 *  }
 * output:
 *  <stratifier>
 *    <stratum>
 *      <value>
 *        <text value="a1_number_of_sws_reached__27"/>
 *      </value>
 *      <measureScore>
 *        <unit value="433"/>
 *      </measureScore>
 *    </stratum>
 *    <stratum>
 *      <value>
 *        <text value="subdistrict"/>
 *      </value>
 *      <measureScore>
 *        <unit value="Ray Nkonyeni"/>
 *      </measureScore>
 *    </stratum>
 *    <stratum>
 *      <value>
 *        <text value="timestamp"/>
 *      </value>
 *      <measureScore>
 *        <unit value="2019-04-01"/>
 *      </measureScore>
 *    </stratum>
 *  </stratifier>
 * As shown, a stratifier encapsulates a data object. Within a stratifier, each
 * stratum encapsulates a key,value from the json. The stratum is also capable
 * of handling many different data values which is why this seemed to be the
 * best solution.
 * @param queryResultData
 * @param fields
 */
export default function exportToFHIRXML(
  queryResultData: $ReadOnlyArray<ExportDataRow>,
  fields: Array<Field | CustomField>,
): void {
  const stratifierList = [];
  queryResultData.forEach(dataObj => {
    const stratumList = [];
    Object.keys(dataObj).forEach(key => {
      const value = dataObj[key];
      if (!Number.isNaN(value)) {
        stratumList.push({
          value: {
            text: key,
          },
          measureScore: {
            unit: value,
          },
        });
      } else {
        stratumList.push({
          value: {
            text: key,
          },
          measureScore: {
            value,
          },
        });
      }
    });
    stratifierList.push({
      stratum: stratumList,
    });
  });
  const resource = {
    resourceType: 'MeasureReport',
    group: [
      {
        stratifier: stratifierList,
      },
    ],
  };
  VendorScript.loadAll(DEPENDENT_SCRIPTS).then(() => {
    const parser = new window.fhir.Fhir();
    const xml = formatXML(parser.objToXml(resource));
    // TODO(vinh): Because we don't know which resourceType to use yet.
    //  const results = parser.validate(xml, { errorOnUnxpected: true });
    const filesaverLoadPromise = VENDOR_SCRIPTS.filesaver.load();
    const blob = new Blob([xml], { type: 'text/xml' });
    const firstField = fields[0];
    const filename = buildFilename(firstField.get('label'));
    filesaverLoadPromise.then(() => {
      window.saveAs(blob, filename);
    });
  });
}
