import json
import os
import jsonConverterV2

clean_data = {
    "type": "FeatureCollection",
    "name": "EU_countries.geojson",
    "features": []
}

euCountriesISO3 = ["AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", 
                   "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", 
                   "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"]

euCountriesCNTR_ID = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "D-E", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]


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

filenames = ["QB12R_2", "QB12R_3", "QB12R_4", "QB13R_2", 
                "QB13R_3", "QB13R_4", 
                "QB6R_3",
                "QB17_6", "QB17_7",
                "QB12R_10", "QB12R_11", 
                "QB13R_10", "QB13R_11", 
                "QB15_1", "QB15_2", "QB15_3", "QB15_4",
                "QB6R_2", "QB6R_10",
                "QB17_1", "QB17_2", "QB17_3",
                "QB12R_5", "QB12R_6", "QB12R_7", "QB12R_8", "QB12R_9",
                "QB13R_5", "QB13R_6", "QB13R_7", "QB13R_8", "QB13R_9",
                "QB6R_9"]

for file in filenames:
    path = "src/data/tempJson/" + file + ".json"
    survey_data = load_data(path)
    refactored_data = refactor_survey(file, survey_data)

    outdir = 'src/data/' + file + '.json'

    with open(outdir, 'w', encoding='utf-8') as outfile: 
        json.dump(refactored_data, outfile, indent=4)


#################################################################################################################################

"""
raw_data = load_data("data/CNTR_RG_20M_2024_3035.geojson")
clean_data_from_raw(raw_data)

with open('cleaned_eu_countries.geojson', 'w', encoding='utf-8') as outfile: 
    json.dump(clean_data, outfile, indent=4)"""

##################################################################################################################################



def replace_values(data):
    for d in data['data']:
        d['responses']['percentage']['1'] = d['responses']['percentage'].pop('1 Not at all comfortable')
        d['responses']['cardinal']['1'] = d['responses']['cardinal'].pop("1 Tres mal a l'aise")

        d['responses']['percentage']["10"] = d['responses']['percentage'].pop('10 Totally comfortable')
        d['responses']['cardinal']["10"] = d['responses']['cardinal'].pop("10 Tout a fait a l'aise")


def replaceKey():
    surveyFiles = ["QB12_2", "QB12_3", "QB12_4", "QB12_5", "QB12_5", "QB12_6", "QB12_7", "QB12_8", "QB12_9", "QB12_10", "QB12_11", "QB13_2", "QB13_3", "QB13_4", "QB13_5", "QB13_6", "QB13_7", "QB13_8", "QB13_9", "QB13_10", "QB13_11"]

    directory = "../data/"

    # Parcours des fichiers
    for file_name in surveyFiles:
        file_path = directory + file_name + ".json"
        print(file_path)
        #file_path = os.path.join(directory, file_name + ".json")
        try:
            # Lecture du contenu JSON
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                print("ok load")
                replace_values(data)
                print("ok replace")
                
            # Écriture des modifications dans le fichier
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
                print("ok dump")

            print(f"Processed: {file_name}.json")

        except FileNotFoundError:
            print(f"File not found: {file_name}.json")
        except json.JSONDecodeError:
            print(f"Invalid JSON in file: {file_name}.json")
        except Exception as e:
            print(f"An error occurred with file {file_name}.json: {e}")

    

