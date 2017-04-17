import csv
import sys

reader = csv.DictReader(sys.stdin)
fieldnames = reader.fieldnames

writer = csv.writer(sys.stdout)
writer.writerow(['community', 'price', 'median_price_2016'])

for row in reader:
    closed_sales = int(row["closed_sales_2016"].replace(',', ''))
    price_change = float(row["median_price_change"])
    score = (closed_sales * price_change) / (100 + closed_sales)
    writer.writerow([row['Place2'], score, row['median_price_2016']])
