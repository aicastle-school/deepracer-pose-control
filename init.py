import os
from dotenv import load_dotenv
from aicastle.deepracer.vehicle.api.client import VehicleClient
load_dotenv(".env")

vehicle =VehicleClient(
    ip=os.getenv("VEHICLE_IP"),
    password=os.getenv("VEHICLE_PASSWORD"),
    ssh_module_update=True,
    ssh_module_update_custom=True,
    # ssh_password='DeepRacer111!!!',
)