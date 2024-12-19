import pandas as pd
import json
import os



def excelToJson(file_path,sheet_names,output_path):
    #load excel file
    excel_data = pd.ExcelFile(file_path)

    L = [-1,1,2, 4, 6, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 30, 32,
         34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60]
    columns_to_keep = [str(i+2) for i in L]


    #choose the specific sheet
    for sheet in sheet_names:
        #transform sheets into json format
        df = excel_data.parse(sheet)  #read each sheet into a data frame


        # Remove 6 first lines (useless)
        df = df.iloc[6:]
        df = df.drop([7,9]) 


        df.columns = [col.replace("Unnamed: ", "") if "Unnamed:" in col else col for col in df.columns]
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

        json_data[0]['1'] = None 


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
