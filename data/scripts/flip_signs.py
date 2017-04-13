# Flips the signs of the specified columns of a CSV

import csv
import sys

try:
    cols = sys.argv[1]
    cols = cols.split(',')
except IndexError as e:
    raise Exception("Please provide names for the columns whose signs" +
                    " you'd like to flip.").with_traceback(e.__traceback__)

reader = csv.DictReader(sys.stdin)
fieldnames = reader.fieldnames

writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
writer.writeheader()

for row in reader:
    for col in cols:
        try:
            row[col] = float(row[col]) * -1
        except KeyError as e:
            exception = "Couldn't find the column '" + e.args[0] + \
                        "'. Double-check the columns you passed as input."
            raise Exception(exception).with_traceback(e.__traceback__)
    writer.writerow(row)
