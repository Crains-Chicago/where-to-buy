import json
import csv
import sys

import requests

reader = csv.reader(sys.stdin)
header = next(reader)

endpoint = 'https://en.wikipedia.org/w/api.php?'
params = {
    'format': 'json',
    'action': 'query',
    'prop': 'extracts',
    'exintro': 'true',
    'explaintext': 'true',
}

out = {}
for row in reader:
    if 'Illinois' in row[0]:
        community = row[0]
        community = community.replace(' city', '')
        community = community.replace(' town', '')
        community = community.replace(' village', '')
    else:
        community = row[0].title()
        if row[0] == 'MCKINLEY PARK':
            community = 'McKinley Park'
        elif row[0] == 'OHARE':
            community = "O'Hare"
        community += ", Chicago"
    params['titles'] = community

    r = requests.get(endpoint, params=params)
    if r.status_code == 200:
        data = json.loads(r.text)
        extract = ''
        # We can safely iterate since there will only be one
        assert len(data['query']['pages']) == 1
        for page in data['query']['pages'].values():
            text = page['extract']
            text = text.replace('\n', '<br /><br />')
            extract = text
        out[row[0]] = extract
    else:
        out[row[0]] = "Sorry! We couldn't find information about this place on Wikipedia."

json.dump(out, sys.stdout)
