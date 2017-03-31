import sys
import csv

import numpy as np
from sklearn.decomposition import PCA

reader = csv.reader(sys.stdin)
header = next(reader)
reader_list = list(reader)
data = np.array(reader_list).astype("float")

writer = csv.writer(sys.stdout)

initial_header = next(reader)
writer.writerow(header)
