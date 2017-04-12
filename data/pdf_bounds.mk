# Page 1 bounds and columns are reliable across all reports, both yearly
# and monthly. Page bounds for counties are also reliable.
p1-chicago-bounds = 170.76,23.54,429.83,586.64
p1-county-bounds = 170.76,23.54,290,586.64
p234-county-bounds = 96.12,27.35,747.18,586.85
p1-cols = 30,280,330,380,432,482,532

# Page 2-4 columns (which only exist for counties) can vary substantially.
# Luckily, they tend to be consistent across months/years within a county, and
# There are only six counties, so we can define them in fine detail. 

# Will County
p24-will-cols = 27,126,170,207,245,288,328,368,398,428,463,505,545
p3-will-cols = 27,112,156,195,230,272,315,353,385,418,460,500,540

# DuPage County
p24-dupage-cols = 27,120,162,202,236,280,322,361,392,423,458,502,542
p3-dupage-cols =  27,116,159,200,236,278,322,359,390,422,460,502,545

# Lake County
p24-lake-cols = $(p24-will-cols)
p3-lake-cols = $(p24-will-cols)

# North Cook
p24-north-cols = 27,115,155,195,233,275,316,359,392,425,460,502,545
p3-north-cols = $(p3-will-cols)

# South Cook
p24-south-cols = $(p3-will-cols)
p3-south-cols = $(p3-will-cols)

# West Cook
p24-west-cols = $(p3-will-cols)
p3-south-cols = $(p3-will-cols)

