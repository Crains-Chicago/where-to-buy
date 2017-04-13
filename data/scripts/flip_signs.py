# Flips the signs of the specified columns of a CSV

import csv
import sys

assert sys.argv[1]

cols = sys.argv[1]
cols = cols.split(',')

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)
writer.writerow(header)

for row in reader:
    for i, val in enumerate(row):
        if str(i+1) in cols:
            row[i] = float(val) * -1
    writer.writerow(row)
