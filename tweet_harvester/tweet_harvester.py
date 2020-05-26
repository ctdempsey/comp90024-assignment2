import os
import sys

# import pandas as pd
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
    cdb_port = sys_args[2]
    return cdb_user, cdb_password, cdb_port


def search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag, tweetdb):
    # Handles Twitter authentication
    access = tweepy.OAuthHandler(api_key, api_secret_key)
    access.set_access_token(access_token, access_token_secret)

    # start api with tweepy
    api = tweepy.API(access, wait_on_rate_limit=True)


    # extract tweets with the relevant tag, write to database
    for tweet in tweepy.Cursor(api.search, q=hashtag + ' -filter:retweets -has:geo', lang="en", tweet_mode='extended',
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
                place_data = {'id': tweet.place.id,
                              'place_type': tweet.place.place_type,
                              'name': tweet.place.name,
                              'full_name': tweet.place.full_name,
                              'country_code': tweet.place.country_code,
                              'country': tweet.place.country,
                              'contained_within': tweet.place.contained_within,
                              'bounding_box': {'type':

                              }}
                tweet_data['place'] = place_data
            tweetdb.save(tweet_data)
        except TypeError:
            print(tweet.place)
        except couchdb.http.ResourceConflict:
            pass

    tweetdb.commit()

def main():
    # sys.stderr = open(os.path.expanduser('~/tweet_harvester.err'), 'a')
    hashtag = sys.argv[1]
    api_key, api_secret_key, access_token, access_token_secret = get_authentication(sys.argv[2:6])
    cdb_user, cdb_password, cdb_port = get_couchdb_details(sys.argv[6:])
    cdb_url = 'http://' + cdb_user + ':' + cdb_password + '@localhost:' + cdb_port + '/'
    couch = couchdb.Server(cdb_url)
    tweetdb = couch['tweets']
    search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag, tweetdb)


if __name__ == '__main__':
    main()
