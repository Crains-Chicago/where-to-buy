import csv
import sys

import numpy as np

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)
writer.writerow(header)

# Bring data into memory to perform type casting
reader_list = list(reader)
communities = [row[0] for row in reader_list]
nums = [row[1:] for row in reader_list]
numbers = []
for row in nums:
    out = list(map(lambda x: np.nan if x == '' or x == '--' else float(x),
                   row))
    numbers.append(out)

# Convert to numpy array
data = np.array(numbers).astype('float')

# Calculate means and std deviations for each column
means = np.nanmean(data, axis=0).tolist()
stdevs = np.nanstd(data, axis=0).tolist()

# Calculate zscore for each value
for community, row in zip(communities, numbers):
    out = []
    for val, mean, std in zip(row, means, stdevs):
        # Leave nulls in place
        if np.isnan(val):
            zscore = 0
        else:
            zscore = (val-mean)/std
        out.append(zscore)
    writer.writerow([community] + out)
