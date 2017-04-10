import requests
import lxml.html

from secrets import MLS_USER, MLS_PASS


class RequestException(Exception):
    pass

LOGIN_URL = "http://car.stats.10kresearch.com/login"
LIST_URL = "http://car.stats.10kresearch.com/docs/lmu/list"  # recent reports

# Get the verification token
raw_login = requests.get(LOGIN_URL).text

if raw_login.status_code == 200:
    login_page = lxml.html.fromstring(raw_login)

    verification_div_id = "LocationList"
    dom_query = "//body/form/input[@name='__RequestVerificationToken']"
    target_input = login_page.xpath(dom_query)[0]
else:
    raise RequestException("Couldn't reach the CAR login page (status code: %s)"
                           % (raw_login.status_code))

__RequestVerificationToken = target_input.value
UserName = MLS_USER
Password = MLS_PASS
f = '1'

payload = {
    '__RequestVerificationToken': __RequestVerificationToken,
    'UserName': UserName,
    'Password': Password,
    'f': f
}

# WIP
with requests.Session() as s:
    p = s.post(LOGIN_URL, data=payload)

    r = s.get(LIST_URL)
