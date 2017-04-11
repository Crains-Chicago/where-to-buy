import os
import sys

import requests
import lxml.html

from secrets import CAR_USER, CAR_PASS


class RequestException(Exception):
    pass

YEAR = sys.argv[1]
BASE_URL = "http://car.stats.10kresearch.com"
LOGIN_URL = BASE_URL + "/login"
LIST_URL = BASE_URL + "/docs/lmu/" + YEAR + "-12/list"  # recent reports

# Get the verification token
raw_login = requests.get(LOGIN_URL)

if raw_login.ok:
    login_page = lxml.html.fromstring(raw_login.text)

    verification_div_id = "LocationList"
    dom_query = "//body/form/input[@name='__RequestVerificationToken']"
    target_input = login_page.xpath(dom_query)[0]
else:
    raise RequestException("Couldn't reach the CAR login page (status code: %s)"
                           % (raw_login.status_code))

__RequestVerificationToken = target_input.value
UserName = CAR_USER
Password = CAR_PASS
f = '1'

payload = {
    '__RequestVerificationToken': __RequestVerificationToken,
    'UserName': UserName,
    'Password': Password,
    'f': f
}

with requests.Session() as s:
    p = s.post(LOGIN_URL, data=payload)
    if p.ok:
        r = s.get(LIST_URL)
        if r.ok:
            link_page = lxml.html.fromstring(r.text)
            link_query = "//ul[@class='LocationList']/li/a"
            links = link_page.xpath(link_query)

            for link in links:
                full_path = BASE_URL + link.attrib['href']
                community_name = link.text
                community_filename = community_name.replace(' ', '_') + '.pdf'
                output_path = os.path.join('raw', 'pdfs', community_filename)

                response = s.get(full_path)
                if response.url != full_path:
                    print('Redirect :(')
                    print(response.content)
                elif response.ok:
                    with open(output_path, 'wb') as pdf:
                        pdf.write(response.content)
                        print('Downloaded %s from %s'
                              % (output_path, full_path))
                else:
                    print("Couldn't load the file %s (status code: %s)"
                          % (full_path, response.status_code))
        else:
            raise RequestException("Couldn't load the CAR list page (status code: %s)"
                                   % (r.status_code))
    else:
        raise RequestException("Couldn't post login info (status code: %s)"
                               % (p.status_code))
