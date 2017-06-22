import model
import flask
import flask.ext.sqlalchemy
import flask.ext.restless

manager = flask.ext.restless.APIManager(model.app, flask_sqlalchemy_db=model.db)

manager.create_api(model.Team, methods = ['GET'])
manager.create_api(model.Category, methods = ['GET'])
manager.create_api(model.Record, methods = ['GET'])
manager.create_api(model.Log, methods = ['GET'])


model.app.run()
