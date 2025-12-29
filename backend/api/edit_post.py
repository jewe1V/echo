import os
import boto3
import json
import jwt
import re
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def slugify(text: str) -> str:
    """Генерация slug из текста."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def get_token_payload(auth_header: str) -> Optional[Dict]:
    """Извлечение и валидация JWT токена."""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        token = auth_header.split(' ')[1]
        return jwt.decode(
            token,
            os.environ.get('JWT_SECRET'),
            algorithms=['HS256']
        )
    except:
        return None

def create_response(status_code: int, body: Dict, headers: Optional[Dict] = None) -> Dict:
    """Создание стандартизированного HTTP ответа."""
    base_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    if headers:
        base_headers.update(headers)
    return {
        'statusCode': status_code,
        'headers': base_headers,
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def parse_request_body(body: Any) -> Dict:
    """Парсинг тела запроса с обработкой ошибок."""
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            raise ValueError('Неверный формат JSON')
    return body if isinstance(body, dict) else {}

def build_update_expression(data: Dict, current_time: datetime) -> Dict:
    """Построение выражений для DynamoDB Update."""
    updatable_fields = {
        'title': data.get('title'),
        'text': data.get('text'),
        'imgUrl': data.get('imgUrl'),
        'status': data.get('status'),
        'slug': data.get('slug')
    }

    # Автогенерация slug если есть title
    if updatable_fields['title'] and not updatable_fields['slug']:
        updatable_fields['slug'] = slugify(updatable_fields['title'])

    update_parts = []
    attr_names = {}
    attr_values = {}

    for i, (field, value) in enumerate(updatable_fields.items(), 1):
        if value is not None:
            update_parts.append(f"#{field} = :val{i}")
            attr_names[f"#{field}"] = field
            attr_values[f":val{i}"] = str(value).strip()

    if not update_parts:
        raise ValueError('Нет полей для обновления')

    # Добавляем время обновления
    update_parts.append("#updated_at = :updated_at")
    attr_names["#updated_at"] = "updated_at"
    attr_values[":updated_at"] = current_time.isoformat()

    return {
        'expression': "SET " + ", ".join(update_parts),
        'names': attr_names,
        'values': attr_values
    }

def handler(event, context):
    """Обработчик редактирования поста."""
    # Инициализация DynamoDB с использованием переменных окружения
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=os.environ['YDB_ENDPOINT'],
        region_name=os.environ['YDB_REGION'],
        aws_access_key_id=os.environ['ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
    )

    posts_table = dynamodb.Table('posts')

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')

        if not (payload := get_token_payload(auth_header)) or not (user_id := payload.get('user_id')):
            return create_response(401, {'success': False, 'error': 'Требуется авторизация'})

        # Парсинг запроса
        try:
            data = parse_request_body(event.get('body', '{}'))
        except ValueError as e:
            return create_response(400, {'success': False, 'error': str(e)})

        # Валидация post_id
        if not (post_id := data.get('post_id', '').strip()):
            return create_response(400, {'success': False, 'error': 'Отсутствует post_id'})

        # Проверка прав доступа
        try:
            post = posts_table.get_item(
                Key={'post_id': post_id},
                AttributesToGet=['post_id', 'author_id', 'status']
            ).get('Item')

            if not post:
                return create_response(404, {'success': False, 'error': 'Пост не найден'})

            if post['author_id'] != user_id:
                return create_response(403, {
                    'success': False,
                    'error': 'Только автор может редактировать пост'
                })

        except Exception as e:
            return create_response(500, {'success': False, 'error': 'Ошибка при проверке поста'})

        # Подготовка обновления
        current_time = datetime.utcnow()
        try:
            update_config = build_update_expression(data, current_time)
        except ValueError as e:
            return create_response(400, {'success': False, 'error': str(e)})

        # Выполнение обновления
        try:
            response = posts_table.update_item(
                Key={'post_id': post_id},
                UpdateExpression=update_config['expression'],
                ExpressionAttributeNames=update_config['names'],
                ExpressionAttributeValues=update_config['values'],
                ReturnValues='ALL_NEW'
            )

            updated_post = response.get('Attributes', {})

            return create_response(200, {
                'success': True,
                'message': 'Пост успешно обновлен',
                'post': updated_post
            })

        except Exception as e:
            return create_response(500, {
                'success': False,
                'error': f'Ошибка при обновлении поста: {str(e)}'
            })

    except Exception as e:
        return create_response(500, {
            'success': False,
        })
