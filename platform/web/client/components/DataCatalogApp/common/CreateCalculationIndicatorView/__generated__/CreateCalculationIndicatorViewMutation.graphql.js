/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type FieldRow_field$ref = any;
type ParentCategoryChange_fieldCategoryMapping$ref = any;
export type category_constraint = "category_pkey" | "%future added value";
export type category_update_column = "created" | "id" | "last_modified" | "name" | "parent_id" | "visibility_status" | "%future added value";
export type data_upload_file_summary_constraint = "data_upload_file_summary_pkey" | "%future added value";
export type data_upload_file_summary_update_column = "column_mapping" | "created" | "file_path" | "id" | "last_modified" | "self_serve_source_id" | "source_id" | "user_file_name" | "%future added value";
export type dataprep_flow_constraint = "dataprep_flow_pkey" | "dataprep_flow_recipe_id_key" | "%future added value";
export type dataprep_flow_update_column = "appendable" | "created" | "expected_columns" | "id" | "last_modified" | "recipe_id" | "%future added value";
export type dataprep_job_constraint = "dataprep_job_pkey" | "%future added value";
export type dataprep_job_update_column = "created" | "created_on_dataprep" | "dataprep_flow_id" | "id" | "job_id" | "last_modified" | "last_modified_on_dataprep" | "status" | "%future added value";
export type dimension_category_constraint = "dimension_category_pkey" | "%future added value";
export type dimension_category_mapping_constraint = "dimension_category_mapping_dimension_id_category_id_key" | "dimension_category_mapping_pkey" | "%future added value";
export type dimension_category_mapping_update_column = "category_id" | "created" | "dimension_id" | "id" | "last_modified" | "%future added value";
export type dimension_category_update_column = "created" | "id" | "last_modified" | "name" | "parent_id" | "%future added value";
export type dimension_constraint = "dimension_pkey" | "%future added value";
export type dimension_update_column = "authorizable" | "created" | "description" | "filterable" | "id" | "last_modified" | "name" | "%future added value";
export type field_category_mapping_constraint = "field_category_mapping_field_id_category_id_key" | "field_category_mapping_pkey" | "%future added value";
export type field_category_mapping_update_column = "category_id" | "created" | "field_id" | "id" | "last_modified" | "visibility_status" | "%future added value";
export type field_constraint = "field_pkey" | "%future added value";
export type field_dimension_mapping_constraint = "field_dimension_mapping_field_id_dimension_id_key" | "field_dimension_mapping_pkey" | "%future added value";
export type field_dimension_mapping_update_column = "created" | "dimension_id" | "field_id" | "id" | "last_modified" | "%future added value";
export type field_pipeline_datasource_mapping_constraint = "field_pipeline_datasource_map_field_id_pipeline_datasource__key" | "field_pipeline_datasource_mapping_pkey" | "%future added value";
export type field_pipeline_datasource_mapping_update_column = "created" | "field_id" | "id" | "last_modified" | "pipeline_datasource_id" | "%future added value";
export type field_update_column = "calculation" | "copied_from_field_id" | "created" | "description" | "id" | "last_modified" | "name" | "short_name" | "%future added value";
export type geo_dimension_metadata_constraint = "geo_dimension_metadata_pkey" | "%future added value";
export type geo_dimension_metadata_update_column = "id" | "lat_id" | "lon_id" | "%future added value";
export type hierarchical_dimension_metadata_constraint = "hierarchical_dimension_metadata_pkey" | "%future added value";
export type hierarchical_dimension_metadata_update_column = "dimension_id" | "id" | "parent_id" | "unique_identifier_dimension_id" | "%future added value";
export type non_hierarchical_dimension_constraint = "non_hierarchical_dimension_pkey" | "%future added value";
export type non_hierarchical_dimension_update_column = "id" | "%future added value";
export type pipeline_datasource_constraint = "pipeline_datasource_pkey" | "%future added value";
export type pipeline_datasource_update_column = "created" | "id" | "last_modified" | "name" | "%future added value";
export type self_serve_source_constraint = "self_serve_source_pkey" | "%future added value";
export type self_serve_source_update_column = "created" | "dataprep_flow_id" | "id" | "last_modified" | "source_id" | "%future added value";
export type unpublished_field_category_mapping_constraint = "unpublished_field_category_ma_unpublished_field_id_category_key" | "unpublished_field_category_mapping_pkey" | "%future added value";
export type unpublished_field_category_mapping_update_column = "category_id" | "id" | "unpublished_field_id" | "%future added value";
export type unpublished_field_constraint = "unpublished_field_pkey" | "%future added value";
export type unpublished_field_dimension_mapping_constraint = "unpublished_field_dimension_m_unpublished_field_id_dimensio_key" | "unpublished_field_dimension_mapping_pkey" | "%future added value";
export type unpublished_field_dimension_mapping_update_column = "dimension_id" | "id" | "unpublished_field_id" | "%future added value";
export type unpublished_field_pipeline_datasource_mapping_constraint = "unpublished_field_pipeline_da_unpublished_field_id_pipeline_key" | "unpublished_field_pipeline_datasource_mapping_pkey" | "%future added value";
export type unpublished_field_pipeline_datasource_mapping_update_column = "id" | "pipeline_datasource_id" | "unpublished_field_id" | "%future added value";
export type unpublished_field_update_column = "calculation" | "description" | "id" | "name" | "short_name" | "%future added value";
export type field_category_mapping_insert_input = {|
  category?: ?category_obj_rel_insert_input,
  category_id?: ?string,
  created?: ?any,
  field?: ?field_obj_rel_insert_input,
  field_id?: ?string,
  id?: ?number,
  last_modified?: ?any,
  visibility_status?: ?any,
|};
export type category_obj_rel_insert_input = {|
  data: category_insert_input,
  on_conflict?: ?category_on_conflict,
|};
export type category_insert_input = {|
  children?: ?category_arr_rel_insert_input,
  created?: ?any,
  field_category_mappings?: ?field_category_mapping_arr_rel_insert_input,
  id?: ?string,
  last_modified?: ?any,
  name?: ?string,
  parent?: ?category_obj_rel_insert_input,
  parent_id?: ?string,
  unpublished_field_category_mappings?: ?unpublished_field_category_mapping_arr_rel_insert_input,
  visibility_status?: ?any,
|};
export type category_arr_rel_insert_input = {|
  data: $ReadOnlyArray<category_insert_input>,
  on_conflict?: ?category_on_conflict,
|};
export type category_on_conflict = {|
  constraint: category_constraint,
  update_columns: $ReadOnlyArray<category_update_column>,
  where?: ?category_bool_exp,
|};
export type category_bool_exp = {|
  _and?: ?$ReadOnlyArray<category_bool_exp>,
  _not?: ?category_bool_exp,
  _or?: ?$ReadOnlyArray<category_bool_exp>,
  children?: ?category_bool_exp,
  created?: ?timestamp_comparison_exp,
  field_category_mappings?: ?field_category_mapping_bool_exp,
  id?: ?String_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  name?: ?String_comparison_exp,
  parent?: ?category_bool_exp,
  parent_id?: ?String_comparison_exp,
  unpublished_field_category_mappings?: ?unpublished_field_category_mapping_bool_exp,
  visibility_status?: ?visibility_status_enum_comparison_exp,
|};
export type timestamp_comparison_exp = {|
  _eq?: ?any,
  _gt?: ?any,
  _gte?: ?any,
  _in?: ?$ReadOnlyArray<any>,
  _is_null?: ?boolean,
  _lt?: ?any,
  _lte?: ?any,
  _neq?: ?any,
  _nin?: ?$ReadOnlyArray<any>,
|};
export type field_category_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<field_category_mapping_bool_exp>,
  _not?: ?field_category_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<field_category_mapping_bool_exp>,
  category?: ?category_bool_exp,
  category_id?: ?String_comparison_exp,
  created?: ?timestamp_comparison_exp,
  field?: ?field_bool_exp,
  field_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  visibility_status?: ?visibility_status_enum_comparison_exp,
