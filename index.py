# How to run

# > $ python index.py

# Library imports
# Required (external) libraries: numpy, Flask 
from flask import Flask, render_template,url_for, request
import os
import json
import pickle
import sqlite3
import pdb

#This contains the main database file for the visualization
DATABASE_FILE = 'noaa.db'
#This establihses database connection to the database file through sqlite3
conn = sqlite3.connect(DATABASE_FILE)

#Get data for a single year in pandas
def get_pandas_single(year,month):
    tst=conn.execute('select * from tmax_baseline_diff where year='+str(year)+' and month='+str(month)).fetchall()
    res={item[0]:(item[3] if item[3]>-100 else 0) for item in tst}
    return res
#Get hostogram range given a specific month and a year range, with a stpe size of 3 (for the color gradation)
def get_hist_range(y_min, y_max,month, step=3):
    max_val=10
    min_val=-10
    max_adjusted_val = int(round(max_val/float(step)))
    min_adjusted_val = int(round(min_val/float(step)))
    query = 'select year, rnd_cnt, count(rnd_cnt) '\
            'from '\
            '(select fips_code, year, round((baseline_diff/'+str(step)+')-0.5) as rnd_cnt '\
            'from tmax_baseline_diff '\
            'where '\
            'year >='+str(y_min)+' and '\
            'year <='+str(y_max) + ' and '\
            'month=' + str(month) + ' and '\
            'baseline_diff>-50 and baseline_diff<50) '\
            'group by year, rnd_cnt;'
    #Preliminary results
    tst=conn.execute(query).fetchall()
    res={}
    #Setting up the json dumps stuff. 
    for i in range(y_min,y_max+1):
        res[i]={}
        for j in range(min_adjusted_val,max_adjusted_val+1):
            res[i][j]=0
    for entry in tst:
        if entry[1]>max_adjusted_val:
            res[entry[0]][max_adjusted_val]+=entry[2]
        elif entry[1]<min_adjusted_val:
            res[entry[0]][min_adjusted_val]+=entry[2]
        else:
            res[entry[0]][entry[1]]+=entry[2]
    #Get the max and min ranges for colro scaling display
    largest=float('-inf')
    smallest=float('inf')
    for entry in res:
        for key in res[entry]:
            if key>largest:
                largest=key
            if key<smallest:
                smallest=key
    return {'data':res, 'largest':largest, 'smallest':smallest}

#This sets up template auto reloading. So if our html code was 
app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

#Get data for a single year
@app.route("/get")
def get():
    year = int(request.args.get('year'))
    month = int(request.args.get('month'))
    return json.dumps(get_pandas_single(year,month))

#Baselines - these are the averages
@app.route("/baselines")
def baselines():
    tst=conn.execute('select * from tmax_normals_table').fetchall()
    baselines={}
    for item in tst:
        if item[0] not in baselines:
            baselines[item[0]]={}
        baselines[item[0]][item[1]] = item[2]
    return json.dumps(baselines)

# call this with main_url = '/hist?month='+month+'&yearmin='+yearmin+'&yearmax='+yearmax;
#This starts the histogram generation
@app.route("/hist")
def hist():
    y_min = int(request.args.get('yearmin'))
    y_max = int(request.args.get('yearmax'))
    month = int(request.args.get('month'))
    step = int(request.args.get('step'))
    return json.dumps(get_hist_range(y_min, y_max,month,step))

#Home routing
@app.route("/")
def index():
    return render_template("index.html")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

    #url_for('static',filename='us-10m.v1.json')
