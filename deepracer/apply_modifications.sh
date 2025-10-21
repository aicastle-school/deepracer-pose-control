#!/bin/bash

# DeepRacer Pose Control - Apply Modifications
# 이 스크립트는 포즈 컨트롤을 사용하기 위해 DeepRacer 차량의 파일을 수정합니다.
# ⚠️  주의: 이 스크립트는 DeepRacer 차량에서 실행해야 합니다.
# GitHub: https://github.com/aicastle-school/deepracer-pose-control

set -e

echo "=========================================="
echo "DeepRacer Pose Control - 수정 사항 적용"
echo "=========================================="
echo ""

# 현재 스크립트 위치 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODIFIED_DIR="$SCRIPT_DIR/modified"

# 수정 사항이 있는지 확인
if [ ! -d "$MODIFIED_DIR" ]; then
    echo "❌ 오류: modified 폴더를 찾을 수 없습니다."
    echo "   위치: $MODIFIED_DIR"
    exit 1
fi

echo "📂 수정할 파일 경로: $MODIFIED_DIR"
echo ""

# 권한 설정 스크립트 실행
if [ -f "$SCRIPT_DIR/chmod.sh" ]; then
    echo "🔐 권한 설정 중..."
    bash "$SCRIPT_DIR/chmod.sh"
    echo ""
fi

echo "📝 수정 사항 적용 중..."
echo ""

# modified 폴더 내의 모든 파일을 찾아서 처리
cd "$MODIFIED_DIR"
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
echo "✅ 모든 파일 수정 완료!"
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
echo "✅ 수정 사항 적용 완료!"
echo "=========================================="
echo ""