|};
export type String_comparison_exp = {|
  _eq?: ?string,
  _gt?: ?string,
  _gte?: ?string,
  _ilike?: ?string,
  _in?: ?$ReadOnlyArray<string>,
  _iregex?: ?string,
  _is_null?: ?boolean,
  _like?: ?string,
  _lt?: ?string,
  _lte?: ?string,
  _neq?: ?string,
  _nilike?: ?string,
  _nin?: ?$ReadOnlyArray<string>,
  _niregex?: ?string,
  _nlike?: ?string,
  _nregex?: ?string,
  _nsimilar?: ?string,
  _regex?: ?string,
  _similar?: ?string,
|};
export type field_bool_exp = {|
  _and?: ?$ReadOnlyArray<field_bool_exp>,
  _not?: ?field_bool_exp,
  _or?: ?$ReadOnlyArray<field_bool_exp>,
  calculation?: ?jsonb_comparison_exp,
  copied_from_field?: ?field_bool_exp,
  copied_from_field_id?: ?String_comparison_exp,
  created?: ?timestamp_comparison_exp,
  description?: ?String_comparison_exp,
  field_category_mappings?: ?field_category_mapping_bool_exp,
  field_copies?: ?field_bool_exp,
  field_dimension_mappings?: ?field_dimension_mapping_bool_exp,
  field_pipeline_datasource_mappings?: ?field_pipeline_datasource_mapping_bool_exp,
  id?: ?String_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  name?: ?String_comparison_exp,
  short_name?: ?String_comparison_exp,
|};
export type jsonb_comparison_exp = {|
  _cast?: ?jsonb_cast_exp,
  _contained_in?: ?any,
  _contains?: ?any,
  _eq?: ?any,
  _gt?: ?any,
  _gte?: ?any,
  _has_key?: ?string,
  _has_keys_all?: ?$ReadOnlyArray<string>,
  _has_keys_any?: ?$ReadOnlyArray<string>,
  _in?: ?$ReadOnlyArray<any>,
  _is_null?: ?boolean,
  _lt?: ?any,
  _lte?: ?any,
  _neq?: ?any,
  _nin?: ?$ReadOnlyArray<any>,
|};
export type jsonb_cast_exp = {|
  String?: ?String_comparison_exp
|};
export type field_dimension_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<field_dimension_mapping_bool_exp>,
  _not?: ?field_dimension_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<field_dimension_mapping_bool_exp>,
  created?: ?timestamp_comparison_exp,
  dimension?: ?dimension_bool_exp,
  dimension_id?: ?String_comparison_exp,
  field?: ?field_bool_exp,
  field_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
|};
export type dimension_bool_exp = {|
  _and?: ?$ReadOnlyArray<dimension_bool_exp>,
  _not?: ?dimension_bool_exp,
  _or?: ?$ReadOnlyArray<dimension_bool_exp>,
  authorizable?: ?Boolean_comparison_exp,
  created?: ?timestamp_comparison_exp,
  description?: ?String_comparison_exp,
  dimension_category_mappings?: ?dimension_category_mapping_bool_exp,
  field_dimension_mappings?: ?field_dimension_mapping_bool_exp,
  filterable?: ?Boolean_comparison_exp,
  geoDimensionMetadataByLatId?: ?geo_dimension_metadata_bool_exp,
  geoDimensionMetadataByLonId?: ?geo_dimension_metadata_bool_exp,
  geo_dimension_metadata?: ?geo_dimension_metadata_bool_exp,
  hierarchicalDimensionMetadataByUniqueIdentifierDimensionId?: ?hierarchical_dimension_metadata_bool_exp,
  hierarchical_dimension_metadata?: ?hierarchical_dimension_metadata_bool_exp,
  id?: ?String_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  name?: ?String_comparison_exp,
  non_hierarchical_dimensions?: ?non_hierarchical_dimension_bool_exp,
  unpublished_field_dimension_mappings?: ?unpublished_field_dimension_mapping_bool_exp,
|};
export type Boolean_comparison_exp = {|
  _eq?: ?boolean,
  _gt?: ?boolean,
  _gte?: ?boolean,
  _in?: ?$ReadOnlyArray<boolean>,
  _is_null?: ?boolean,
  _lt?: ?boolean,
  _lte?: ?boolean,
  _neq?: ?boolean,
  _nin?: ?$ReadOnlyArray<boolean>,
|};
export type dimension_category_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<dimension_category_mapping_bool_exp>,
  _not?: ?dimension_category_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<dimension_category_mapping_bool_exp>,
  category_id?: ?String_comparison_exp,
  created?: ?timestamp_comparison_exp,
  dimension?: ?dimension_bool_exp,
  dimension_category?: ?dimension_category_bool_exp,
  dimension_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
