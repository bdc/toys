import jinja2
import json
import logging
import os
import urllib2
import webapp2

import config
import keys


JINJA_ENV = jinja2.Environment(
    loader=jinja2.FileSystemLoader([
      os.path.dirname(__file__) + '/../templates',
      os.path.dirname(__file__) + '/../static',
    ]))


class HtmlHandler(webapp2.RequestHandler):
  def get(self, **kwargs):
    self.response.headers['Content-Type'] = 'text/html'
    js_vars = []
    if 'location' in kwargs:
      js_vars.append({ 'name': 'location', 'val': kwargs['location'] })
    rendered_template = JINJA_ENV.get_template('index.html').render({
      'APP_ROOT': config.APP_ROOT,
      'js_vars': js_vars,
      })
    self.response.write(rendered_template)


class StaticHandler(webapp2.RequestHandler):
  def get(self, filename):
    if filename.endswith('.js'):
      self.response.headers['Content-Type'] = 'application/javascript'
    if filename.endswith('.css'):
      self.response.headers['Content-Type'] = 'text/css'
    rsp = JINJA_ENV.get_template(filename).render({
      'APP_ROOT': config.APP_ROOT,
      })
    self.response.write(rsp)


class AjaxHandler(webapp2.RequestHandler):
  def GetWeatherData(self, lat, lng):
    # This should be a separate module, but whatever. DANGER IS MY MIDDLE NAME
    if not lat or not lng:
      return {'error': 'wtf you tryin to pull here???!'}
    try:
      url = (
          'http://api.worldweatheronline.com/free/v1/weather.ashx?'
          'key=%s&format=json&q=%s,%s&cc=yes') % (
              keys.WORLD_WEATHER_ONLINE_API_KEY, lat, lng)
      url_req = urllib2.Request(url, headers={'User-Agent': 'Weathere'})
      rsp = json.load(urllib2.urlopen(url_req))
      temp_f = rsp['data']['current_condition'][0]['temp_F']
    except urllib2.HTTPError as e:
      return {'error': 'whats the gag - i say, whats the gag, son?'}
    return {
        'lat': lat,
        'lng': lng,
        'temp_f': temp_f,
        }
  def post(self):
    self.response.headers['Content-Type'] = 'application/json'
    rsp = self.GetWeatherData(
        self.request.get('lat'),
        self.request.get('lng'))
    self.response.write(json.dumps(rsp))


application = webapp2.WSGIApplication([
  webapp2.Route(config.APP_ROOT, handler=HtmlHandler),
  webapp2.Route(config.APP_ROOT+'/s/<filename>', handler=StaticHandler),
  webapp2.Route(config.APP_ROOT+'/q/temperature', handler=AjaxHandler),
  webapp2.Route(config.APP_ROOT+'/<location>', handler=HtmlHandler),
  ])

