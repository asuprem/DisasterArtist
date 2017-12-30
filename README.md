## README

#### Barebones requirements
Flask, numpy

#### Barebones running
For a barebones running, we will use the server bundled with Flask. Note that for production, a uWSGI server, preferably with a configured nginx proxy is useful. Production implementation is not covered here.

Ensure Flask and numpy are setup within the appropriate virtual environment (recommended to prevent global python pollution). 

Enter root directory (where this `README` resides), and enter:

    > $ python index.py

Flask will let you know which port the website is loaded to.
