from builtins import range
import pandas as pd

import numpy as np
from scipy.signal import savgol_filter


def moving_average(interval, window_size, center=True):
    '''Calculate the moving average of the interval for the window size.
    Inputs are:
        interval: list or array of values.
        window_size: size of the sliding window.
        center = True/False: If true place the window about the center of the window_size.
    Output: Array of moving averages, having the same size as the input array.'''
    # Odd window size required for computing moving average about the center.
    if window_size % 2 == 0:
        window_size += 1
        print(
            f'window size must be an odd number. setting window size to {window_size}'
        )
    window = np.ones(window_size) / window_size

    if center:
        ma_array = np.convolve(interval, window, 'same')
        # The convolve function will pad with 0 at the edges.
        # The following code will undo the division by window size and
        # and divide again by the real truncated window size.
        for i, real_window in enumerate(range(int((window_size + 1) / 2), window_size)):
            ma_array[i] = ma_array[i] * window_size / real_window
            ma_array[-1 - i] = ma_array[-1 - i] * window_size / real_window
        return ma_array
    else:
        # Moving average from the left.
        ma_array = np.convolve(interval, window)
        # Patch up the edge from the left. Multiply back the window size and divide by the
        # truncated window size of (i + 1)
        for i in range(window_size - 1):
            ma_array[i] = (ma_array[i] * window_size) / (i + 1)
        return ma_array[: -(window_size - 1)]


def add_savgol_filter(
    dataframe, groups, val_column, window_size=3, power=2, neg_val=0.01
):
    '''Given a dataframe, groups and a value_column compute the Savgol filter for the values.
    Example:
        If each time series is referenced by by an Indicator_id, region, zone, woreda then
        set groups = ['RegionName', 'ZoneName','WoredaName', 'Indicator_id'].
        If the values to be imputed are called 'vals' then set val_column = 'vals'.
    Output:
        Returns the original dataframe with a new column with the filtered values called 'sg_val'.
    SG parameters:
        window_size: window size used by the Savitzky-Golay filter.
        power: Polynomial order of the Savitzky-Golay filter.
        neg_vals: value to reurn if the output of the filter is negative.
    TODO: Generalize handeling of negative valus, sometimes they are ok.
    '''
    dataframes = []
    # Select each time series one by one, by grouping and itterating.
    for group in dataframe.groupby(groups):
        values = group[1][val_column].values
        indicies = group[1][val_column].index

        sg_vals = savgol_filter(values[:-1], window_size, power)
        sg_vals = np.append(sg_vals, np.mean(values[-3:-1]))
        dataframes.append(pd.DataFrame(sg_vals, index=indicies, columns=['sg_val']))

    # Concat all of the sg vals into a single column and merge on the indicies.
    dataframe_sg = pd.concat(dataframes)
    dataframe_sg['sg_val'][dataframe_sg['sg_val'] < 0] = neg_val
    return pd.merge(dataframe_sg, dataframe, left_index=True, right_index=True)


def create_moving_average(
    dataframe, groups, val_column, window_size=3, neg_val=0.01, center=True
):
    '''Create a column that contains the moving average of the indicator value
    by geo.'''
    dataframes = []
    for group in dataframe.groupby(groups):
        values, indicies = group[1][val_column].values, group[1][val_column].index
        ma = moving_average(values, window_size, center=center)
        dataframes.append(pd.DataFrame(ma, index=indicies, columns=['ma_val']))
    dataframe_moving_avg = pd.concat(dataframes)
    dataframe_moving_avg['ma_val'][dataframe_moving_avg['ma_val'] < 0] = neg_val
    return pd.merge(dataframe_moving_avg, dataframe, left_index=True, right_index=True)
