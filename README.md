# DeepRacer Pose Control

웹캠을 통한 실시간 포즈 인식으로 AWS DeepRacer를 제어하는 웹 기반 시스템입니다. 컴퓨터 비전과 머신러닝을 결합하여 몸짓으로 DeepRacer를 핸즈프리로 조종할 수 있습니다.

![pose example](pose_example.png)


**주요 기능:**
- **포즈 기반 제어**: Teachable Machine 포즈 인식 모델을 사용하여 몸짓 인식 (전진, 좌회전, 우회전, 정지)
- **실시간 영상 스트리밍**: DeepRacer 전방 카메라의 라이브 피드 (MJPEG 스트리밍)
- 스켈레톤 시각화가 포함된 라이브 포즈 인식 캔버스
- 제스처 신뢰도를 표시하는 실시간 예측 차트
- 속도/각도 표시기가 있는 차량 카메라 스트림

## 사용 방법

### 1. DeepRacer 차량 설정

DeepRacer 차량에 SSH로 접속한 후 다음 명령을 실행하세요:

```bash
cd ~ && git clone https://github.com/aicastle-school/deepracer-pose-control.git && bash deepracer-pose-control/deepracer/apply_modifications.sh
```

이 스크립트는 다음 작업을 수행합니다:
- 필요한 파일 권한 설정 (`chmod.sh` 실행)
- `modified` 폴더의 파일들을 시스템 경로에 덮어쓰기
- nginx 및 DeepRacer 서비스 재시작

**원래 상태로 복원:**

```bash
bash ~/deepracer-pose-control/deepracer/restore_original.sh
```

### 2. 클라이언트 사용

1. 웹 브라우저에서 <https://aicastle-school.github.io/deepracer-pose-control/> 접속
2. IP 주소 입력란에 DeepRacer의 IP 주소 입력
3. 웹캠 권한 허용
4. 포즈를 취하여 DeepRacer 제어

**제어 방법:**
- **전진**: 양팔을 위로
- **좌회전**: 왼팔을 옆으로
- **우회전**: 오른팔을 옆으로
- **정지**: 기본 자세 (NONE)
