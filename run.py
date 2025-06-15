from flask import (
    Flask, 
    render_template,
    request,
    Response,
    stream_with_context,
    copy_current_request_context,
    send_from_directory,
    # redirect,
    # url_for,
)
import cv2
import os
from dotenv import load_dotenv
load_dotenv(".env")

import signal
signal.signal(signal.SIGINT, lambda sig, frame: os._exit(0))



from aicastle.deepracer.vehicle.api.client import VehicleClient
try:
    vehicle =VehicleClient(
        ip=os.getenv("VEHICLE_IP"),
        password=os.getenv("VEHICLE_PASSWORD"),
        width=os.getenv("IMAGE_WIDTH", 480),
        height=os.getenv("IMAGE_HEIGHT", 360),
    )
    print("Successfully connected to vehicle")
except Exception as e:
    vehicle = None
    print("Error connecting to vehicle:", e)


##################### app #####################
app = Flask(
    __name__,
    template_folder=os.path.expanduser("."),
    static_folder=os.path.expanduser("."),
    static_url_path="/",
)


@app.get("/")
def index():
    return render_template("index.html")

if vehicle:
    @app.route('/camera.jpg')
    def video_stream():
        @copy_current_request_context
        def generate_frames():
            while True:
                frame = vehicle.frame_queue[-1]
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        return Response(stream_with_context(generate_frames()), mimetype='multipart/x-mixed-replace; boundary=frame')

    @app.put('/speed_percent')
    def set_speed_percent():
        if not (data := request.get_json(silent=True)):
            return {"error": "No JSON data provided"}, 400
        print(f"/speed_percent: {data}")
        
        if vehicle:
            speed_percent = int(data.get("speed_percent"))
            vehicle.set_speed_percent(speed_percent)
            return {"message": "Speed updated successfully", "speed_percent": speed_percent}, 200
        else:
            return {"error": "Vehicle not connected"}, 500

    @app.put("/move")
    def move():
        if not (data := request.get_json(silent=True)):
            return {"error": "No JSON data provided"}, 400
        print(f"/move: {data}")
        if vehicle:
            vehicle.move(
                angle=float(data.get("angle")), 
                speed=float(data.get("speed"))
            )
            return {"message": "Data updated successfully", "data": data}, 200
        else:
            return {"error": "Vehicle not connected"}, 500

    @app.put("/stop")
    def stop():
        print("/stop")
        if vehicle:
            vehicle.stop()
            return {"message": "Vehicle stopped successfully"}, 200
        else:
            return {"error": "Vehicle not connected"}, 500

else:
    print("Vehicle not connected, skipping video stream and control routes.")

######### run ###########
app.config.update(
    TEMPLATES_AUTO_RELOAD=True,
)
app.run(
    host="0.0.0.0", 
    port=os.getenv("PORT", 5000), 
    use_reloader=True,
    use_debugger=False,
    # debug=True,
)
