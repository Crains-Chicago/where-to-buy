import sys
import csv

import numpy as np
from sklearn.decomposition import PCA

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

in_header = next(reader)
out_header = ["community", "crime"]
writer.writerow(out_header)

crime_list = list(reader)
communities = [community[0] for community in crime_list]
crime_numbers = [community[1:] for community in crime_list]

data = np.array(crime_numbers).astype("float")

pca = PCA(n_components=1, whiten=True)
output = pca.fit_transform(data)

output_list = output.tolist()

for i, row in enumerate(output_list):
    writer.writerow([communities[i]] + row)
