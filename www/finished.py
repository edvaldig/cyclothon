from lxml import html
import requests
import json

namefixes = {
}
def fixname(name):
    if name in namefixes:
        return namefixes[name]
    return name

resultdict = []
results = [
    "https://www.timataka.net/wowcyclothon2017/urslit?race=4&cat=overall",
    "https://www.timataka.net/wowcyclothon2017/urslit?race=8&cat=overall",
    "https://www.timataka.net/wowcyclothon2017/urslit?race=2&cat=overall",
    "https://www.timataka.net/wowcyclothon2017/urslit?race=1&cat=overall"
]

for url in results:
    page = requests.get(url)
    tree = html.fromstring(page.content)
    rows = tree.xpath('//table/tbody/tr')
    completed = [[col.xpath('.//text()') for col in row.xpath('td')] for row in rows]
    cdict = [{"place":team[0][0], "name":team[1][0], "time":team[2][0]} for team in completed]
    resultdict.extend(cdict)

with open("finals.json", "w") as f:
    json.dump(resultdict, f, ensure_ascii=False)

