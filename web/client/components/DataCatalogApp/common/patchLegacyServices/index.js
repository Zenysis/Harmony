// @flow
import patchDimensionService from 'components/DataCatalogApp/common/patchLegacyServices/patchDimensionService';
import patchFieldMetadataService from 'components/DataCatalogApp/common/patchLegacyServices/patchFieldMetadataService';
import patchFieldService from 'components/DataCatalogApp/common/patchLegacyServices/patchFieldService';

// Patch all AQT query model services that use a Flask-Potion endpoint. This
// will allow us to transition more easily to Data Catalog powered query models
// across the entire site.
export default function patchLegacyServices() {
  patchDimensionService();
  patchFieldService();
  patchFieldMetadataService();
}
