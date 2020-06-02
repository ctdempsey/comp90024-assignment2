import json
json_file = open("hashtags.txt", "r")
hashtags = json.load(json_file)
json_file.close()#tags=hashtags["rows"].sort(key=takeSecond)
tophashtags=sorted(hashtags["rows"],key=lambda k: k["value"],reverse=True)

top10hashtags = [tophashtags[idx] for idx in range(0,len(tophashtags))] 

for key in top10hashtags:
	print(key)