import sys

import pandas as pd
import tweepy


# Request tokens and keys for authentication
def get_authentication(sys_args):
    api_key = sys_args[0]
    api_secret_key = sys_args[1]
    access_token = sys_args[2]
    access_token_secret = sys_args[3]
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
    df.to_json(f, orient='records')  # lines=True)
    f.close()


def main():
    hashtag = sys.argv[1]
    api_key, api_secret_key, access_token, access_token_secret = get_authentication(sys.argv[2:])
    search_tags(api_key, api_secret_key, access_token, access_token_secret, hashtag)


if __name__ == '__main__':
    main()
