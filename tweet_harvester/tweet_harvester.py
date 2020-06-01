# Tweet harvester source code.

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


def search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag, tweetdb, lyr_in, idx_reg, ctran):
    # Handles Twitter authentication
    access = tweepy.OAuthHandler(api_key, api_secret_key)
    access.set_access_token(access_token, access_token_secret)

    # start api with tweepy
    api = tweepy.API(access, wait_on_rate_limit=True)

    # extract tweets with the relevant tag, write to database
    for tweet in tweepy.Cursor(api.search, q=hashtag + ' -filter:retweets', lang="en", tweet_mode='extended',
                               geocode='-28.04234848,133.49058772,2100km').items(1000):
        try:
            tweet_data = {'_id': tweet.id_str,
                          'created_at': tweet.created_at.isoformat(),
                          'coordinates': tweet.coordinates,
                          'place': tweet.place,
                          'full_text': tweet.full_text,
                          'user_id': tweet.user.id_str,
                          'user_screen_name': tweet.user.screen_name,
                          'hashtags': [e['text'] for e in tweet._json['entities']['hashtags']],
                          'user_followers': tweet.user.followers_count}
            if tweet.place:
                coords = tweet.place.bounding_box.coordinates[0]
                center_lon = (float(coords[0][0]) + float(coords[2][0]))/2.0
                centre_lat = (float(coords[0][1]) + float(coords[2][1]))/2.0
                lga = get_LGA(center_lon, centre_lat, lyr_in, idx_reg, ctran)
                place_data = {'id': tweet.place.id,
                              'place_type': tweet.place.place_type,
                              'name': tweet.place.name,
                              'full_name': tweet.place.full_name,
                              'country_code': tweet.place.country_code,
                              'country': tweet.place.country,
                              'contained_within': tweet.place.contained_within,
                              'LGA' : lga,
                              'bounding_box': {'type': tweet.place.bounding_box.type,
                                               'coordinates': tweet.place.bounding_box.coordinates
                                               }
                              }
                tweet_data['place'] = place_data
            if tweet.coordinates:
                tweet_data['LGA'] = get_LGA(tweet.coordinates['coordinates'][0], tweet.coordinates['coordinates'][1], lyr_in, idx_reg, ctran)
            if tweet.coordinates or tweet.place:
                tweetdb.save(tweet_data)
        except TypeError:
            print("ERROR")
        except couchdb.http.ResourceConflict:
            pass

    tweetdb.commit()

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
    hashtag = sys.argv[1]

    # get twitter api credentials.
    api_key, api_secret_key, access_token, access_token_secret = get_authentication(sys.argv[2:6])

    # get couchdb details.
    cdb_user, cdb_password, cdb_ip, cdb_port = get_couchdb_details(sys.argv[6:])

    # connect to couchdb.
    cdb_url = 'http://' + cdb_user + ':' + cdb_password + '@' + cdb_ip +':' + cdb_port + '/'
    #couch = couchdb.Server(cdb_url)
    couch = couchdb.Server('http://admin:admin@172.26.130.183:5984')

    tweetdb = couch['tweets']

    search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag, tweetdb, lyr_in, idx_reg, ctran)



    # some dummy locations for testing
    #locations = [(144.97, -37.82), (138.6, -34.93), (151.2, -33.87), (153.02, -27.47), (115.85, -31.95), (147.32, 147.32), (149.13, -35.3), (130.83, -12.45)]
    #for lon, lat in locations:
    #    print(get_LSA(lon, lat, lyr_in, idx_reg, ctran))


if __name__ == '__main__':
    main()
