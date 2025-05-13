# deepracer-pose-control

## Install

- Python version: `3.12`
- venv
    ```bash
    python -m venv venv
    source venv/Scripts/activate
    ```

- install
    ```bash
    pip install -r requirements.txt
    ```

## Run

- common
    ```bash
    python run.py
    ```

- Linux
    ```bash
    gunicorn --certfile=cert.pem --keyfile=key.pem --bind 0.0.0.0:5000 --worker-class=gevent --threads 4 run:app
    ```

- Window
    ```bash
    waitress-serve --host=0.0.0.0 --port=5000 run:app
    ```

## Etc
    - 인증서 생성
    ```bash
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 36500 -nodes
    ```