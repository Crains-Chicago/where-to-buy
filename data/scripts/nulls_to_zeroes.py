import sys
import csv

reader = csv.reader(sys.stdin)
header = next(reader)

writer = csv.writer(sys.stdout)
writer.writerow(header)

for row in reader:
    for i, x in enumerate(row):
        if len(x) < 1:
            x = row[i] = 0
    writer.writerow(row)
