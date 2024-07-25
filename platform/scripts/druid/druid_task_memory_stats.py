#!/usr/bin/env python
# Extract garbage collection and heap information from a Druid indexing task's
# log. While you can use a raw indexing task log as-is, this script will run
# much faster if you create a filtered log first (this is also just a generally
# useful thing to do when Reviewing druid indexing logs manually):
# Create input file by doing:
#   grep -P '^2019|\[Eden' task.log > filtered.log
# Run script with input file and output file as arguments:
#   ./druid_task_memory_stats.py INPUT_FILE OUTPUT_FILE
# NOTE: This file does not use pylib flags because it needs to be
# portable and runnable on all machine types.
from builtins import str
import re
import sys

DELIM = '\t'
HEADER = [
    'timestamp',
    'Current Utilization',
    'Current Heap',
    'New Utilization',
    'New Heap',
]
PATTERN = re.compile('.+ Heap: (.+?)\\((.+?)\\)->(.+?)\\((.+?)\\).*')
TIMESTAMP_PATTERN = re.compile('202[0-9]-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}')


def _convert_to_mb(raw_size):
    value = raw_size[:-1]
    unit = raw_size[-1]
    if unit == 'M':
        return value
    if unit == 'K':
        return str(float(value) / 1000)
    if unit == 'G':
        return str(float(value) * 1000)
    if unit == 'B':
        return '0'
    assert False, f'Unknown unit type: {unit}'
    return 'ERR'


def build_row(log_row, timestamp):
    match = PATTERN.match(log_row)
    output_row = [timestamp]
    for raw_size in match.groups():
        output_row.append(_convert_to_mb(raw_size))
    return output_row


def build_timestamp(log_row):
    return log_row[:19].replace('T', ' ')
    return '%s-%s-%s %s:%s:%s' % (
        raw_timestamp[:4],
        raw_timestamp[4:6],
        raw_timestamp[6:8],
        raw_timestamp[9:11],
        raw_timestamp[11:13],
        raw_timestamp[13:15],
    )


def main():
    if len(sys.argv) != 3:
        print('Usage: ./druid_task_memory_stats.py INPUT_FILE OUTPUT_FILE')
        return 1

    input_filename = sys.argv[1]
    output_filename = sys.argv[2]
    with open(input_filename) as input_file, open(output_filename, 'w') as output_file:
        output_file.write(DELIM.join(HEADER))
        output_file.write('\n')

        timestamp = None
        for line in input_file:
            if '[Eden' in line:
                # Ignore initial allocations before a true druid log line has
                # been written. We want to approximate the timestamp that each
                # allocation was tied to.
                if not timestamp:
                    continue

                row = build_row(line, timestamp)
                output_file.write(DELIM.join(row))
                output_file.write('\n')
            elif TIMESTAMP_PATTERN.match(line):
                timestamp = build_timestamp(line)
    return 0


if __name__ == '__main__':
    sys.exit(main())
