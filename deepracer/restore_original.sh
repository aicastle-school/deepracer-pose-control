#!/bin/bash

# DeepRacer Pose Control - Restore Original Files
# 이 스크립트는 DeepRacer 차량의 파일을 원래 상태로 복원합니다.
# ⚠️  주의: 이 스크립트는 DeepRacer 차량에서 실행해야 합니다.
# GitHub: https://github.com/aicastle-school/deepracer-pose-control

set -e

echo "=========================================="
echo "DeepRacer Pose Control - 원본 파일 복원"
echo "=========================================="
echo ""

# 현재 스크립트 위치 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORIGIN_DIR="$SCRIPT_DIR/origin"

# 원본 파일이 있는지 확인
if [ ! -d "$ORIGIN_DIR" ]; then
    echo "❌ 오류: origin 폴더를 찾을 수 없습니다."
    echo "   위치: $ORIGIN_DIR"
    exit 1
fi

echo "📂 원본 파일 경로: $ORIGIN_DIR"
echo ""
echo " 원본 파일 복원 중..."
echo ""

# origin 폴더 내의 모든 파일을 찾아서 처리
cd "$ORIGIN_DIR"
find . -type f | while read -r file; do
    # 상대 경로에서 ./ 제거
    relative_path="${file#./}"
    # 절대 경로 생성
    target_path="/$relative_path"
    
    # 대상 디렉토리 생성
    target_dir="$(dirname "$target_path")"
    if [ ! -d "$target_dir" ]; then
        sudo mkdir -p "$target_dir"
    fi
    
    # 파일 복사
    echo "  ✓ $target_path"
    sudo cp "$file" "$target_path"
done

cd "$SCRIPT_DIR"

echo ""
echo "✅ 모든 파일 복원 완료!"
echo ""
echo "🔄 서비스 재시작 중..."

# nginx 재시작
sudo systemctl restart nginx
echo "  ✓ nginx 재시작 완료"

# webserver 관련 서비스 재시작 (DeepRacer 서비스명에 따라 다를 수 있음)
if systemctl list-units --full -all | grep -Fq "deepracer-core.service"; then
    sudo systemctl restart deepracer-core
    echo "  ✓ deepracer-core 재시작 완료"
fi

if systemctl list-units --full -all | grep -Fq "deepracer-webserver.service"; then
    sudo systemctl restart deepracer-webserver
    echo "  ✓ deepracer-webserver 재시작 완료"
fi

echo ""
echo "=========================================="
echo "✅ 원본 파일 복원 완료!"
echo "=========================================="
echo ""
