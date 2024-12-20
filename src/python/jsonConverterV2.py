import pandas as pd
import json
import os

def remove_accents(val):
    if isinstance(val, str):
        val = val.replace('é', 'e').replace('è', 'e').replace('à', 'a').replace('É', 'e')
    return val

def getIndexValues(df, filename):
    content_row = df[df['file'] == filename].reset_index(drop=True)
    file = content_row['file'].values[0]
    type = content_row['type'].values[0]
    category = content_row['category'].values[0]
    return file, type, category

def excelToJson(file_path, sheet_names, output_path):

    # load excel file
    excel_data = pd.ExcelFile(file_path)

    # choose the specific sheet
    for sheet_name in sheet_names:
        # transform sheets into json format
        sheet_df = excel_data.parse(sheet_name) 

        # find the corresponding file in the index to get the type of data in sheet
        index_df = pd.read_csv("src/data/surveyData/index.csv")
        file, type, category = getIndexValues(index_df, sheet_name)

        if (file == sheet_name):
            processDataFrame(sheet_df, file, type, category, index_df)
            return
           
        # remove accents
        df = df.applymap(remove_accents)

        # convert to a dictionary (json format)
        json_data = df.to_dict(orient='records')

        # save file
        output_file = output_path+ "/" + sheet_name + ".json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)

        print(f"Data exported as JSON in {output_file}")


def remove_answer_from_question(question, answer):
    if isinstance(question, str) and isinstance(answer, str):  # Ensure both are strings
        # Remove the answer part from the question if it's found
        return question.replace(answer, '').strip()  # Remove answer and strip any extra spaces
    return question

def processDataFrame(df, file, type, category, index_df):

    if (type == "ordinal"):

        # filter lines
        df = df.iloc[7:]
        df = df.drop(9)

        # filter columns
        df = df.drop(df.columns[9], axis=1)
        df.columns = range(df.shape[1])

        df = df.iloc[:, 1:31]

    elif (file == "Content"):

        # filter lines
        df = df.iloc[6:]
        
        # filter columns
        
        df = df.drop(df.columns[1], axis=1)
        print(df)
        df.columns = range(df.shape[1])
        df[1] = df[1].str.replace(r'^[A-Za-z0-9._]+\s', '', regex=True)
        df.columns = ["file", "question_eng"]

        merged_data = index_df.merge(df, on="file", how="left")

        

        """last_column_df = merged_data.iloc[:, [-1]]
        last_column_df.to_csv("src/data/surveyData/answers.csv", index=False)"""

        answer_df = pd.read_csv("src/data/surveyData/answers.csv")
        merged_df = pd.concat([merged_data, answer_df], axis=1)
        merged_df.columns = ["file", "type", "category", "question_eng", "answer"]

        merged_df['question_eng'] = merged_df.apply(lambda row: remove_answer_from_question(row['question_eng'], row['answer']), axis=1)
        print(merged_df)        

        output_file_path = "src/data/surveyData/updated_index2.csv"
        merged_df.to_csv(output_file_path, index=False)


print(os.getcwd())
file_path = "src/data/rawData/Discrimination_EU_sp535_volumeA.xlsx"
sheet_names = ["Content"]

output_path = "src/data/tempJson"
excelToJson(file_path, sheet_names, output_path)

