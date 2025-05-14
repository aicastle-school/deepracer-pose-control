# deepracer-pose-control

## Install
```bash
pip install -r requirements.txt
```

## Setup `.env`
- `VEHICLE_IP`: IP address of the vehicle. (ex: `192.168.1.2`)
- `VEHICLE_PASSWORD`: Password of the vehicle console. (ex: `etbsjmR6`)
- `SSH_PASSWORD`: Password of the vehicle SSH.
  > enable SSH access in the DeepRacer Vehicle Console and set a password in advance. 
- `PORT`: Port for Webserver (default: `5000`)
- `IMAGE_WIDTH`: Width of the image. (default: `320`)
- `IMAGE_HEIGHT`: Height of the image. (default: `240`)


## Init
```bash
python init.py
```
- Modify the `vehicle_control.py` file on the DeepRacer vehicle.
- The default API allows only discrete steering‑angle and speed commands based on threshold values; update it so that continuous angle and speed inputs are accepted.


## Run
```bash
python run.py
```

## Go to the Pose Control Page
- <http://localhost:5000/>
- <http://127.0.0.1:5000/>

> If you are using a different port, change the port in the URL.