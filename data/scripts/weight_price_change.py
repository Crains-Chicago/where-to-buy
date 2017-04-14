import csv
import sys

reader = csv.DictReader(sys.stdin)
fieldnames = reader.fieldnames

writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
writer.writeheader()

for row in reader:
    try:
        closed_sales = int(row["closed_sales_2016"].replace(',', ''))
        price_change = float(row["median_price_change"])
        score = (closed_sales * price_change) / (100 + closed_sales)
        row["median_price_change"] = score
        writer.writerow(row)
    except KeyError:
        attached_price_change = float(row["attached_median_price_change"])
        detached_price_change = float(row["detached_median_price_change"])
        attached_closed_sales = int(row["attached_closed_sales_2016"].replace(',', ''))
        detached_closed_sales = int(row["detached_closed_sales_2016"].replace(',', ''))

        attached_score = (attached_closed_sales * attached_price_change) / \
                         (100 + attached_closed_sales)
        detached_score = (detached_closed_sales * detached_price_change) / \
                         (100 + detached_closed_sales)

        row["attached_median_price_change"] = attached_score
        row["detached_median_price_change"] = detached_score
        writer.writerow(row)
