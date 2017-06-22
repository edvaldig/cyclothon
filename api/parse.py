import json
import requests
import model
from model import db
from datetime import datetime


class Record:
    def __init__(self, d, team):
        self.dt = datetime.strptime(d['LastTime'], "%d.%m.%Y %H:%M:%S")
        self.longitude = float(d['Longitude'].replace(',','.'))
        self.latitude = float(d['Latitude'].replace(',','.'))
        self.speed = float(d['Speed'].replace(',','.'))
        self.no_signal = d['NoSignal']
        self.team = team

    def __repr__(self):
        return "[{time}]{grp}|{team}: {lon}|{lat}\n".format(
                time = self.dt,
                lon = self.longitude,
                lat = self.latitude,
                grp = self.team.category.name,
                team = self.team.name)

class Team:
    def __init__(self, d, category):
        self.name = d['Description']
        self.category = category

    def __repr__(self):
        return "{name}\n".format(name = self.name)

class Category:
    def __init__(self, d):
        self.name = d['CategoryName']
        self.description = d['GroupDescription']

    def __repr__(self):
        return "{name}\n".format(name = self.name)



def get_test_data():
    with open("testdata.json", "r") as f:
        return json.load(f)

def get_data():
    url = "http://live.at.is/Home/GetTeamListUpdate"
    r = requests.get(url)
    return (r.text, json.loads(r.text))


def parse_data(json_raw, data):
    dbcategories = {g.name:g for g in model.Category.query.all()}
    dbteams = {t.name:t for t in model.Team.query.all()}

    log = model.Log(json_raw = json_raw, time = datetime.now(), categories_added = 0, teams_added = 0, records_added = 0, has_error = False, message = "OK")
    try:
        for d in data:
            category = Category(d)
            if not category.name in dbcategories:
                log.categories_added += 1
                category = model.Category(name = category.name, description = category.description)
                db.session.add(category)
                db.session.commit()
                dbcategories[category.name] = category
            category = dbcategories[category.name]

            team = Team(d, category)
            if not team.name in dbteams:
                log.teams_added += 1
                team = model.Team(name = team.name, category_id = category.id)
                db.session.add(team)
                try:
                    db.session.commit()
                except:
                    db.session.rollback()
                    badname = team.name
                    #the current db collation is case-insensitive, lets try to get it by name and see if that works
                    team = model.Team.query.filter(model.Team.name == team.name).first()
                    if team is None:
                        raise
                    else:
                        error = "Resolved team {team} to {team2}".format(team=badname, team2=team.name)
                        log.message = error if len(log.message) == 0 else ",".join([log.message, error])
                dbteams[team.name] = team
            team = dbteams[team.name]

            record = Record(d, team)
            existing_record = model.Record.query.filter(model.Record.team_id == team.id, model.Record.dt == record.dt)
            if existing_record.count() == 0:
                log.records_added += 1
                record = model.Record(
                        longitude = record.longitude,
                        latitude = record.latitude,
                        no_signal = record.no_signal,
                        dt = record.dt,
                        team_id = team.id)
                db.session.add(record)
                db.session.commit()
    except Exception as e:
        log.message = str(e) if len(log.message) == 0 else ",".join([log.message, str(e)])
        log.has_error = True
        print(e)
    finally:
        db.session.add(log)
        db.session.commit()

if __name__ == '__main__':
    parse_data(*get_data())




