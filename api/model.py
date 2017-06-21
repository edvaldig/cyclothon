from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask('cyclothon')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+cymysql://cyclothon:1qazxsw2@cyclothon/cyclothon'

db = SQLAlchemy(app)



class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)
    description = db.Column(db.String(100))


class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)
    finished = db.Column(db.Boolean, default = 0)
    category_id = db.Column(db.Integer, db.ForeignKey(Category.id))
    records = db.relationship('Record', backref='team', lazy='dynamic')

class Record(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    longitude = db.Column(db.Float)
    latitude = db.Column(db.Float)
    no_signal = db.Column(db.Boolean)
    speed = db.Column(db.Float)
    dt = db.Column(db.DateTime)
    team_id = db.Column(db.Integer, db.ForeignKey(Team.id))

def create_database():
    db.create_all()



