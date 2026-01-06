#!/bin/bash

set -e

if [ ! -f .env ]; then
    echo "Ошибка: файл .env не найден"
    echo "Создайте .env файл с переменными:"
    echo "YC_FOLDER_ID, YC_SERVICE_ACCOUNT_ID"
    echo "YDB_ENDPOINT, YDB_REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY"
    echo "JWT_SECRET, S3_BUCKET_NAME"
    exit 1
fi

source .env

required_vars=(
    "YC_FOLDER_ID"
    "YC_SERVICE_ACCOUNT_ID"
    "YDB_ENDPOINT"
    "YDB_REGION"
    "ACCESS_KEY_ID"
    "SECRET_ACCESS_KEY"
    "JWT_SECRET"
    "S3_BUCKET_NAME"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Ошибка: переменная $var не установлена в .env"
        exit 1
    fi
done

if ! command -v jq &> /dev/null; then
    echo "Установка jq..."
    sudo apt-get install -y jq 2>/dev/null || brew install jq 2>/dev/null || echo "Установите jq вручную"
fi

deploy_function() {
    local func_name=$1
    local py_file=$2
    local entrypoint=$3
    
    echo "Деплой функции: $func_name"

    yc serverless function version create \
        --function-name="$func_name" \
        --runtime=python311 \
        --entrypoint="$entrypoint" \
        --memory=128m \
        --execution-timeout=10s \
        --package-path="/tmp/$func_name.zip" \
        --environment \
            "YDB_ENDPOINT=$YDB_ENDPOINT" \
            "YDB_REGION=$YDB_REGION" \
            "ACCESS_KEY_ID=$ACCESS_KEY_ID" \
            "SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY" \
            "JWT_SECRET=$JWT_SECRET" \
            "S3_BUCKET_NAME=$S3_BUCKET_NAME" \
            "S3_ENDPOINT_URL=https://storage.yandexcloud.net" \
            "APP_ENV=production" \
            "CORS_ORIGINS=$CORS_ORIGINS" \
        --service-account-id="$YC_SERVICE_ACCOUNT_ID" \
        --folder-id="$YC_FOLDER_ID"
    
    yc serverless function allow-unauthenticated-invoke "$func_name"
    
    echo "Функция $func_name развернута"
}

    python3 backend/api/create_tables.py

main() {
    echo "Начало деплоя..."
    create_tables

    functions=(
        "echo-get-posts backend/api/get_posts.py get_posts.handler"
        "echo-auth backend/api/auth.py auth.handler"
        "echo-create-post backend/api/create_post.py create_post.handler"
        "echo-like-post backend/api/like_post.py like_post.handler"
        "echo-create-comment backend/api/create_comment.py create_comment.handler"
        "echo-edit-post backend/api/edit_post.py edit_post.handler"
        "echo-delete-post backend/api/delete_post.py delete_post.handler"
    )

    for func_info in "${functions[@]}"; do
        read -r func_name py_file entrypoint <<< "$func_info"
        
        if [ -f "$py_file" ]; then
            deploy_function "$func_name" "$py_file" "$entrypoint"
        else
            echo "Ошибка: файл $py_file не найден"
        fi
    done
    
    echo "Создание API Gateway..."
    yc serverless api-gateway create
    --name echo-api-gateway
    --description "Echo API Gateway"
    --spec=api-gateway.yaml
    --folder-id="$YC_FOLDER_ID"

    echo ""
    echo "Деплой завершен!"
    echo ""
}
main