import json
import os

clean_data = {
    "type": "FeatureCollection",
    "name": "EU_countries.geojson",
    "features": []
}

euCountriesISO3 = ["AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", 
                   "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", 
                   "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"]

def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# method to clean the geojson data
def clean_data_from_raw(raw_data):
    for element in raw_data['features']:
        if element['properties']['ISO3_CODE'] in euCountriesISO3:
            clean_element = {"type": "Feature", "properties": {}, "geometry": {}}
            clean_element['properties']['ISO3_CODE'] = element['properties']['ISO3_CODE']
            clean_element['properties']['CNTR_ID'] = element['properties']['CNTR_ID']
            clean_element['properties']['NAME_ENGL'] = element['properties']['NAME_ENGL']
            clean_element['properties']['NAME_FREN'] = element['properties']['NAME_FREN']
            clean_element['geometry'] = element['geometry']
            clean_data["features"].append(clean_element)

# method to refactor the json data converted from excel with minifier.org
def refactor_survey(survey_name, survey_data):    
    refactored = {
        "name": survey_name,
        "data" : [] 
    }

    for i in range (2, len(survey_data[0]) + 1):
        country_code = {"id": survey_data[0][f"{i}"],
                        "number_of_respondents": survey_data[1][f"{i}"],
                        "responses": {
                            "percentage": {},
                            "cardinal": {},
                        }}
        refactored["data"].append(country_code)
    
    for i in range (2, len(survey_data)):
        for j in range (2, len(survey_data[0]) + 1):
            if (i % 2 == 0):
                refactored["data"][j-2]["responses"]["cardinal"][f"{survey_data[i]['1']}"] = survey_data[i][f"{j}"]
            else:
                refactored["data"][j-2]["responses"]["percentage"][f"{survey_data[i]['1']}"] = survey_data[i][f"{j}"]
            
    return refactored



#################################################################################################################################

"""
raw_data = load_data("data/CNTR_RG_20M_2024_3035.geojson")
clean_data_from_raw(raw_data)

with open('cleaned_eu_countries.geojson', 'w', encoding='utf-8') as outfile: 
    json.dump(clean_data, outfile, indent=4)"""


survey_data = load_data("lgbt_full.json")
refactored_data = refactor_survey("QB12_10", survey_data)

with open('data/QB12_10.json', 'w', encoding='utf-8') as outfile: 
    json.dump(refactored_data, outfile, indent=4)

