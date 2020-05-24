import json, csv, tweepy, re
import pandas as pd


# Request tokens and keys for authentication
def get_authentication():
    api_key = input('Enter API Key: ')
    api_secret_key = input('Enter API Secret Key: ')
    access_token = input('Enter Access Token: ')
    access_token_secret = input('Enter Access Token Secret: ')
    return api_key, api_secret_key, access_token, access_token_secret


def search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag):
    # Handles Twitter authentication
    access = tweepy.OAuthHandler(api_key, api_secret_key)
    access.set_access_token(access_token, access_token_secret)

    # start api with tweepy
    api = tweepy.API(access, wait_on_rate_limit=True)


    # create df to write to
    df = pd.DataFrame(columns=['timestamp', 'location', 'tweet_text', 'username', 'all_hashtags', 'followers_count'])


    # extract tweets with the relevant tag, write to the file
    for tweet in tweepy.Cursor(api.search, q=hashtag + ' -filter:retweets',
                               lang="en", tweet_mode='extended').items(100):
        if tweet.coordinates:
            df.loc[len(df)] = [tweet.created_at,
                               tweet.coordinates,
                               tweet.full_text.replace('\n', ' ').encode('utf-8'),
                               tweet.user.screen_name.encode('utf-8'),
                               [e['text'] for e in tweet._json['entities']['hashtags']],
                               tweet.user.followers_count]


    # open the spreadsheet we will write to
    f = open(hashtag + ".json", 'w')
    df.to_json(f, orient='records') #lines=True)
    f.close()

def get_hashtag():
    hashtag = input('Enter Hashtag(s): ')
    return hashtag


if __name__ == '__main__':
    api_key, api_secret_key, access_token, access_token_secret = get_authentication()
    hashtag = get_hashtag()
    search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag)
