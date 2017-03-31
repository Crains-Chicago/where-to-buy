import sys
import csv

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)

writer.writerow(header[:len(header)-1])

for row in reader:
    for i, x in enumerate(row):
        if i > 0 and i < len(row)-1:
            rate = (float(x)/float(row[-1])) * 10000
            x = row[i] = rate
    writer.writerow(row[:-1])
