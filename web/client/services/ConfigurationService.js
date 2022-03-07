// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import Configuration from 'services/models/Configuration';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

// A mapping of all the valid configuration keys.
export const CONFIGURATION_KEY = Object.freeze({
  PUBLIC_ACCESS: 'public_access',
  DEFAULT_URL: 'default_url',
  CRISP_ID: 'crisp_id',
  CRISP_ENABLED: 'crisp_enabled',
  PROJECT_MANAGER_IDS: 'project_manager_ids',
  CUR_DATASOURCE: 'cur_datasource',
  KEEP_ME_SIGNED: 'keep_me_signed_in',
  ENABLE_CASE_MANAGEMENT: 'enable_case_management',
  CASE_MANAGEMENT_APP_NAME: 'case_management_app_name',
  CASE_MANAGEMENT_HOME_PAGE_DASHBOARD: 'case_management_home_page_dashboard',
});

export type ConfigurationKey = $Values<typeof CONFIGURATION_KEY>;

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
    datasourceList: $ReadOnlyArray<string>,
    currentDatasource: string,
  }> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `metadata/data_sources`)
        .then(datasources =>
          resolve({
            datasourceList: datasources.datasource_list,
            currentDatasource: datasources.current_datasource,
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
