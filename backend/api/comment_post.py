import os
import boto3
import json
import jwt
import uuid
from datetime import datetime
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def get_token_payload(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        return jwt.decode(
            auth_header.split(' ')[1],
            os.environ.get('JWT_SECRET'),
            algorithms=['HS256']
        )
    except:
        return None

def create_response(status_code, body, headers=None):
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

def handler(event):
    dynamodb = boto3.resource('dynamodb',
                              endpoint_url=os.environ['YDB_ENDPOINT'],
                              region_name=os.environ['YDB_REGION'],
                              aws_access_key_id=os.environ['ACCESS_KEY_ID'],
                              aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
                              )

    comments_table = dynamodb.Table('comments')
    posts_table = dynamodb.Table('posts')
    users_table = dynamodb.Table('users')
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')

    if not (payload := get_token_payload(auth_header)) or not (user_id := payload.get('user_id')):
        return create_response(401, {'success': False, 'error': 'Неверный токен'})

    try:
        body = event.get('body', '{}')
        data = json.loads(body) if isinstance(body, str) else body
    except:
        return create_response(400, {'success': False, 'error': 'Неверный формат JSON'})

    post_id = data.get('post_id', '').strip()
    text = data.get('text', '').strip()

    if not post_id or not text:
        return create_response(400, {
            'success': False,
            'error': 'Отсутствуют обязательные поля: post_id, text'
        })

    if len(text) > 5000:
        return create_response(400, {
            'success': False,
            'error': 'Комментарий слишком длинный (максимум 5000 символов)'
        })

    try:
        post = posts_table.get_item(
            Key={'post_id': post_id},
            AttributesToGet=['post_id', 'author_id', 'status', 'title']
        ).get('Item')

        if not post or post.get('status') != 'published':
            return create_response(404, {
                'success': False,
                'error': 'Пост не найден или не опубликован'
            })
    except Exception as e:
        return create_response(500, {'success': False, 'error': 'Ошибка при проверке поста'})

    try:
        user = users_table.get_item(
            Key={'user_id': user_id},
            AttributesToGet=['user_id', 'username', 'display_name', 'is_active']
        ).get('Item')

        if not user or not user.get('is_active', True):
            return create_response(403, {
                'success': False,
                'error': 'Пользователь не найден или деактивирован'
            })
    except:
        user = {}

    parent_comment_id = data.get('parent_comment_id')
    if parent_comment_id:
        try:
            parent_comment = comments_table.get_item(
                Key={'comment_id': parent_comment_id}
            ).get('Item')

            if not parent_comment or parent_comment['post_id'] != post_id:
                return create_response(400, {
                    'success': False,
                    'error': 'Родительский комментарий не найден'
                })
        except:
            return create_response(500, {
                'success': False,
                'error': 'Ошибка при проверке родительского комментария'
            })

    comment_id = str(uuid.uuid4())
    current_time = datetime.utcnow()

    comment_data = {
        'comment_id': comment_id,
        'post_id': post_id,
        'user_id': user_id,
        'text': text,
        'created_at': current_time.isoformat(),
        'updated_at': current_time.isoformat(),
        'is_active': True
    }

    if parent_comment_id:
        comment_data['parent_comment_id'] = parent_comment_id

    try:
        comments_table.put_item(Item=comment_data)

        posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression='SET comments_count = if_not_exists(comments_count, :zero) + :inc',
            ExpressionAttributeValues={':inc': 1, ':zero': 0}
        )

        response_comment = {
            'comment_id': comment_id,
            'post_id': post_id,
            'user_id': user_id,
            'text': text,
            'created_at': comment_data['created_at'],
            'author_info': {
                'user_id': user_id,
                'username': user.get('username', ''),
                'display_name': user.get('display_name', '')
            }
        }

        if parent_comment_id:
            response_comment['parent_comment_id'] = parent_comment_id

        return create_response(201, {
            'success': Tr
        })

    except Exception as e:
        return create_response(500, {
            'success': False,
            'error': f'Ошибка при сохранении комментария'
        })
