# Twitter stream harvester source code.

import os
import sys
import ogr
from math import cos, sin, atan2, sqrt

# import necessary libs
import tweepy
import couchdb

# Request tokens and keys for authentication
def get_authentication(sys_args):
    api_key = sys_args[0]
    api_secret_key = sys_args[1]
    access_token = sys_args[2]
    access_token_secret = sys_args[3]
    return api_key, api_secret_key, access_token, access_token_secret

def get_couchdb_details(sys_args):
    cdb_user = sys_args[0]
    cdb_password = sys_args[1]
    cdb_ip = sys_args[2]
    cdb_port = sys_args[3]
    return cdb_user, cdb_password, cdb_ip, cdb_port

# Handles API limit, from official docs.
def limit_handler(cursor):
    while True:
        try:
            yield cursor.next()
        except tweepy.RateLimitError:
            # Wait 15 minutes.
            time.sleep(15 * 60)

# Create a stream listener.
class MyStreamListener(tweepy.StreamListener):

    def __init__(self, api_key, api_secret_key, 
                 access_token, access_token_secret, 
                 hashtags, tweetdb, lyr_in, idx_reg, ctran):
        tweepy.StreamListener.__init__(self)
        self.api_key = api_key
        self.api_secret_key = api_secret_key
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.hashtags = hashtags.split()
        self.tweetdb = tweetdb
        self.lyr_in = lyr_in
        self.idx_reg = idx_reg
        self.ctran = ctran

        # Handles Twitter authentication
        access = tweepy.OAuthHandler(api_key, api_secret_key)
        access.set_access_token(access_token, access_token_secret)

        # start api with tweepy
        self.api = tweepy.API(access, wait_on_rate_limit=True)
        
    def on_status(self, status):
        if status.place and not status.retweeted:
            if status.place.country == 'Australia':
                try:
                    status_data = {'_id': status.id_str,
                                   'created_at': status.created_at.isoformat(),
                                   'coordinates': status.coordinates,
                                   'place': status.place,
                                   'full_text': status.text,
                                   'user_id': status.user.id_str,
                                   'user_screen_name': status.user.screen_name,
                                   'hashtags': [e['text'] for e in status._json['entities']['hashtags']],
                                   'user_followers': status.user.followers_count
                                  }
                    place_data = {'id': status.place.id,
                                  'place_type': status.place.place_type,
                                  'name': status.place.name,
                                  'full_name': status.place.full_name,
                                  'country_code': status.place.country_code,
                                  'country': status.place.country,
                                  'contained_within': [],
                                  'bounding_box': {'type': status.place.bounding_box.type,
                                                   'coordinates': status.place.bounding_box.coordinates
                                                   }
                                  }
                    status_data['place'] = place_data

                    if status.coordinates:
                        status_data['LGA'] = get_LGA(
                            status.coordinates['coordinates'][0],
                            status.coordinates['coordinates'][1],
                            self.lyr_in, self.idx_reg, self.ctran)
                    else:
                        coords = status.place.bounding_box.coordinates[0]
                        center_lon = (float(coords[0][0]) + float(coords[2][0]))/2.0
                        centre_lat = (float(coords[0][1]) + float(coords[2][1]))/2.0
                        status_data['LGA'] = get_LGA(center_lon, centre_lat,
                                                     self.lyr_in, self.idx_reg,
                                                     self.ctran)

                    tweetdb.save(status)
                    print('saved.')
                    #print("LGA:", tweet_data['LGA'])

                except TypeError:
                    pass

                except couchdb.http.ResourceConflict:
                    pass

    def on_error(self, status_code):
        i = 1
        if status_code == 420:
            time.sleep(15 * i)

def search_tags(api_key, api_secret_key, access_token, access_token_secret,
                hashtags, tweetdb, lyr_in, idx_reg, ctran):
    
    myStreamListener = MyStreamListener(api_key, api_secret_key, 
                                        access_token, access_token_secret,
                                        hashtags, tweetdb, lyr_in,
                                        idx_reg, ctran)
    print('hashtags: ', myStreamListener.hashtags)

    myStream = tweepy.Stream(auth = myStreamListener.api.auth,
                             listener=myStreamListener)

    myStream.filter(track=hashtags, is_async=True)


def get_LGA(lon, lat, lyr_in, idx_reg, ctran):
    # transform incoming longitude/latitude to the shapefile's projection
    [lon,lat,z]=ctran.TransformPoint(lon,lat)
    # create a point from coordinates
    pt = ogr.Geometry(ogr.wkbPoint)
    pt.SetPoint_2D(0, lon, lat)
    #Set up a spatial filter such that the only features we see when we
    #loop through "lyr_in" are those which overlap the point defined above
    lyr_in.SetSpatialFilter(pt)
    #Loop through the overlapped features and display the field of interest
    polygon = None
    for feat_in in lyr_in:
        polygon = feat_in.GetFieldAsString(idx_reg)
        # print(lon, lat, feat_in.GetFieldAsString(idx_reg))
    return (polygon)

def main():
    # setup for coord_to_LGA (coordinate to LGA transformation)
    drv = ogr.GetDriverByName('ESRI Shapefile') # set input type as shapefile
    ds_in = drv.Open("./data/LGAS_2019.shp") # load shapefile
    lyr_in = ds_in.GetLayer(0) # get the shapefile's first layer
    idx_reg = lyr_in.GetLayerDefn().GetFieldIndex("LGA_CODE19") # set target attribute
    # set our CRS to the standard WGS 84 (EPSG:4326)
    geo_ref = lyr_in.GetSpatialRef()
    point_ref=ogr.osr.SpatialReference()
    point_ref.ImportFromEPSG(4326)
    ctran=ogr.osr.CoordinateTransformation(point_ref,geo_ref)

    # sys.stderr = open(os.path.expanduser('~/tweet_harvester.err'), 'a')
    hashtags = sys.argv[1]

    # get twitter api credentials.
    api_key, api_secret_key, access_token, access_token_secret = get_authentication(sys.argv[2:6])

    # get couchdb details.
    cdb_user, cdb_password, cdb_ip, cdb_port = get_couchdb_details(sys.argv[6:])

    # connect to couchdb.
    cdb_url = 'http://' + cdb_user + ':' + cdb_password + '@' + cdb_ip +':' + cdb_port + '/'
    couch = couchdb.Server(cdb_url)

    tweetdb = couch['tweets']

    search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtags, tweetdb, lyr_in, idx_reg, ctran)

    # some dummy locations for testing
    #locations = [(144.97, -37.82), (138.6, -34.93), (151.2, -33.87), (153.02, -27.47), (115.85, -31.95), (147.32, 147.32), (149.13, -35.3), (130.83, -12.45)]
    #for lon, lat in locations:
    #    print(get_LSA(lon, lat, lyr_in, idx_reg, ctran))


if __name__ == '__main__':
    main()
