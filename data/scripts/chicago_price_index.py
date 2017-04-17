import csv
import sys

reader = csv.DictReader(sys.stdin)
fieldnames = reader.fieldnames

writer = csv.writer(sys.stdout)
writer.writerow(['community', 'price'])

for row in reader:
    attached_price_change = float(row["attached_median_price_change"])
    detached_price_change = float(row["detached_median_price_change"])
    attached_closed_sales = int(row["attached_closed_sales_2016"].replace(',', ''))
    detached_closed_sales = int(row["detached_closed_sales_2016"].replace(',', ''))

    attached_score = (attached_closed_sales * attached_price_change) / \
                     (100 + attached_closed_sales)
    detached_score = (detached_closed_sales * detached_price_change) / \
                     (100 + detached_closed_sales)

    score = ((attached_score * attached_closed_sales +
             detached_score * detached_closed_sales) /
             (attached_closed_sales + detached_closed_sales))
    writer.writerow([row['community'], score])
