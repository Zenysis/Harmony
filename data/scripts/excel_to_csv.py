#!/usr/bin/env python
'''
Converts the first sheet of supplied glob to csv.

Here's an example of how I used it:
    mc cp --recursive gcs/zenysis-et/POESSA/ .
    /Users/ian/code/zenysis/data/scripts/excel_to_csv.py **/*.xls*
    mc cp --recursive . gcs/zenysis-et/POESSA
'''

import os
import sys
import glob

import pandas as pd

excel_files = glob.glob(sys.argv[1], recursive=True)
for excel in excel_files:
    print('Reading', excel)
    out = excel.split('.')[0] + '.csv'
    df = pd.read_excel(excel)
    print('Writing', out)
    df.to_csv(out)

print('Done.')
