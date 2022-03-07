#!/usr/bin/env python
'''Convert a line-list into a csv with two fields:
1. a counts field that stores the number of cases per day
2. a cumulative field that stores the cumulative number of cases per day

The input csv must be of the following format (column headers in any order):
    ------------------------------------------------------------------------------------
    | date | dimension_1 | ... | dimension_n | val (optional) | field (optional) | ... |
    ------------------------------------------------------------------------------------

- There should be one date column
- There can be as many dimension columns as you want
- You can have a 'val' column to store the value of this row. Otherwise, by
    default we will count each row with a value of 1.
- If your linelist has a 'field' column it will be ignored, but if you want to only
    aggregate rows whose 'field' equals some value, this can be set in the
    `field_to_aggregate` argument.
- All other columns will be ignored for our output

The output CSV is in a format that is ready to be processed by a process_csv step:
    --------------------------------------------------------
    | date | dimension_1 | ... | dimension_n | field | val |
    --------------------------------------------------------

Where 'field' can only be one of two values: the `count_field` or the
`cumulative_field` arguments passed into the script.

NOTE(pablo): at the moment, this script can only aggregate counts daily. This
script will need to be updated to support other time granularities (such as
weekly or monthly).

Args:
    input_file: the linelist csv file
    output_file: the output csv file
    dimension_class: (optional) the Dimension class to load, for example:
        'config.mz.datatypes.Dimension'
    count_field: (optional) the field name to store the counts of each case. If none
        is provided then no counts will be generated per day.
    cumulative_field: (optional) the field name to store the cumulative counts of each case.
        If none is provided then no cumulative counts will be generated per day.
    dimensions: (optional) the list of dimensions to collect. By default this
        script will pull all column names from the csv that match a dimension
        in `DimensionClass`. You can override this behavior by passing in your
        own list of dimensions here. If your input CSV's columns don't match
        the dimension names exactly, you can use a mapping string instead, e.g.:
            'DistrictName:csv_district' 'ProvinceName:col_province'
        In these examples, 'csv_district' and 'col_province' are column names
        that map to 'DistrictName' and 'ProvinceName' dimensions respectively.
    date_column: (optional) the column name for the date column. Defaults to 'date'
    val_column: (optional) the val column name to pull counts. Defaults to 'val'.
        If the val column is not present (which is normal for linelists), we
        assume that every row counts as a '1'
    field_column: (optional) the column name for the input CSV's field column.
        Defaults to 'field', but is only used if `field_to_aggregate` is set.
    field_to_aggregate: (optional) if set, we only aggregate rows whose `field`
        value is equal to `field_to_aggregate`. Some linelists come in with
        several fields in one CSV (e.g. cholera, malaria, measles), but if we only
        wanted to aggregate cholera, we'd set `field_to_aggregate="cholera"`, and
        all other rows would be ignored.

Returns:
    A csv stored in `output_file` that is ready to be processed by a process_csv
    step. It contains values for two fields: the `count_field` and the
    `cumulative_field`.
'''
import sys
import importlib
from datetime import datetime, timedelta
from pylib.base.flags import Flags
from log import LOG
from util.file.unicode_csv import UnicodeDictReader, UnicodeDictWriter
from config.system import STANDARD_DATA_DATE_FORMAT
from config.zen.datatypes import Dimension


def _get_dates_between_ranges(start_date, end_date):
    '''Get all dates (inclusive) between two dates.
    Args:
        start_date: either a string or datetime object.
            If a string, must be in '%Y-%m-%d' format.
        end_date: either a string or datetime object
            If a string, must be in '%Y-%m-%d' format.

    Returns:
        A list of datetime objects.
    '''
    start = start_date
    end = end_date
    if isinstance(start, str):
        start = datetime.strptime(start, '%Y-%m-%d')
    if isinstance(end, str):
        end = datetime.strptime(end, '%Y-%m-%d')
    dates = []
    curr_date = start
    for _ in range(int((end - start).days) + 1):
        dates.append(curr_date)
        curr_date += timedelta(1)
    return dates


