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
    community, school = row[0], row[2:]
    grouped.setdefault(community, []).append(school)

# Generate weighted average scores for each community
for community, schools in grouped.items():
    average_scores = [0] * (len(out_header) - 1)
    total_coverage = 0.0
    for school in schools:
        coverage = float(school.pop())
        for i, score in enumerate(school):
            if '$' in score:
                score = score.replace('$', '')
            if ',' in score:
                score = score.replace(',', '')
            average_scores[i] += (coverage * float(score))
        total_coverage += coverage
    average_scores = [score/total_coverage for score in average_scores]
    writer.writerow([community] + average_scores)
