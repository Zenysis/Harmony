// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import Configuration from 'services/models/Configuration';
import I18N from 'lib/I18N';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

// A mapping of all the valid configuration keys.
export const CONFIGURATION_KEY = Object.freeze({
  CUR_DATASOURCE: 'cur_datasource',
  DATA_CATALOG_LAST_IMPORT_DATE: 'data_catalog_last_import_date',
  DEFAULT_URL: 'default_url',
  KEEP_ME_SIGNED: 'keep_me_signed_in',
  PROJECT_MANAGER_IDS: 'project_manager_ids',
  PUBLIC_ACCESS: 'public_access',
});

export type ConfigurationKey = $Values<typeof CONFIGURATION_KEY>;

// The front end display text for all configuration keys.
export const CONFIGURATION_DISPLAY_TEXT: { [ConfigurationKey]: string } = {
  cur_datasource: I18N.text('Datasource'),
  data_catalog_last_import_date: I18N.text('Data Catalog Last Import Date'),
  default_url: I18N.text('Default URL'),
  keep_me_signed_in: I18N.text('Automatic Sign Out Setting'),
  project_manager_ids: I18N.text('Project Managers'),
  public_access: I18N.text('Public Access'),
};

// The optional front end warning text for configuration keys.
export const CONFIGURATION_WARNING_TEXT: { [ConfigurationKey]: string } = {
  public_access: I18N.text(
    'By changing the value of this checkbox, you will allow or prevent unregistered users from running queries on the site and viewing Dashboards.',
  ),
};

// The front end help text for all configuration keys.
export const CONFIGURATION_HELP_TEXT: { [ConfigurationKey]: string } = {
  cur_datasource: I18N.text(
    'This setting allows user to select which datasource models will use.',
  ),
  data_catalog_last_import_date: I18N.text(
    'This setting indicates the last date Data Catalog was imported.',
  ),
  default_url: I18N.text(
    'This setting dictates which page the user will be redirected to upon logging in/accessing the index page.',
  ),
  keep_me_signed_in: I18N.text(
    "This setting dictates whether or not users will be automatically signed out after 30 minutes of inactivity by default. Users will still be able to select the 'Keep me signed in' check box to avoid being automatically signed out.",
  ),
  project_manager_ids: I18N.text(
    "A list of project managers for this platform. Project managers are bcc'ed on all 'critical' communications sent by the platform.",
  ),
  public_access: I18N.text(
    'Indicates whether or not public user support is enabled. When enabled, unregistered users will be able to access the site as well.',
  ),
};

class ConfigurationService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Gets the current value of a configuration setting from the configuration
   * API.
   *
   * @param {String} key Represents the particular setting name you wish to
   *                     retrieve the value for. All `key` values are defined
   *                     and explained in `CONFIGURATION_KEY`.
   *
   * @returns {Promise<Configuration>} A promise that when completed
   *                                   successfully will contain the resulting
   *                                   configuration object from the server.
   */
  @autobind
  getConfiguration(key: ConfigurationKey): Promise<Configuration> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `configuration/${key}`)
        .then(rawConfiguration => {
          const result = Configuration.deserialize(rawConfiguration);
          resolve(result);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /*
   * Gets the list of datasources from metadata API endpoint.
   */
  @autobind
  getDatasourceDict(): Promise<{
    currentDatasource: string,
    datasourceList: $ReadOnlyArray<string>,
  }> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `metadata/data_sources`)
        .then(datasources =>
          resolve({
            currentDatasource: datasources.current_datasource,
            datasourceList: datasources.datasource_list,
          }),
        )
        .catch(error => {
          reject(error);
        });
    });
  }

  /*
   * Sets the value of a configuration setting from the configuration API.
   */
  @autobind
  setConfiguration(setting: Configuration): Promise<Configuration> {
    const { key, value } = setting.modelValues();
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, `configuration/${key}/set`, value)
        .then(newEntry => {
          resolve(Configuration.deserialize(newEntry));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  resetConfiguration(key: ConfigurationKey): Promise<Configuration> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, `configuration/${key}/reset`)
        .then(newEntry => {
          resolve(Configuration.deserialize(newEntry));
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

export default (new ConfigurationService(APIService): ConfigurationService);
