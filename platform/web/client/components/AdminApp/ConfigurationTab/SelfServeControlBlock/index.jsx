// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import ConfigurationBlock from 'components/AdminApp/ConfigurationTab/ConfigurationBlock';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ImportFieldsFromCSVWrapper from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportFieldsFromCSVWrapper';
import ImportSelfServeWrapper from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportSelfServeWrapper';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { downloadFile } from 'util/util';

const EXPORT_SELF_SERVE_ENDPOINT = '/api/export_self_serve';
const METADATA_EXPORT_ENDPOINT = '/api/export_data_catalog_metadata';

export default function SelfServeControlBlock(): React.Element<
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
        <div className="self-serve-control-block__section-title">{title}</div>
        {description}
        <Button onClick={onClick} outline>
          {buttonText}
        </Button>
      </Group.Vertical>
    );
  }

  const onExportSelfServeButtonClick = () => {
    downloadFile({ endpoint: EXPORT_SELF_SERVE_ENDPOINT });
    Toaster.success(
      I18N.text('Your self serve setup export will download shortly'),
    );
  };

  const onExportMetadataButtonClick = () => {
    downloadFile({ endpoint: METADATA_EXPORT_ENDPOINT });
    Toaster.success(
      I18N.text('Your data catalog metadata export will download shortly'),
    );
  };

  return (
    <React.Fragment>
      <ConfigurationBlock
        className="self-serve-control-block"
        title={I18N.text('Self Serve')}
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
            I18N.text('Export self serve setup', 'exportSelfServe'),
            I18N.text(
              "Export this instance's self serve setup to be used in other instances",
            ),
            I18N.textById('exportSelfServe'),
            onExportSelfServeButtonClick,
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
            I18N.text('Import self serve setup', 'importSelfServe'),
            I18N.text(
              'Import a self serve setup to replace the active one on this instance',
            ),
            I18N.textById('importSelfServe'),
            openImportDCModal,
          )}
        </Group.Vertical>
      </ConfigurationBlock>
      <ImportSelfServeWrapper
        onExportSelfServeButtonClick={onExportSelfServeButtonClick}
        onImportModalClose={closeImportDCModal}
        onImportModalOpen={openImportDCModal}
        showImportModal={showImportDCModal}
      />
      <ImportFieldsFromCSVWrapper
        onExportSelfServeButtonClick={onExportSelfServeButtonClick}
        onImportModalClose={closeImportCSVModal}
        onImportModalOpen={openImportCSVModal}
        showImportModal={showImportCSVModal}
      />
    </React.Fragment>
  );
}
