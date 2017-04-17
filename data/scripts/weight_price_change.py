import csv
import sys

reader = csv.DictReader(sys.stdin)
fieldnames = reader.fieldnames

writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
writer.writeheader()

for row in reader:
    closed_sales = int(row["closed_sales_2016"].replace(',', ''))
    price_change = float(row["median_price_change"])
    score = (closed_sales * price_change) / (100 + closed_sales)
    row["median_price_change"] = score
    writer.writerow(row)