|};
export type dimension_category_bool_exp = {|
  _and?: ?$ReadOnlyArray<dimension_category_bool_exp>,
  _not?: ?dimension_category_bool_exp,
  _or?: ?$ReadOnlyArray<dimension_category_bool_exp>,
  children?: ?dimension_category_bool_exp,
  created?: ?timestamp_comparison_exp,
  dimension_category_mappings?: ?dimension_category_mapping_bool_exp,
  id?: ?String_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  name?: ?String_comparison_exp,
  parent?: ?dimension_category_bool_exp,
  parent_id?: ?String_comparison_exp,
|};
export type Int_comparison_exp = {|
  _eq?: ?number,
  _gt?: ?number,
  _gte?: ?number,
  _in?: ?$ReadOnlyArray<number>,
  _is_null?: ?boolean,
  _lt?: ?number,
  _lte?: ?number,
  _neq?: ?number,
  _nin?: ?$ReadOnlyArray<number>,
|};
export type geo_dimension_metadata_bool_exp = {|
  _and?: ?$ReadOnlyArray<geo_dimension_metadata_bool_exp>,
  _not?: ?geo_dimension_metadata_bool_exp,
  _or?: ?$ReadOnlyArray<geo_dimension_metadata_bool_exp>,
  dimension?: ?dimension_bool_exp,
  dimensionByLatId?: ?dimension_bool_exp,
  dimensionByLonId?: ?dimension_bool_exp,
  id?: ?String_comparison_exp,
  lat_id?: ?String_comparison_exp,
  lon_id?: ?String_comparison_exp,
|};
export type hierarchical_dimension_metadata_bool_exp = {|
  _and?: ?$ReadOnlyArray<hierarchical_dimension_metadata_bool_exp>,
  _not?: ?hierarchical_dimension_metadata_bool_exp,
  _or?: ?$ReadOnlyArray<hierarchical_dimension_metadata_bool_exp>,
  dimension?: ?dimension_bool_exp,
  dimensionByUniqueIdentifierDimensionId?: ?dimension_bool_exp,
  dimension_id?: ?String_comparison_exp,
  hierarchical_dimension_metadata?: ?hierarchical_dimension_metadata_bool_exp,
  hierarchical_dimension_metadatum?: ?hierarchical_dimension_metadata_bool_exp,
  id?: ?Int_comparison_exp,
  parent_id?: ?Int_comparison_exp,
  unique_identifier_dimension_id?: ?String_comparison_exp,
|};
export type non_hierarchical_dimension_bool_exp = {|
  _and?: ?$ReadOnlyArray<non_hierarchical_dimension_bool_exp>,
  _not?: ?non_hierarchical_dimension_bool_exp,
  _or?: ?$ReadOnlyArray<non_hierarchical_dimension_bool_exp>,
  dimension?: ?dimension_bool_exp,
  id?: ?String_comparison_exp,
|};
export type unpublished_field_dimension_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<unpublished_field_dimension_mapping_bool_exp>,
  _not?: ?unpublished_field_dimension_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<unpublished_field_dimension_mapping_bool_exp>,
  dimension?: ?dimension_bool_exp,
  dimension_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  unpublished_field?: ?unpublished_field_bool_exp,
  unpublished_field_id?: ?String_comparison_exp,
|};
export type unpublished_field_bool_exp = {|
  _and?: ?$ReadOnlyArray<unpublished_field_bool_exp>,
  _not?: ?unpublished_field_bool_exp,
  _or?: ?$ReadOnlyArray<unpublished_field_bool_exp>,
  calculation?: ?jsonb_comparison_exp,
  description?: ?String_comparison_exp,
  id?: ?String_comparison_exp,
  name?: ?String_comparison_exp,
  short_name?: ?String_comparison_exp,
  unpublished_field_category_mappings?: ?unpublished_field_category_mapping_bool_exp,
  unpublished_field_dimension_mappings?: ?unpublished_field_dimension_mapping_bool_exp,
  unpublished_field_pipeline_datasource_mappings?: ?unpublished_field_pipeline_datasource_mapping_bool_exp,
|};
export type unpublished_field_category_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<unpublished_field_category_mapping_bool_exp>,
  _not?: ?unpublished_field_category_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<unpublished_field_category_mapping_bool_exp>,
  category?: ?category_bool_exp,
  category_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  unpublished_field?: ?unpublished_field_bool_exp,
  unpublished_field_id?: ?String_comparison_exp,
|};
export type unpublished_field_pipeline_datasource_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<unpublished_field_pipeline_datasource_mapping_bool_exp>,
  _not?: ?unpublished_field_pipeline_datasource_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<unpublished_field_pipeline_datasource_mapping_bool_exp>,
  id?: ?Int_comparison_exp,
  pipeline_datasource?: ?pipeline_datasource_bool_exp,
  pipeline_datasource_id?: ?String_comparison_exp,
  unpublished_field?: ?unpublished_field_bool_exp,
  unpublished_field_id?: ?String_comparison_exp,
