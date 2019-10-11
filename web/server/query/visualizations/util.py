import numpy as np
import pandas as pd


def join_str_columns(df, columns, sep=', '):
    '''Return a Series with the specified columns joined by the separator.'''
    if len(columns) == 1:
        return df[columns[0]].fillna('null')

    # NOTE(stephen): The na_rep value of an empty string might produce a weird
    # result with multiple `sep` in a row. This could look weird on the
    # frontend.
    return df[columns[0]].str.cat(df[columns[1:]], sep=sep, na_rep='null')


def build_key_column(
    orig_df, column_name, grouping_dimensions, label_dimensions=None, sep=', '
):
    '''Create a unique column that is unique for the queried set of dimensions.

    If label dimensions are specified, try to build the unique key using just
    those dimensions. For rows where the label dimensions result in duplicates,
    include all grouping dimensions in the key name to ensure the uniqueness.'''

    # Sort the dataframe so that keyws are set deterministically.  Otherwise
    # you're going to run into CRAZY bugs where sequential calls to
    # build_key_column construct keys inconsistently, and the frontend will
    # break because the response references keys that don't exist in other
    # parts of the response.
    # TODO(ian): Remove this once it becomes impossible to set incomplete label
    # dimensions (ie, once everything is on AQT)
    df = orig_df.sort_values(by=grouping_dimensions)

    # Get the unique dimension columns grouped by in the query.
    # NOTE(stephen): Dropping duplicates since the query might have had a
    # granularity different than "all".
    label_df = df[grouping_dimensions].drop_duplicates()

    # If no label dimensions are specified, use the grouping dimensions.
    label_dimensions = label_dimensions or grouping_dimensions
    label_df[column_name] = join_str_columns(df, label_dimensions, sep)

    # Find instances where the key is not unique. Includes all occurrences of the
    # duplicate key, including the first instance.
    duplicate_labels_df = label_df[label_df[column_name].duplicated(keep=False)]

    if not duplicate_labels_df.empty:
        # For the non-unique labels, attach additional grouped dimensions to
        # make the key unique. The template is:
        # label_dim_1, label_dim_2, ... (group_dim_1, group_dim_2, ...)
        extra_columns = [d for d in grouping_dimensions if d not in label_dimensions]
        label_df.loc[duplicate_labels_df.index, column_name] = (
            duplicate_labels_df['key']
            + ' ('
            + join_str_columns(duplicate_labels_df, extra_columns, sep)
            + ')'
        )

    # Use the grouping dimensions as the index so that the key column can be
    # easily joined to the result dataframe.
    label_df.set_index(grouping_dimensions, inplace=True)
    return label_df


# HACK(stephen): This is a really dirty workaround for NaN, Infinity,
# -Infinity. Since Flask's jsonify passes those values as valid JSON, we must
# remove them before serialization. Right now, there is no central way to do
# this at the flask level, so we are doing it here. This is really dirty because
# it converts the column from a float to an object.
def clean_df_for_json_export(df):
    if df is not None and not df.empty:
        df = df.replace((np.inf, -np.inf), np.nan)
        return df.where(pd.notnull(df), None)
    return df
