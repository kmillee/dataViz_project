import pandas as pd
import json
import os

def remove_accents(val):
    if isinstance(val, str):
        val = val.replace('é', 'e').replace('è', 'e').replace('à', 'a').replace('É', 'e')
    return val

def excelToJson(file_path,sheet_names,output_path):
    #load excel file
    excel_data = pd.ExcelFile(file_path)

    #choose the specific sheet
    for sheet in sheet_names:
        #transform sheets into json format
        df = excel_data.parse(sheet)  #read each sheet into a data frame
        
        # Remove 6 first lines
        df = df.iloc[7:]
        df = df.drop(9)

        #filter columns
        df = df.drop(df.columns[9], axis=1)
        df.columns = range(df.shape[1])
        print(df)
        df = df.iloc[:, 1:31]
        
        """#rename keys
        df.columns = df.columns.str.replace("Unnamed: ", "")
        df.columns = df.columns.str.replace("Eurobarometer - 99.2", "8")"""
           
        #remove accents
        df = df.applymap(remove_accents)

        #convert to a dictionary (json format)
        json_data = df.to_dict(orient='records')

        #save file
        output_file = output_path+ "/" + sheet + ".json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)

        print(f"Data exported as JSON in {output_file}")



print(os.getcwd())
file_path = "src/data/rawData/Discrimination_EU_sp535_volumeA.xlsx"
sheet_names = ["QB12R_2", "QB12R_3", "QB12R_4", "QB13R_2", 
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



output_path = "src/data/tempJson"
excelToJson(file_path, sheet_names, output_path)

if __name__ == "main":
    print(os.getcwd())
    file_path = "src/data/rawData/Discrimination_EU_sp535_volumeA.xlsx"
    sheet_names = ["QB12R_2", "QB12R_3", "QB12R_4", "QB13R_2", 
                "QB13R_3", "QB13R_4", 
                "QB6R_3",
                "QB17_6", "QB17_7",
                "QB12R_10", "QB12R_11", 
                "QB13R_10", "QB13R_11", 
                "QB15R_1", "QB15R_2", "QB15R_3", "QB15R_4",
                "QB6R_2", "QB6R_10",
                "QB17_1", "QB17_2", "QB17_3",
                "QB12R_5", "QB12R_6", "QB12R_7", "QB12R_8", "QB12R_9",
                "QB13R_5", "QB13R_6", "QB13R_7", "QB13R_8", "QB13R_9",
                "QB6R_9"]
    output_path = "src/data/tempJson"
    excelToJson(file_path, sheet_names, output_path)