|};
export type pipeline_datasource_bool_exp = {|
  _and?: ?$ReadOnlyArray<pipeline_datasource_bool_exp>,
  _not?: ?pipeline_datasource_bool_exp,
  _or?: ?$ReadOnlyArray<pipeline_datasource_bool_exp>,
  created?: ?timestamp_comparison_exp,
  field_pipeline_datasource_mappings?: ?field_pipeline_datasource_mapping_bool_exp,
  id?: ?String_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  name?: ?String_comparison_exp,
  self_serve_sources?: ?self_serve_source_bool_exp,
  unpublished_field_pipeline_datasource_mappings?: ?unpublished_field_pipeline_datasource_mapping_bool_exp,
|};
export type field_pipeline_datasource_mapping_bool_exp = {|
  _and?: ?$ReadOnlyArray<field_pipeline_datasource_mapping_bool_exp>,
  _not?: ?field_pipeline_datasource_mapping_bool_exp,
  _or?: ?$ReadOnlyArray<field_pipeline_datasource_mapping_bool_exp>,
  created?: ?timestamp_comparison_exp,
  field?: ?field_bool_exp,
  field_id?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  pipeline_datasource?: ?pipeline_datasource_bool_exp,
  pipeline_datasource_id?: ?String_comparison_exp,
|};
export type self_serve_source_bool_exp = {|
  _and?: ?$ReadOnlyArray<self_serve_source_bool_exp>,
  _not?: ?self_serve_source_bool_exp,
  _or?: ?$ReadOnlyArray<self_serve_source_bool_exp>,
  created?: ?timestamp_comparison_exp,
  data_upload_file_summaries?: ?data_upload_file_summary_bool_exp,
  dataprep_flow?: ?dataprep_flow_bool_exp,
  dataprep_flow_id?: ?Int_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  pipeline_datasource?: ?pipeline_datasource_bool_exp,
  source_id?: ?String_comparison_exp,
|};
export type data_upload_file_summary_bool_exp = {|
  _and?: ?$ReadOnlyArray<data_upload_file_summary_bool_exp>,
  _not?: ?data_upload_file_summary_bool_exp,
  _or?: ?$ReadOnlyArray<data_upload_file_summary_bool_exp>,
  column_mapping?: ?jsonb_comparison_exp,
  created?: ?timestamp_comparison_exp,
  file_path?: ?String_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  self_serve_source?: ?self_serve_source_bool_exp,
  self_serve_source_id?: ?Int_comparison_exp,
  source_id?: ?String_comparison_exp,
  user_file_name?: ?String_comparison_exp,
|};
export type dataprep_flow_bool_exp = {|
  _and?: ?$ReadOnlyArray<dataprep_flow_bool_exp>,
  _not?: ?dataprep_flow_bool_exp,
  _or?: ?$ReadOnlyArray<dataprep_flow_bool_exp>,
  appendable?: ?Boolean_comparison_exp,
  created?: ?timestamp_comparison_exp,
  dataprep_jobs?: ?dataprep_job_bool_exp,
  expected_columns?: ?jsonb_comparison_exp,
  id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  recipe_id?: ?Int_comparison_exp,
  self_serve_sources?: ?self_serve_source_bool_exp,
|};
export type dataprep_job_bool_exp = {|
  _and?: ?$ReadOnlyArray<dataprep_job_bool_exp>,
  _not?: ?dataprep_job_bool_exp,
  _or?: ?$ReadOnlyArray<dataprep_job_bool_exp>,
  created?: ?timestamp_comparison_exp,
  created_on_dataprep?: ?timestamp_comparison_exp,
  dataprep_flow?: ?dataprep_flow_bool_exp,
  dataprep_flow_id?: ?Int_comparison_exp,
  id?: ?Int_comparison_exp,
  job_id?: ?Int_comparison_exp,
  last_modified?: ?timestamp_comparison_exp,
  last_modified_on_dataprep?: ?timestamp_comparison_exp,
  status?: ?String_comparison_exp,
|};
export type visibility_status_enum_comparison_exp = {|
  _eq?: ?any,
  _gt?: ?any,
  _gte?: ?any,
  _in?: ?$ReadOnlyArray<any>,
  _is_null?: ?boolean,
  _lt?: ?any,
  _lte?: ?any,
  _neq?: ?any,
  _nin?: ?$ReadOnlyArray<any>,
|};
export type field_category_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<field_category_mapping_insert_input>,
  on_conflict?: ?field_category_mapping_on_conflict,
|};
export type field_category_mapping_on_conflict = {|
  constraint: field_category_mapping_constraint,
  update_columns: $ReadOnlyArray<field_category_mapping_update_column>,
  where?: ?field_category_mapping_bool_exp,
|};
export type unpublished_field_category_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<unpublished_field_category_mapping_insert_input>,
  on_conflict?: ?unpublished_field_category_mapping_on_conflict,
|};
export type unpublished_field_category_mapping_insert_input = {|
  category?: ?category_obj_rel_insert_input,
  category_id?: ?string,
  id?: ?number,
  unpublished_field?: ?unpublished_field_obj_rel_insert_input,
  unpublished_field_id?: ?string,
|};
export type unpublished_field_obj_rel_insert_input = {|
  data: unpublished_field_insert_input,
  on_conflict?: ?unpublished_field_on_conflict,
|};
export type unpublished_field_insert_input = {|
  calculation?: ?any,
  description?: ?string,
  id?: ?string,
  name?: ?string,
  short_name?: ?string,
  unpublished_field_category_mappings?: ?unpublished_field_category_mapping_arr_rel_insert_input,
  unpublished_field_dimension_mappings?: ?unpublished_field_dimension_mapping_arr_rel_insert_input,
  unpublished_field_pipeline_datasource_mappings?: ?unpublished_field_pipeline_datasource_mapping_arr_rel_insert_input,
|};
export type unpublished_field_dimension_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<unpublished_field_dimension_mapping_insert_input>,
  on_conflict?: ?unpublished_field_dimension_mapping_on_conflict,
|};
export type unpublished_field_dimension_mapping_insert_input = {|
  dimension?: ?dimension_obj_rel_insert_input,
  dimension_id?: ?string,
  id?: ?number,
  unpublished_field?: ?unpublished_field_obj_rel_insert_input,
  unpublished_field_id?: ?string,
|};
export type dimension_obj_rel_insert_input = {|
  data: dimension_insert_input,
  on_conflict?: ?dimension_on_conflict,
|};
export type dimension_insert_input = {|
  authorizable?: ?boolean,
  created?: ?any,
  description?: ?string,
  dimension_category_mappings?: ?dimension_category_mapping_arr_rel_insert_input,
  field_dimension_mappings?: ?field_dimension_mapping_arr_rel_insert_input,
  filterable?: ?boolean,
  geoDimensionMetadataByLatId?: ?geo_dimension_metadata_arr_rel_insert_input,
  geoDimensionMetadataByLonId?: ?geo_dimension_metadata_arr_rel_insert_input,
  geo_dimension_metadata?: ?geo_dimension_metadata_arr_rel_insert_input,
  hierarchicalDimensionMetadataByUniqueIdentifierDimensionId?: ?hierarchical_dimension_metadata_arr_rel_insert_input,
  hierarchical_dimension_metadata?: ?hierarchical_dimension_metadata_arr_rel_insert_input,
  id?: ?string,
  last_modified?: ?any,
  name?: ?string,
  non_hierarchical_dimensions?: ?non_hierarchical_dimension_arr_rel_insert_input,
  unpublished_field_dimension_mappings?: ?unpublished_field_dimension_mapping_arr_rel_insert_input,
|};
export type dimension_category_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<dimension_category_mapping_insert_input>,
  on_conflict?: ?dimension_category_mapping_on_conflict,
