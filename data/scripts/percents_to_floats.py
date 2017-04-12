import csv
import sys

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)
writer.writerow(header)

for row in reader:
    cleaned = []
    for val in row:
        if '%' in val:
            # do some cleaning
            new_val = val.strip('%')
            new_val = float(new_val.replace('+ ', '').replace('- ', '-'))
            new_val /= 100
            cleaned.append(round(new_val, 2))
        else:
            cleaned.append(val)
    writer.writerow(cleaned)
