import sys
import csv

import numpy as np
from sklearn.decomposition import PCA

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

index_variable = sys.argv[1]
assert index_variable in ["crime", "schools", "price"]

in_header = next(reader)
out_header = ["community", index_variable]
writer.writerow(out_header)

reader_list = list(reader)
communities = [community[0] for community in reader_list]
numbers = [community[1:] for community in reader_list]

data = np.array(numbers).astype("float")

pca = PCA(n_components=1, whiten=True)
output = pca.fit_transform(data)

output_list = output.tolist()

for i, row in enumerate(output_list):
    writer.writerow([communities[i]] + row)
