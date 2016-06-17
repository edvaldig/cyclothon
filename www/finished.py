from lxlm import html
import requests
import json

page = requests.get("http://www.timataka.net/wowcyclothon2016/urslit/?race=4")
tree = html.fromstring(page.content)
rows = tree.xpath('//table/tbody/tr')

completed = [[col.xpath('.//text()') for col in row.xpath('td')] for row in rows]
cdict = [{"place":team[0][0], "name":team[1][0], "pace":team[2][0], "time":team[3][0]} for team in completed]

with open("finals.json", "w") as f:
    f.write(json.dumps(cdict, ensure_ascii=False).encode('utf-8'))

