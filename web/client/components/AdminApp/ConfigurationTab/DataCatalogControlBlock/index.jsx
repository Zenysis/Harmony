// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import ConfigurationBlock from 'components/AdminApp/ConfigurationTab/ConfigurationBlock';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ImportDataCatalogWrapper from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock/ImportDataCatalogWrapper';
import ImportFieldsFromCSVWrapper from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock/ImportFieldsFromCSVWrapper';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';

const EXPORT_DATA_CATALOG_ENDPOINT = '/api/export_data_catalog';
const METADATA_EXPORT_ENDPOINT = '/api/export_data_catalog/metadata';

export default function DataCatalogControlBlock(): React.Element<
  typeof React.Fragment,
> {
  const [showImportDCModal, openImportDCModal, closeImportDCModal] = useBoolean(
    false,
  );
  const [
    showImportCSVModal,
    openImportCSVModal,
    closeImportCSVModal,
  ] = useBoolean(false);

  function renderSection(
    title: string,
    description: string,
    buttonText: string,
    onClick: () => void,
  ) {
    return (
      <Group.Vertical>
        <div className="data-catalog-control-block__section-title">{title}</div>
        {description}
        <Button onClick={onClick} outline>
          {buttonText}
        </Button>
      </Group.Vertical>
    );
  }

  const onExportDataCatalogButtonClick = () => {
    // TODO(solo): create a utility to allow for downloading
    // of files
    const link = document.createElement('a');
    link.href = EXPORT_DATA_CATALOG_ENDPOINT;
    const documentBody = document.body;
    if (documentBody) {
      documentBody.appendChild(link);
      link.click();
      documentBody.removeChild(link);
      Toaster.success(
        I18N.text('Your data catalog export will download shortly'),
      );
      analytics.track('Export data catalog in Site Config');
    }
  };

  const onExportMetadataButtonClick = () => {
    const link = document.createElement('a');
    link.href = METADATA_EXPORT_ENDPOINT;
    const documentBody = document.body;
    if (documentBody) {
      documentBody.appendChild(link);
      link.click();
      documentBody.removeChild(link);
      Toaster.success(
        I18N.text('Your data catalog metadata export will download shortly'),
      );
      analytics.track('Export data catalog metadata in Site Config');
    }
  };

  return (
    <React.Fragment>
      <ConfigurationBlock
        className="data-catalog-control-block"
        title={I18N.text('Data catalog')}
      >
        <Group.Vertical spacing="xl">
          {renderSection(
            I18N.text('Export metadata', 'exportMetadata'),
            I18N.text(
              'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators',
            ),
            I18N.textById('exportMetadata'),
            onExportMetadataButtonClick,
          )}
          {renderSection(
            I18N.text('Export data catalog', 'exportDataCatalog'),
            I18N.text(
              "Export this instance's data catalog to be used in other instances",
            ),
            I18N.textById('exportDataCatalog'),
            onExportDataCatalogButtonClick,
          )}
          {renderSection(
            I18N.text('Import new indicators', 'importNewIndicators'),
            I18N.text(
              'Import new indicators or update existing indicators defined in the Google Sheet CSV',
            ),
            I18N.textById('importNewIndicators'),
            openImportCSVModal,
          )}
          {renderSection(
            I18N.text('Import data catalog', 'importDataCatalog'),
            I18N.text(
              'Import a data catalog to replace the active data catalog on this instance',
            ),
            I18N.textById('importDataCatalog'),
            openImportDCModal,
          )}
        </Group.Vertical>
      </ConfigurationBlock>
      <ImportDataCatalogWrapper
        onExportDataCatalogButtonClick={onExportDataCatalogButtonClick}
        onImportModalClose={closeImportDCModal}
        onImportModalOpen={openImportDCModal}
        showImportModal={showImportDCModal}
      />
      <ImportFieldsFromCSVWrapper
        onExportDataCatalogButtonClick={onExportDataCatalogButtonClick}
        onImportModalClose={closeImportCSVModal}
        onImportModalOpen={openImportCSVModal}
        showImportModal={showImportCSVModal}
      />
    </React.Fragment>
  );
}