class DimensionNode:
    def __init__(self, dimension_id=None, dimension_value=None):
        self.children = []
        self.children_dict = {}
        self.dimension_id = dimension_id
        self.dimension_value = dimension_value
        self.parent_dimensions = []

        # these should only be used if the node is a leaf node. Only
        # the leaf nodes should store information about the counts per date.
        self.is_leaf = True
        self.counts = {}
        self.first_date = None

    def has_dimension(self, dimension_val):
        return dimension_val in self.children_dict

    def get_child(self, dim_val):
        return self.children_dict[dim_val]

    def add_child(self, child_node):
        self.is_leaf = False
        self.children.append(child_node)
        self.children_dict[child_node.dimension_value] = child_node

        # make the child point store references to the parent dimensions, unless
        # the current dimension is None
        if self.dimension_id is not None:
            child_node.parent_dimensions = self.parent_dimensions + [
                (self.dimension_id, self.dimension_value)
            ]

    def add_count(self, date_str, count):
        self.is_leaf = True
        if self.first_date is None or date_str < self.first_date:
            self.first_date = date_str
        if date_str in self.counts:
            self.counts[date_str] += count
        else:
            self.counts[date_str] = count

    def generate_count_rows(self, last_date, count_field=None, cumulative_field=None):
        '''Take the counts per date in this node and convert it into rows
        representing the counts of cases per date, and the cumulative counts.

        If either count_field or cumulative_field is None, it means we should ignore
        adding rows for those fields.
        '''
        if not self.is_leaf:
            raise Exception('Can only call `generate_count_rows` on a leaf node')

        # get the dimensions leading to this node, including this node's dimensions
        dimension_path = self.parent_dimensions
        if self.dimension_id and self.dimension_value:
            dimension_path += [(self.dimension_id, self.dimension_value)]

        output_count_rows = []
        output_cumulative_rows = []
        dates = _get_dates_between_ranges(self.first_date, last_date)
        date_strs = [datetime.strftime(d, STANDARD_DATA_DATE_FORMAT) for d in dates]
        curr_count = 0
        for date_str in date_strs:
            if date_str in self.counts:
                curr_count += self.counts[date_str]

                if count_field is not None:
                    count_row = {
                        'date': date_str,
                        'field': count_field,
                        'val': self.counts[date_str],
                    }
                    # attach dimension info
                    for (dim_id, dim_val) in dimension_path:
                        count_row[dim_id] = dim_val
                    output_count_rows.append(count_row)

            if cumulative_field is not None:
                cumulative_row = {
                    'date': date_str,
                    'field': cumulative_field,
                    'val': curr_count,
                }
                # attach dimension info
                for (dim_id, dim_val) in dimension_path:
                    cumulative_row[dim_id] = dim_val
                output_cumulative_rows.append(cumulative_row)

        return (output_count_rows, output_cumulative_rows)


