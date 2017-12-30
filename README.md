## README

#### Barebones requirements
Flask, numpy

You will also need the [`noaa.db`](https://gtvault-my.sharepoint.com/personal/afnu6_gatech_edu/_layouts/15/guestaccess.aspx?docid=018e33e43eb2941688735ad64dea60866&authkey=Ac1rlH7-YAOiHIRidJhRaZ0&e=2b25118ec3f74e8ba1f3911b9b8e0c4c) database file. This is a ~400MB file containing the date data used in the app. `noaa.db` should be kept in the root directory, i..e where this `README` resides.

#### Barebones running
For a barebones running, we will use the server bundled with Flask. Note that for production, a uWSGI server, preferably with a configured **nginx** proxy is useful. Production implementation is not covered here.

Ensure **Flask** and **numpy** are setup within the appropriate virtual environment (recommended to prevent global python pollution). 

Enter root directory (where this `README` resides), and enter:

    > $ python index.py

Flask will let you know which port the website is loaded to.