|};
export type dimension_category_mapping_insert_input = {|
  category_id?: ?string,
  created?: ?any,
  dimension?: ?dimension_obj_rel_insert_input,
  dimension_category?: ?dimension_category_obj_rel_insert_input,
  dimension_id?: ?string,
  id?: ?number,
  last_modified?: ?any,
|};
export type dimension_category_obj_rel_insert_input = {|
  data: dimension_category_insert_input,
  on_conflict?: ?dimension_category_on_conflict,
|};
export type dimension_category_insert_input = {|
  children?: ?dimension_category_arr_rel_insert_input,
  created?: ?any,
  dimension_category_mappings?: ?dimension_category_mapping_arr_rel_insert_input,
  id?: ?string,
  last_modified?: ?any,
  name?: ?string,
  parent?: ?dimension_category_obj_rel_insert_input,
  parent_id?: ?string,
|};
export type dimension_category_arr_rel_insert_input = {|
  data: $ReadOnlyArray<dimension_category_insert_input>,
  on_conflict?: ?dimension_category_on_conflict,
|};
export type dimension_category_on_conflict = {|
  constraint: dimension_category_constraint,
  update_columns: $ReadOnlyArray<dimension_category_update_column>,
  where?: ?dimension_category_bool_exp,
|};
export type dimension_category_mapping_on_conflict = {|
  constraint: dimension_category_mapping_constraint,
  update_columns: $ReadOnlyArray<dimension_category_mapping_update_column>,
  where?: ?dimension_category_mapping_bool_exp,
|};
export type field_dimension_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<field_dimension_mapping_insert_input>,
  on_conflict?: ?field_dimension_mapping_on_conflict,
|};
export type field_dimension_mapping_insert_input = {|
  created?: ?any,
  dimension?: ?dimension_obj_rel_insert_input,
  dimension_id?: ?string,
  field?: ?field_obj_rel_insert_input,
  field_id?: ?string,
  id?: ?number,
  last_modified?: ?any,
|};
export type field_obj_rel_insert_input = {|
  data: field_insert_input,
  on_conflict?: ?field_on_conflict,
|};
export type field_insert_input = {|
  calculation?: ?any,
  copied_from_field?: ?field_obj_rel_insert_input,
  copied_from_field_id?: ?string,
  created?: ?any,
  description?: ?string,
  field_category_mappings?: ?field_category_mapping_arr_rel_insert_input,
  field_copies?: ?field_arr_rel_insert_input,
  field_dimension_mappings?: ?field_dimension_mapping_arr_rel_insert_input,
  field_pipeline_datasource_mappings?: ?field_pipeline_datasource_mapping_arr_rel_insert_input,
  id?: ?string,
  last_modified?: ?any,
  name?: ?string,
  short_name?: ?string,
|};
export type field_arr_rel_insert_input = {|
  data: $ReadOnlyArray<field_insert_input>,
  on_conflict?: ?field_on_conflict,
|};
export type field_on_conflict = {|
  constraint: field_constraint,
  update_columns: $ReadOnlyArray<field_update_column>,
  where?: ?field_bool_exp,
|};
export type field_pipeline_datasource_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<field_pipeline_datasource_mapping_insert_input>,
  on_conflict?: ?field_pipeline_datasource_mapping_on_conflict,