def convert_linelist_to_count_rows(
    rows,
    count_field=None,
    cumulative_field=None,
    dimensions=None,
    date_key='date',
    val_key='val',
    field_key='field',
    field_to_aggregate=None,
):
    '''Convert rows representing a line-list into two sets of output rows that
    represent the case counts.

    NOTE(pablo): at the moment, this script can only aggregate counts daily. This
    script will need to be updated to support other time granularities (such as
    weekly or monthly).

    Args:
        rows: a list of dicts representing the linelist
        count_field: (optional) the field name to store the counts of each case.
            If None, we skip creating rows for this field.
        cumulative_field: (optional) the field name to store the cumulative
            counts of each case.  If None, we skip creating rows for this field.
        dimensions: (optional) the list of dimensions to collect. Each dimension
            is either a string, or a tuple of (dimension_id, colname) where
            `colname` is used to extract the dimension value from the row
        date_key: (optional) the key used to extract the date from the row.
            Defaults to 'date'
        val_key: (optional) the key used to extract the value from a row (if it
            is available). Defaults to 'val', and if the row has no value then we
            default to counting it as a 1
        field_key: (optional) the key used to extract the field from the row.
            Defaults to 'field', but is only used if `field_to_aggregate` is set.
        field_to_aggregate: (optional) if set, we only aggregate rows whose `field`
            value is equal to `field_to_aggregate`.

    Returns:
        A tuple of rows ready to be ingested by our `process_csv` script:
            (count_rows, cumulative_count_rows)
        count_rows: how many cases occurred per day
        cumulative_count_rows: cumulative counts of cases per day
    '''
    root = DimensionNode()

    last_date = None
    for row in rows:
        # skip this row if `field_to_aggregate` is set, and either the
        # `field_key` doesn't exist, or it does not match `field_to_aggregate`
        if field_to_aggregate and (
            field_key not in row or row[field_key] != field_to_aggregate
        ):
            continue

        date_str = row[date_key]
        curr_node = root

        # build out the node tree down to the last dimension, or traverse
        # the nodes if they've already been built
        if dimensions and dimensions != []:
            for dimension in dimensions:
                dim_id = dimension if isinstance(dimension, str) else dimension[0]
                colname = dim_id if isinstance(dimension, str) else dimension[1]
                dim_val = row[colname]

                if not curr_node.has_dimension(dim_val):
                    new_node = DimensionNode(dim_id, dim_val)
                    curr_node.add_child(new_node)

                curr_node = curr_node.get_child(dim_val)

        # now that we're at the last node, let's add this date to
        # the node's counts
        curr_node.add_count(date_str, int(row[val_key]) if val_key in row else 1)

        # track the global last date
        if last_date is None or date_str > last_date:
            last_date = date_str

    # create the process_csv rows for counts and cumulative counts
    output_count_rows = []
    output_cumulative_rows = []

    # traverse depth-first
    nodes = [root]
    while nodes != []:
        curr_node = nodes.pop()
        if curr_node.is_leaf:
            (count_rows, cumulative_count_rows) = curr_node.generate_count_rows(
                last_date, count_field, cumulative_field
            )
            output_count_rows.extend(count_rows)
            output_cumulative_rows.extend(cumulative_count_rows)
        else:
            nodes.extend(curr_node.children)

    return (output_count_rows, output_cumulative_rows)


