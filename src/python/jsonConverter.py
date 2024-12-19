import pandas as pd
import json
import os



def excelToJson(file_path,sheet_names,output_path):
    #load excel file
    excel_data = pd.ExcelFile(file_path)
    L = [1,3]
    L.extend([2*i+1 for i in range(2,32)])

    #choose the specific sheet
    for sheet in sheet_names:
        #transform sheets into json format
        df = excel_data.parse(sheet)  #read each sheet into a data frame


        #Remove 6 first lines (useless)
        df = df.iloc[6:]
        df = df.drop([7,9]) 

        #rename keys
        df.columns = [col.replace("Unnamed: ", "") if "Unnamed:" in col else col for col in df.columns]
        df.columns = [col.replace("Eurobarometer - 99.2", "8") if "Eurobarometer - 99.2" in col else col for col in df.columns]

        #filerr columns
        df = df[[col for col in df.columns if col in columns_to_keep]]

        #rename columns names correctly
        new_columns = {}
        cpt = 1
        for col in df.columns:
            new_columns[col] = str(cpt)
            cpt += 1 
        
        df.rename(columns=new_columns, inplace=True)  # Remplace les noms des colonnes par les nouveaux noms

        #convert to a dictionary (json format)
        json_data = df.to_dict(orient='records')

        json_data[0] =   {"1": None, "2": "EU27","3": "BE","4": "BG","5": "CZ","6": "DK",
                        "7": "D-W","8": "DE","9": "EE","10": "IE","11": "EL","12": "ES",
                        "13": "FR","14": "HR","15": "IT","16": "CY","17": "LV","18": "LT",
                        "19": "LU","20": "HU","21": "MT","22": "NL","23": "AT","24": "PL",
                        "25": "PT", "26": "RO","27": "SI","28": "SK","29": "FI","30": "SE"  } 


        #save file
        output_file = output_path+ "/" + sheet + ".json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)

        print(f"Data exported as JSON in {output_file}")



print(os.getcwd())
file_path = "../data excel/Discrimination in the EU_sp535_volumeAP.xlsx"
sheet_names = ["QB12_7"]
output_path = "src/data/tempJson"
excelToJson(file_path, sheet_names, output_path)
