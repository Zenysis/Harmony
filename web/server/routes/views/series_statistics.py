import numpy as np


def fill_stats(field_stats, field_to_values):
    for field, field_values in list(field_to_values.items()):
        field_stats['mean'][field] = np.mean(field_values)
        field_stats['median'][field] = np.median(field_values)
        field_stats['first_quartile'][field] = np.percentile(field_values, 25)
        field_stats['third_quartile'][field] = np.percentile(field_values, 75)
        field_stats['variance'][field] = np.var(field_values)
        field_stats['std'][field] = np.std(field_values)

        field_stats['min'][field] = np.amin(field_values)
        field_stats['max'][field] = np.amax(field_values)

        field_stats['totals'][field] = np.sum(field_values)
        field_stats['num_nonzero'][field] = np.count_nonzero(field_values)
    return field_stats
