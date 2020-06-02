import json
import os

new_data = {}
filename = 'data.json'
with open(filename, 'r') as f:
    data = json.load(f)
    #data['id'] = 134 # <--- add `id` value.

for feature in data['features']:
    props = feature['properties']
    new_data[props['lga_code18']] = {}
    new_data[props['lga_code18']]['population'] = props['M0_earners_persons']
    new_data[props['lga_code18']]['%_of_pop_with_post_school_education'] = props['p_post_scl_qualf_p_post_scl_qualification_pr100']
    new_data[props['lga_code18']]['mean_income'] = props['M0_mean_aud']

writename = 'aurin_data.json'
# os.remove(writename)
with open(writename, 'w') as f:
    json.dump(new_data, f, indent=4)
