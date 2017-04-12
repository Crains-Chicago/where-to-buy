# Page 1 bounds are consistent across all reports, both yearly
# and monthly.
p1-chicago-bounds = 170.76,23.54,429.83,586.64
p1-county-bounds = 170.76,23.54,290,586.64
p1-cols = 30,280,330,380,432,482,532

# Pages 2-4 bounds (which only exist for counties) can vary substantially.
# Luckily, they tend to be consistent across months/years within a county, and
# There are only six counties, so we can define them closely. 
p24-will-bounds = 96.12,27.35,747.18,586.85
p24-will-cols = 27.35,126,170,207,245,288,328,368,398,428,463,505,545

p3-will-bounds = $(p24-bounds)
p3-will-cols = 27.35,112,156,195,230,272,315,353,385,418,460,500,540