|};
export type field_pipeline_datasource_mapping_insert_input = {|
  created?: ?any,
  field?: ?field_obj_rel_insert_input,
  field_id?: ?string,
  id?: ?number,
  last_modified?: ?any,
  pipeline_datasource?: ?pipeline_datasource_obj_rel_insert_input,
  pipeline_datasource_id?: ?string,
|};
export type pipeline_datasource_obj_rel_insert_input = {|
  data: pipeline_datasource_insert_input,
  on_conflict?: ?pipeline_datasource_on_conflict,
|};
export type pipeline_datasource_insert_input = {|
  created?: ?any,
  field_pipeline_datasource_mappings?: ?field_pipeline_datasource_mapping_arr_rel_insert_input,
  id?: ?string,
  last_modified?: ?any,
  name?: ?string,
  self_serve_sources?: ?self_serve_source_arr_rel_insert_input,
  unpublished_field_pipeline_datasource_mappings?: ?unpublished_field_pipeline_datasource_mapping_arr_rel_insert_input,
|};
export type self_serve_source_arr_rel_insert_input = {|
  data: $ReadOnlyArray<self_serve_source_insert_input>,
  on_conflict?: ?self_serve_source_on_conflict,
|};
export type self_serve_source_insert_input = {|
  created?: ?any,
  data_upload_file_summaries?: ?data_upload_file_summary_arr_rel_insert_input,
  dataprep_flow?: ?dataprep_flow_obj_rel_insert_input,
  dataprep_flow_id?: ?number,
  id?: ?number,
  last_modified?: ?any,
  pipeline_datasource?: ?pipeline_datasource_obj_rel_insert_input,
  source_id?: ?string,
|};
export type data_upload_file_summary_arr_rel_insert_input = {|
  data: $ReadOnlyArray<data_upload_file_summary_insert_input>,
  on_conflict?: ?data_upload_file_summary_on_conflict,
|};
export type data_upload_file_summary_insert_input = {|
  column_mapping?: ?any,
  created?: ?any,
  file_path?: ?string,
  id?: ?number,
  last_modified?: ?any,
  self_serve_source?: ?self_serve_source_obj_rel_insert_input,
  self_serve_source_id?: ?number,
  source_id?: ?string,
  user_file_name?: ?string,
|};
export type self_serve_source_obj_rel_insert_input = {|
  data: self_serve_source_insert_input,
  on_conflict?: ?self_serve_source_on_conflict,
|};
export type self_serve_source_on_conflict = {|
  constraint: self_serve_source_constraint,
  update_columns: $ReadOnlyArray<self_serve_source_update_column>,
  where?: ?self_serve_source_bool_exp,
|};
export type data_upload_file_summary_on_conflict = {|
  constraint: data_upload_file_summary_constraint,
  update_columns: $ReadOnlyArray<data_upload_file_summary_update_column>,
  where?: ?data_upload_file_summary_bool_exp,
|};
export type dataprep_flow_obj_rel_insert_input = {|
  data: dataprep_flow_insert_input,
  on_conflict?: ?dataprep_flow_on_conflict,
|};
export type dataprep_flow_insert_input = {|
  appendable?: ?boolean,
  created?: ?any,
  dataprep_jobs?: ?dataprep_job_arr_rel_insert_input,
  expected_columns?: ?any,
  id?: ?number,
  last_modified?: ?any,
  recipe_id?: ?number,
  self_serve_sources?: ?self_serve_source_arr_rel_insert_input,
|};
export type dataprep_job_arr_rel_insert_input = {|
  data: $ReadOnlyArray<dataprep_job_insert_input>,
  on_conflict?: ?dataprep_job_on_conflict,
|};
export type dataprep_job_insert_input = {|
  created?: ?any,
  created_on_dataprep?: ?any,
  dataprep_flow?: ?dataprep_flow_obj_rel_insert_input,
  dataprep_flow_id?: ?number,
  id?: ?number,
  job_id?: ?number,
  last_modified?: ?any,
  last_modified_on_dataprep?: ?any,
  status?: ?string,
|};
export type dataprep_job_on_conflict = {|
  constraint: dataprep_job_constraint,
  update_columns: $ReadOnlyArray<dataprep_job_update_column>,
  where?: ?dataprep_job_bool_exp,
|};
export type dataprep_flow_on_conflict = {|
  constraint: dataprep_flow_constraint,
  update_columns: $ReadOnlyArray<dataprep_flow_update_column>,
  where?: ?dataprep_flow_bool_exp,
|};
export type unpublished_field_pipeline_datasource_mapping_arr_rel_insert_input = {|
  data: $ReadOnlyArray<unpublished_field_pipeline_datasource_mapping_insert_input>,
  on_conflict?: ?unpublished_field_pipeline_datasource_mapping_on_conflict,
|};
export type unpublished_field_pipeline_datasource_mapping_insert_input = {|
  id?: ?number,
  pipeline_datasource?: ?pipeline_datasource_obj_rel_insert_input,
  pipeline_datasource_id?: ?string,
  unpublished_field?: ?unpublished_field_obj_rel_insert_input,
  unpublished_field_id?: ?string,
|};
export type unpublished_field_pipeline_datasource_mapping_on_conflict = {|
  constraint: unpublished_field_pipeline_datasource_mapping_constraint,
  update_columns: $ReadOnlyArray<unpublished_field_pipeline_datasource_mapping_update_column>,
  where?: ?unpublished_field_pipeline_datasource_mapping_bool_exp,
|};
export type pipeline_datasource_on_conflict = {|
  constraint: pipeline_datasource_constraint,
  update_columns: $ReadOnlyArray<pipeline_datasource_update_column>,
  where?: ?pipeline_datasource_bool_exp,
|};
export type field_pipeline_datasource_mapping_on_conflict = {|
  constraint: field_pipeline_datasource_mapping_constraint,
  update_columns: $ReadOnlyArray<field_pipeline_datasource_mapping_update_column>,
  where?: ?field_pipeline_datasource_mapping_bool_exp,
|};
export type field_dimension_mapping_on_conflict = {|
  constraint: field_dimension_mapping_constraint,
  update_columns: $ReadOnlyArray<field_dimension_mapping_update_column>,
  where?: ?field_dimension_mapping_bool_exp,
|};
export type geo_dimension_metadata_arr_rel_insert_input = {|
  data: $ReadOnlyArray<geo_dimension_metadata_insert_input>,
  on_conflict?: ?geo_dimension_metadata_on_conflict,
|};
export type geo_dimension_metadata_insert_input = {|
  dimension?: ?dimension_obj_rel_insert_input,
  dimensionByLatId?: ?dimension_obj_rel_insert_input,
  dimensionByLonId?: ?dimension_obj_rel_insert_input,
  id?: ?string,
  lat_id?: ?string,
  lon_id?: ?string,
|};
export type geo_dimension_metadata_on_conflict = {|
  constraint: geo_dimension_metadata_constraint,
  update_columns: $ReadOnlyArray<geo_dimension_metadata_update_column>,
  where?: ?geo_dimension_metadata_bool_exp,
|};
export type hierarchical_dimension_metadata_arr_rel_insert_input = {|
  data: $ReadOnlyArray<hierarchical_dimension_metadata_insert_input>,
  on_conflict?: ?hierarchical_dimension_metadata_on_conflict,
|};
export type hierarchical_dimension_metadata_insert_input = {|
  dimension?: ?dimension_obj_rel_insert_input,
  dimensionByUniqueIdentifierDimensionId?: ?dimension_obj_rel_insert_input,
  dimension_id?: ?string,
  hierarchical_dimension_metadata?: ?hierarchical_dimension_metadata_arr_rel_insert_input,
  hierarchical_dimension_metadatum?: ?hierarchical_dimension_metadata_obj_rel_insert_input,
  id?: ?number,
  parent_id?: ?number,
  unique_identifier_dimension_id?: ?string,
|};
export type hierarchical_dimension_metadata_obj_rel_insert_input = {|
  data: hierarchical_dimension_metadata_insert_input,
  on_conflict?: ?hierarchical_dimension_metadata_on_conflict,
|};
export type hierarchical_dimension_metadata_on_conflict = {|
  constraint: hierarchical_dimension_metadata_constraint,
  update_columns: $ReadOnlyArray<hierarchical_dimension_metadata_update_column>,
  where?: ?hierarchical_dimension_metadata_bool_exp,
|};
export type non_hierarchical_dimension_arr_rel_insert_input = {|
  data: $ReadOnlyArray<non_hierarchical_dimension_insert_input>,
  on_conflict?: ?non_hierarchical_dimension_on_conflict,
|};
export type non_hierarchical_dimension_insert_input = {|
  dimension?: ?dimension_obj_rel_insert_input,
  id?: ?string,
|};
export type non_hierarchical_dimension_on_conflict = {|
  constraint: non_hierarchical_dimension_constraint,
  update_columns: $ReadOnlyArray<non_hierarchical_dimension_update_column>,
  where?: ?non_hierarchical_dimension_bool_exp,
|};
export type dimension_on_conflict = {|
  constraint: dimension_constraint,
  update_columns: $ReadOnlyArray<dimension_update_column>,
  where?: ?dimension_bool_exp,
|};
export type unpublished_field_dimension_mapping_on_conflict = {|
  constraint: unpublished_field_dimension_mapping_constraint,
  update_columns: $ReadOnlyArray<unpublished_field_dimension_mapping_update_column>,
  where?: ?unpublished_field_dimension_mapping_bool_exp,
|};
export type unpublished_field_on_conflict = {|
  constraint: unpublished_field_constraint,
  update_columns: $ReadOnlyArray<unpublished_field_update_column>,
  where?: ?unpublished_field_bool_exp,
|};
export type unpublished_field_category_mapping_on_conflict = {|
  constraint: unpublished_field_category_mapping_constraint,
  update_columns: $ReadOnlyArray<unpublished_field_category_mapping_update_column>,
  where?: ?unpublished_field_category_mapping_bool_exp,
|};
export type CreateCalculationIndicatorViewMutationVariables = {|
  id: string,
  name: string,
  shortName: string,
  description: string,
  calculation: any,
  categoryObj: $ReadOnlyArray<field_category_mapping_insert_input>,
  isCopy: boolean,
  isNotCopy: boolean,
  copiedFromFieldId: string,
|};
export type CreateCalculationIndicatorViewMutationResponse = {|
  +insert_field?: ?{|
    +returning: $ReadOnlyArray<{|
      +id: string,
      +name: string,
      +description: ?string,
      +calculation: any,
      +field_category_mappings: $ReadOnlyArray<{|
        +$fragmentRefs: ParentCategoryChange_fieldCategoryMapping$ref
      |}>,
      +field_dimension_mappings: $ReadOnlyArray<{|
        +id: string
      |}>,
      +short_name: string,
      +copied_from_field_id: ?string,
      +$fragmentRefs: FieldRow_field$ref,
    |}>
  |}
|};
export type CreateCalculationIndicatorViewMutation = {|
  variables: CreateCalculationIndicatorViewMutationVariables,
  response: CreateCalculationIndicatorViewMutationResponse,
|};
*/


