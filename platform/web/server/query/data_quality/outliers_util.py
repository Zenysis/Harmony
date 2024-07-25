# mypy: disallow_untyped_defs=True
import pandas as pd

# column names for outlier dataframe
EXTREME_LOWER_BOUND = 'extreme_lower_bound'
EXTREME_UPPER_BOUND = 'extreme_upper_bound'
OUTLIER_LOWER_BOUND = 'outlier_lower_bound'
OUTLIER_UPPER_BOUND = 'outlier_upper_bound'


def build_outlier_df(
    df: pd.DataFrame,
    field_id: str,
    include_moderate: bool,
    include_extreme: bool,
    include_all: bool,
) -> pd.DataFrame:
    # We only care about real reports so we filter out any null values
    filtered_df = df[df[field_id].notnull()]

    # if key not in df, just return the filtered df
    if 'key' not in filtered_df:
        return filtered_df

    # We have filtered out all the non-numeric values from the field column. Tell pandas
    # that we have a more specific type than `object` which can sometimes occur.
    group_df = filtered_df.astype({field_id: 'float'}).groupby('key')[field_id]

    # NOTE: When calculating a standard deviation for a single value,
    # pandas returns NaN. We replace these values with 0.
    std_series = group_df.std().fillna(0)
    mean_series = group_df.mean()

    # Build a dataframe mapping `key` to all outlier bounds columns.
    # NOTE: Using the `std_series` as the base just so we can get a
    # dataframe with the correct shape. This allows us to set new columns
    # instead of using `.join`, simplifying the logic.
    outlier_df = std_series.rename('std_dev').to_frame()
    if include_moderate or include_all:
        outlier_df[OUTLIER_LOWER_BOUND] = mean_series - 2 * std_series
        outlier_df[OUTLIER_UPPER_BOUND] = mean_series + 2 * std_series
    if include_moderate or include_extreme:
        outlier_df[EXTREME_LOWER_BOUND] = mean_series - 3 * std_series
        outlier_df[EXTREME_UPPER_BOUND] = mean_series + 3 * std_series

    # Merge the summarized outlier data (grouped by `key`) into the original
    # dataframe (grouped by `key` and `timestamp`).
    outlier_df = filtered_df.join(outlier_df, on=['key'])

    # Add columns to the dataframe with the number of each type of outlier
    if include_moderate:
        outlier_df['moderate_outliers'] = (
            (outlier_df[field_id] < outlier_df[OUTLIER_LOWER_BOUND])
            & (outlier_df[field_id] >= outlier_df[EXTREME_LOWER_BOUND])
        ) | (
            (outlier_df[field_id] > outlier_df[OUTLIER_UPPER_BOUND])
            & (outlier_df[field_id] <= outlier_df[EXTREME_UPPER_BOUND])
        )

    if include_extreme:
        outlier_df['extreme_outliers'] = (
            outlier_df[field_id] < outlier_df[EXTREME_LOWER_BOUND]
        ) | (outlier_df[field_id] > outlier_df[EXTREME_UPPER_BOUND])

    if include_all:
        outlier_df['outliers'] = (
            outlier_df[field_id] < outlier_df[OUTLIER_LOWER_BOUND]
        ) | (outlier_df[field_id] > outlier_df[OUTLIER_UPPER_BOUND])

    return outlier_df
