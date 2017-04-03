import sys
import csv

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

in_header = next(reader)

location = sys.argv[1]
assert location in ["chicago", "suburbs"]

if location == "chicago":
    out_header = [
        "community",
        "meet_benchmark_english",
        "meet_benchmark_reading",
        "meet_benchmark_math",
        "meet_benchmark_science",
        "meet_benchmark_all_four",
        "act_english",
        "act_math",
        "act_reading",
        "act_science",
        "act_composite"
    ]
else:
    out_header = [
        "Place",
        "Percent Meets-Exceeds - English",
        "Percent Meets-Exceeds - Reading",
        "Percent Meets-Exceeds - Math",
        "Percent Meets-Exceeds - Science",
        "Percent Meets-Exceeds - All",
        "Teacher Salary",
        "ACT Composite",
        "ACT English",
        "ACT Math",
        "ACT Reading",
        "ACT Science"
    ]

writer.writerow(out_header)

# Group school data by community
grouped = {}
for row in reader:
    community = row[0]
    if community not in grouped.keys():
        grouped[community] = []
    grouped[community].append(row[2:])

# Generate weighted average scores for each community
for community in grouped:
    average_scores = [0 for i in range(len(out_header)-1)]
    for school in grouped[community]:
        coverage = float(school.pop())
        for i, score in enumerate(school):
            if '$' in score:
                score = score.replace('$', '')
            if ',' in score:
                score = score.replace(',', '')
            average_scores[i] += (coverage * float(score))
    writer.writerow([community] + average_scores)