def main():
    Flags.PARSER.add_argument(
        '--input_file', type=str, required=True, help='Input linelist csv file'
    )
    Flags.PARSER.add_argument(
        '--output_file',
        type=str,
        required=True,
        help='Output csv file to store results in.',
    )
    Flags.PARSER.add_argument(
        '--dimension_class',
        type=str,
        required=False,
        help="(Optional) The Dimension class to load. E.g. 'config.mz.datatypes.Dimension'",
    )
    Flags.PARSER.add_argument(
        '--count_field',
        type=str,
        required=False,
        help='(Optional) The field name to store the counts. If none is provided, counts will not be generated per day.',
    )
    Flags.PARSER.add_argument(
        '--cumulative_field',
        type=str,
        required=False,
        help='(Optional) The field name to store the cumulative counts. If none is provided, cumulative counts will not be generated per day.',
    )
    Flags.PARSER.add_argument(
        '--dimensions',
        type=str,
        nargs='*',
        required=False,
        help="(Optional) The dimensions to process. By default this script will pull all column names that match a dimension in datatypes.py. You can override that behavior by passing your own list of dimensions here. For columns that don't match dimension names exactly, you can use a mapping string instead, e.g: 'DistrictName:csv_district' 'ProvinceName:col_province'",
    )
    Flags.PARSER.add_argument(
        '--date_column',
        type=str,
        required=False,
        help="(Optional) The date column in the csv. Defaults to 'date' if none provided",
    )
    Flags.PARSER.add_argument(
        '--val_column',
        type=str,
        required=False,
        help="(Optional) The val column name to pull counts. By default each row represents a '1' count, but if your rows come in with their own counts already, specify which column to look at for those.",
    )
    Flags.PARSER.add_argument(
        '--field_column',
        type=str,
        required=False,
        help="(Optional) The field column name from which to look up the `field_to_aggregate`. Defaults to 'field', and is only used if `field_to_aggregate` is set as well.",
    )
    Flags.PARSER.add_argument(
        '--field_to_aggregate',
        type=str,
        required=False,
        help="(Optional) Only aggregate rows that have a `field` column equal to this value. Some linelists may combine several different fields (e.g. cholera, measles, malaria, etc). If we want to aggregate cases for only one of those fields (e.g. 'cholera'), we can set that here.",
    )
    Flags.InitArgs()
    LOG.info('Begin processing linelist')

    datecol = Flags.ARGS.date_column or 'date'
    valcol = Flags.ARGS.val_column or 'val'
    fieldcol = Flags.ARGS.field_column or 'field'
    field_to_aggregate = Flags.ARGS.field_to_aggregate
    count_field = Flags.ARGS.count_field
    cumulative_field = Flags.ARGS.cumulative_field
    dimension_module_path = Flags.ARGS.dimension_class

    ignore_count_field = count_field is None
    ignore_cumulative_field = cumulative_field is None

    if ignore_count_field and ignore_cumulative_field:
        raise Exception(
            'At least one of `count_field` or `cumulative_field` is expected.'
        )

    with open(Flags.ARGS.input_file, 'r') as input_file, open(
        Flags.ARGS.output_file, 'w'
    ) as output_file:
        reader = UnicodeDictReader(input_file)
        all_rows = [*reader]
        dimensions = Flags.ARGS.dimensions or []

        if dimensions == []:
            valid_dimensions = set()
            if dimension_module_path:
                # if a dimension class was specified, let's pull the valid dimensions
                # from that class
                path = dimension_module_path.split('.')
                module_path = '.'.join(path[0:-1])
                classname = path[-1]
                m = importlib.import_module(module_path)
                dimension_class = getattr(m, classname)
                valid_dimensions = set(
                    filter(
                        lambda v: isinstance(v, str), dimension_class.__dict__.values()
                    )
                )
            # if there are no dimensions, collect them automatically from the csv
            for colname in reader.fieldnames:
                if colname in valid_dimensions and colname not in (datecol, valcol):
                    dimensions.append(colname)
            LOG.info(
                'Collected the following dimensions from the linelist: %s',
                ','.join(dimensions),
            )
        else:
            # if the user passed in dimensions to collect, then just reformat them
            # so they are in the format expected by the
            # `convert_linelist_to_count_rows` function. Meaning that any strings
            # with a colon should be split into a tuple of (dim_id, dim_val)
            reformatted_dimensions = []
            for dim in dimensions:
                parts = dim.split(':')
                if len(parts) == 1:
                    reformatted_dimensions.append(dim)
                else:
                    reformatted_dimensions.append((parts[0], parts[1]))
            dimensions = reformatted_dimensions

        (count_rows, cumulative_rows) = convert_linelist_to_count_rows(
            all_rows,
            count_field=count_field,
            cumulative_field=cumulative_field,
            dimensions=dimensions,
            date_key=datecol,
            val_key=valcol,
            field_key=fieldcol,
            field_to_aggregate=field_to_aggregate,
        )

        output_fieldnames = [d if isinstance(d, str) else d[0] for d in dimensions]
        output_fieldnames.extend(['field', 'date', 'val'])

        output_rows = count_rows + cumulative_rows
        writer = UnicodeDictWriter(output_file, fieldnames=output_fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    LOG.info('Successfully processed linelist data')
    LOG.info('Processed %s rows', len(all_rows))
    LOG.info('Wrote %s %s rows', len(count_rows), count_field)
    LOG.info('Wrote %s %s rows', len(cumulative_rows), cumulative_field)
    return 0


if __name__ == '__main__':
    sys.exit(main())
