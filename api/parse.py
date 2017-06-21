import json
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



def get_data():
    with open("testdata.json", "r") as f:
        return json.load(f)



def parse_data(data):
    dbcategories = {g.name:g for g in model.Category.query.all()}
    dbteams = {t.name:t for t in model.Team.query.all()}


    for d in data:
        category = Category(d)
        if not category.name in dbcategories:
            print("Adding nonexisting category {name}".format(name = category.name))
            category = model.Category(name = category.name, description = category.description)
            db.session.add(category)
            db.session.commit()
            dbcategories[category.name] = category
        category = dbcategories[category.name]

        team = Team(d, category)
        if not team.name in dbteams:
            print("Adding new team ({team}) to category {category}".format(
                team = team.name,
                category = category.name))
            team = model.Team(name = team.name, category_id = category.id)
            db.session.add(team)
            db.session.commit()
            dbteams[team.name] = team
        team = dbteams[team.name]

        record = Record(d, team)
        existing_record = model.Record.query.filter(model.Record.team_id == team.id, model.Record.dt == record.dt)
        if existing_record.count() == 0:
            print("Adding new record for team {team} at time {dt}".format(team =  team.name, dt = record.dt))
            record = model.Record(
                    longitude = record.longitude,
                    latitude = record.latitude,
                    no_signal = record.no_signal,
                    dt = record.dt,
                    team_id = team.id)
            db.session.add(record)
            db.session.commit()



if __name__ == '__main__':
    parse_data(get_data())