/*
mutation CreateCalculationIndicatorViewMutation(
  $id: String!
  $name: String!
  $shortName: String!
  $description: String!
  $calculation: jsonb!
  $categoryObj: [field_category_mapping_insert_input!]!
  $isCopy: Boolean!
  $isNotCopy: Boolean!
  $copiedFromFieldId: String!
) {
  insert_field(objects: [{calculation: $calculation, description: $description, id: $id, name: $name, short_name: $shortName, field_category_mappings: {data: $categoryObj}}]) @include(if: $isNotCopy) {
    returning {
      id
      name
      description
      calculation
      field_category_mappings {
        ...ParentCategoryChange_fieldCategoryMapping
        id
      }
      field_dimension_mappings {
        id
      }
      short_name
      ...FieldRow_field
    }
  }
  insert_field(objects: [{calculation: $calculation, description: $description, id: $id, name: $name, short_name: $shortName, field_category_mappings: {data: $categoryObj}, copied_from_field_id: $copiedFromFieldId}]) @include(if: $isCopy) {
    returning {
      id
      name
      description
      calculation
      field_category_mappings {
        ...ParentCategoryChange_fieldCategoryMapping
        id
      }
      field_dimension_mappings {
        id
      }
      short_name
      copied_from_field_id
      ...FieldRow_field
    }
  }
}

fragment FieldRow_field on field {
  id
  description
  name
  copiedFromFieldId: copied_from_field_id
  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
    pipelineDatasource: pipeline_datasource {
      id
      name
    }
    id
  }
  ...useFieldCalculation_field
}

fragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {
  field {
    id
    field_category_mappings {
      category {
        id
      }
      visibilityStatus: visibility_status
      id
    }
  }
  category {
    field_category_mappings {
      field {
        id
      }
      id
    }
    ...useCategoryContentCount_category
    id
  }
}

fragment useCategoryContentCount_category on category {
  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {
    aggregate {
      count
    }
  }
  childrenCategoryAggregate: children_aggregate {
    aggregate {
      count
    }
  }
}

fragment useFieldCalculation_field on field {
  serializedCalculation: calculation
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "calculation"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "categoryObj"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "copiedFromFieldId"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "description"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "isCopy"
},
v6 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "isNotCopy"
},
v7 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "name"
},
v8 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "shortName"
},
v9 = {
  "kind": "Variable",
  "name": "calculation",
  "variableName": "calculation"
},
v10 = {
  "kind": "Variable",
  "name": "description",
  "variableName": "description"
},
v11 = {
  "fields": [
    {
      "kind": "Variable",
      "name": "data",
      "variableName": "categoryObj"
    }
  ],
  "kind": "ObjectValue",
  "name": "field_category_mappings"
},
v12 = {
  "kind": "Variable",
  "name": "id",
  "variableName": "id"
},
v13 = {
  "kind": "Variable",
  "name": "name",
  "variableName": "name"
},
v14 = {
  "kind": "Variable",
  "name": "short_name",
  "variableName": "shortName"
},
v15 = [
  {
    "items": [
      {
        "fields": [
          (v9/*: any*/),
          (v10/*: any*/),
          (v11/*: any*/),
          (v12/*: any*/),
          (v13/*: any*/),
          (v14/*: any*/)
        ],
        "kind": "ObjectValue",
        "name": "objects.0"
      }
    ],
    "kind": "ListValue",
    "name": "objects"
  }
],
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "calculation",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "concreteType": "field_category_mapping",
  "kind": "LinkedField",
  "name": "field_category_mappings",
  "plural": true,
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ParentCategoryChange_fieldCategoryMapping"
    }
  ],
  "storageKey": null
},
v21 = [
  (v16/*: any*/)
],
v22 = {
  "alias": null,
  "args": null,
  "concreteType": "field_dimension_mapping",
  "kind": "LinkedField",
  "name": "field_dimension_mappings",
  "plural": true,
  "selections": (v21/*: any*/),
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "short_name",
  "storageKey": null
},
v24 = {
  "args": null,
  "kind": "FragmentSpread",
  "name": "FieldRow_field"
},
v25 = [
  {
    "items": [
      {
        "fields": [
          (v9/*: any*/),
          {
            "kind": "Variable",
            "name": "copied_from_field_id",
            "variableName": "copiedFromFieldId"
          },
          (v10/*: any*/),
          (v11/*: any*/),
          (v12/*: any*/),
          (v13/*: any*/),
          (v14/*: any*/)
        ],
        "kind": "ObjectValue",
        "name": "objects.0"
      }
    ],
    "kind": "ListValue",
    "name": "objects"
  }
],
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "copied_from_field_id",
  "storageKey": null
},
v27 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
],
v28 = {
  "alias": null,
  "args": null,
  "concreteType": "field_category_mapping",
  "kind": "LinkedField",
  "name": "field_category_mappings",
  "plural": true,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "field",
      "kind": "LinkedField",
      "name": "field",
      "plural": false,
      "selections": [
        (v16/*: any*/),
        {
          "alias": null,
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
              "selections": (v21/*: any*/),
              "storageKey": null
            },
            {
              "alias": "visibilityStatus",
              "args": null,
              "kind": "ScalarField",
              "name": "visibility_status",
              "storageKey": null
            },
            (v16/*: any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "category",
      "kind": "LinkedField",
      "name": "category",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "field_category_mapping",
          "kind": "LinkedField",
          "name": "field_category_mappings",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "field",
              "kind": "LinkedField",
              "name": "field",
              "plural": false,
              "selections": (v21/*: any*/),
              "storageKey": null
            },
            (v16/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": "fieldCategoryMappingsAggregate",
          "args": null,
          "concreteType": "field_category_mapping_aggregate",
          "kind": "LinkedField",
          "name": "field_category_mappings_aggregate",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "field_category_mapping_aggregate_fields",
              "kind": "LinkedField",
              "name": "aggregate",
              "plural": false,
              "selections": (v27/*: any*/),
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": "childrenCategoryAggregate",
          "args": null,
          "concreteType": "category_aggregate",
          "kind": "LinkedField",
          "name": "children_aggregate",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "category_aggregate_fields",
              "kind": "LinkedField",
              "name": "aggregate",
              "plural": false,
              "selections": (v27/*: any*/),
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        (v16/*: any*/)
      ],
      "storageKey": null
    },
    (v16/*: any*/)
  ],
  "storageKey": null
},
v29 = {
  "alias": "copiedFromFieldId",
  "args": null,
  "kind": "ScalarField",
  "name": "copied_from_field_id",
  "storageKey": null
},
v30 = {
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
      "selections": [
        (v16/*: any*/),
        (v17/*: any*/)
      ],
      "storageKey": null
    },
    (v16/*: any*/)
  ],
  "storageKey": null
},
v31 = {
  "alias": "serializedCalculation",
  "args": null,
  "kind": "ScalarField",
  "name": "calculation",
  "storageKey": null
},
v32 = {
  "alias": null,
  "args": null,
  "filters": null,
  "handle": "appendNode",
  "key": "",
  "kind": "LinkedHandle",
  "name": "returning",
  "handleArgs": [
    {
      "kind": "Literal",
      "name": "connections",
      "value": [
        "client:root:field_connection"
      ]
    },
    {
      "kind": "Literal",
      "name": "edgeTypeName",
      "value": "fieldEdge"
    }
  ]
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v8/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CreateCalculationIndicatorViewMutation",
    "selections": [
      {
        "condition": "isNotCopy",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v15/*: any*/),
            "concreteType": "field_mutation_response",
            "kind": "LinkedField",
            "name": "insert_field",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": [
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  (v22/*: any*/),
                  (v23/*: any*/),
                  (v24/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ]
      },
      {
        "condition": "isCopy",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v25/*: any*/),
            "concreteType": "field_mutation_response",
            "kind": "LinkedField",
            "name": "insert_field",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": [
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  (v22/*: any*/),
                  (v23/*: any*/),
                  (v26/*: any*/),
                  (v24/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ]
      }
    ],
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v4/*: any*/),
      (v7/*: any*/),
      (v8/*: any*/),
      (v3/*: any*/),
      (v0/*: any*/),
      (v1/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Operation",
    "name": "CreateCalculationIndicatorViewMutation",
    "selections": [
      {
        "condition": "isNotCopy",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v15/*: any*/),
            "concreteType": "field_mutation_response",
            "kind": "LinkedField",
            "name": "insert_field",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": [
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v28/*: any*/),
                  (v22/*: any*/),
                  (v23/*: any*/),
                  (v29/*: any*/),
                  (v30/*: any*/),
                  (v31/*: any*/)
                ],
                "storageKey": null
              },
              (v32/*: any*/)
            ],
            "storageKey": null
          }
        ]
      },
      {
        "condition": "isCopy",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v25/*: any*/),
            "concreteType": "field_mutation_response",
            "kind": "LinkedField",
            "name": "insert_field",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": [
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v28/*: any*/),
                  (v22/*: any*/),
                  (v23/*: any*/),
                  (v26/*: any*/),
                  (v29/*: any*/),
                  (v30/*: any*/),
                  (v31/*: any*/)
                ],
                "storageKey": null
              },
              (v32/*: any*/)
            ],
            "storageKey": null
          }
        ]
      }
    ]
  },
  "params": {
    "cacheID": "a05d592b251f358b0651ec5f6fa2227f",
    "id": null,
    "metadata": {},
    "name": "CreateCalculationIndicatorViewMutation",
    "operationKind": "mutation",
    "text": "mutation CreateCalculationIndicatorViewMutation(\n  $id: String!\n  $name: String!\n  $shortName: String!\n  $description: String!\n  $calculation: jsonb!\n  $categoryObj: [field_category_mapping_insert_input!]!\n  $isCopy: Boolean!\n  $isNotCopy: Boolean!\n  $copiedFromFieldId: String!\n) {\n  insert_field(objects: [{calculation: $calculation, description: $description, id: $id, name: $name, short_name: $shortName, field_category_mappings: {data: $categoryObj}}]) @include(if: $isNotCopy) {\n    returning {\n      id\n      name\n      description\n      calculation\n      field_category_mappings {\n        ...ParentCategoryChange_fieldCategoryMapping\n        id\n      }\n      field_dimension_mappings {\n        id\n      }\n      short_name\n      ...FieldRow_field\n    }\n  }\n  insert_field(objects: [{calculation: $calculation, description: $description, id: $id, name: $name, short_name: $shortName, field_category_mappings: {data: $categoryObj}, copied_from_field_id: $copiedFromFieldId}]) @include(if: $isCopy) {\n    returning {\n      id\n      name\n      description\n      calculation\n      field_category_mappings {\n        ...ParentCategoryChange_fieldCategoryMapping\n        id\n      }\n      field_dimension_mappings {\n        id\n      }\n      short_name\n      copied_from_field_id\n      ...FieldRow_field\n    }\n  }\n}\n\nfragment FieldRow_field on field {\n  id\n  description\n  name\n  copiedFromFieldId: copied_from_field_id\n  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n    pipelineDatasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n  ...useFieldCalculation_field\n}\n\nfragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {\n  field {\n    id\n    field_category_mappings {\n      category {\n        id\n      }\n      visibilityStatus: visibility_status\n      id\n    }\n  }\n  category {\n    field_category_mappings {\n      field {\n        id\n      }\n      id\n    }\n    ...useCategoryContentCount_category\n    id\n  }\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c47f1fa5120c605c4cc73b71a8f94afd';

export default node;
