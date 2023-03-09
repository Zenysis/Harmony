#!/usr/bin/env python

import csv
import sys

from pylib.base.flags import Flags

import requests


def write_state_data_to_csv(state_data, path):
    with open(path, "w") as csv_file:
        fieldnames = ['date', 'state', 'field', 'val']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        writer.writeheader()

        for row in state_data:
            writer.writerow(
                {"date": row['date'],
                 "state": row['state'],
                 "field": "total_cases",
                 "val": row["cases"]["total"] or 0
                 }
            )
            writer.writerow(
                {"date": row['date'],
                 "state": row['state'],
                 "field": "confirmed_cases",
                 "val": row["cases"]["confirmed"] or 0
                 }
            )
            writer.writerow(
                {"date": row['date'],
                 "state": row['state'],
                 "field": "probable_cases",
                 "val": row["cases"]["probable"] or 0
                 }
            )


def main():
    Flags.PARSER.add_argument(
        '--output_directory', type=str, required=True, help='Path to output file'
    )
    Flags.InitArgs()

    out_dir = Flags.ARGS.output_directory

    states = requests.get("https://api.covidtracking.com/v2/states.json").json()

    state_data = states['data']

    state_codes = []

    for state in state_data:
        state_codes.append(state['state_code'])

    for code in state_codes:
        states_endpoint = f"https://api.covidtracking.com/v2/states/{code.lower()}/daily/simple.json"
        state_data = requests.get(states_endpoint).json()
        write_state_data_to_csv(state_data['data'], f"{out_dir}/{code}.csv")

if __name__ == "__main__":
    sys.exit(main())