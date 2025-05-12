from flask import (
    Flask, 
    render_template,
    request,
    # send_from_directory,
    # redirect,
    # url_for,
)
import os
from dotenv import load_dotenv
load_dotenv(".env")

from aicastle.deepracer.vehicle.api.client import VehicleClient

vehicle =VehicleClient(
    ip=os.getenv("VEHICLE_IP"),
    password=os.getenv("VEHICLE_PASSWORD"),
    ssh_module_update=True,
    ssh_module_update_custom=True,
    ssh_password=os.getenv("SSH_PASSWORD"),
)



app = Flask(
    __name__,
    template_folder=os.path.expanduser("templates"),
    static_folder=os.path.expanduser("static"),
    static_url_path="/",
)


@app.get("/")
def index():
    return render_template("index.html")


@app.put("/update-data")
def update_data():
    if not (data := request.get_json(silent=True)):
        return {"error": "No JSON data provided"}, 400


    return {"message": "Data updated successfully", "data": data}, 200


######### run ###########
if __name__ == "__main__":
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.run(
        host="0.0.0.0", 
        port=os.getenv("PORT", 5000), 
        use_reloader=True,
        use_debugger=False,
        # debug=True,
    )
