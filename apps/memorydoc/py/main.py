import jinja2
import json
import logging
import os
import urllib2
import webapp2

import config


JINJA_ENV = jinja2.Environment(
    loader=jinja2.FileSystemLoader([
      os.path.dirname(__file__) + '/../templates',
      os.path.dirname(__file__) + '/../static',
    ]))
def jinja_include(filename):
  return jinja2.Markup(JINJA_ENV.loader.get_source(JINJA_ENV, filename)[0])
JINJA_ENV.globals['include'] = jinja_include


class HtmlHandler(webapp2.RequestHandler):
  def get(self, **kwargs):
    self.response.headers['Content-Type'] = 'text/html'
    js_vars = []
    rendered_template = JINJA_ENV.get_template('index.html').render({
      'APP_ROOT': config.APP_ROOT,
      'js_vars': js_vars,
      })
    self.response.write(rendered_template)


class StaticHandler(webapp2.RequestHandler):
  def get(self, filename):
    if filename.endswith('.js'):
      self.response.headers['Content-Type'] = 'application/javascript'
    if filename.endswith('.json'):
      self.response.headers['Content-Type'] = 'application/json'
    if filename.endswith(('.css', '.html')):
      self.response.headers['Content-Type'] = 'text/css'
    rsp = JINJA_ENV.get_template(filename).render({
      'APP_ROOT': config.APP_ROOT,
      })
    self.response.headers.add_header("Access-Control-Allow-Origin", "*")
    self.response.write(rsp)


application = webapp2.WSGIApplication([
  webapp2.Route(config.APP_ROOT, handler=HtmlHandler),
  webapp2.Route(config.APP_ROOT+'/s/<filename:.*>', handler=StaticHandler),
  ])

