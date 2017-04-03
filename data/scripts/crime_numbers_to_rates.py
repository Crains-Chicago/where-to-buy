import sys
import csv

location = sys.argv[1]
assert location in ["chicago", "suburbs"]

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)

if location == "chicago":
    writer.writerow(header[:len(header)-1])
    for row in reader:
        for i, x in enumerate(row):
            if i > 0 and i < len(row)-1:
                rate = (float(x)/float(row[-1])) * 10000
                x = row[i] = rate
        writer.writerow(row[:-1])

elif location == "suburbs":
    writer.writerow([header[0]] + header[3:])
    for row in reader:
        pop2015 = float(row[1])
        pop2014 = float(row[2])
        for i, x, in enumerate(row):
            if i > 2 and i < 17 and pop2015 > 0:
                rate = (float(x)/pop2015) * 10000
            elif i > 2 and i < 17 and pop2015 == 0:
                rate = 0
            elif i > 17 and pop2014 > 0:
                rate = (float(x)/pop2014) * 10000
            elif i > 17 and pop2014 == 0:
                rate = 0
            else:
                rate = x
            x = row[i] = rate
        writer.writerow([row[0]] + row[3:])
