
- nginx 권한 변경
```
# nginx 파일 변경 권한
sudo chmod 666 /etc/nginx/nginx.conf /etc/nginx/sites-available/default

# 프로젝트 폴더 변경 권한
sudo chown -R deepracer:deepracer /opt/aws/deepracer

# deepracer-core를 sudo 없이 실행 권한
echo 'www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart deepracer-core' | sudo tee /etc/sudoers.d/deepracer-restart
sudo chmod 440 /etc/sudoers.d/deepracer-restart && sudo visudo -c
```

- 