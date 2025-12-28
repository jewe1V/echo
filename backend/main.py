import json
import jwt
from posts_crud import *
from users_crud import *
from likes_crud import *

def handler(event, context):
    """Основной обработчик для Cloud Function"""

    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {})
    body = event.get('body', '{}')

    # Парсим тело запроса
    try:
        body_data = json.loads(body) if body else {}
    except:
        body_data = {}

    # Аутентификация по JWT токену
    current_user = None
    auth_header = headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = get_user_by_id(payload['user_id'])
        except:
            pass

    # Маршрутизация
    response = {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'}),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }

    # Аутентификация
    if path == '/api/auth/login' and http_method == 'POST':
        email = body_data.get('email')
        password = body_data.get('password')

        auth_result = authenticate_user(email, password)
        if auth_result:
            response = {
                'statusCode': 200,
                'body': json.dumps(auth_result)
            }
        else:
            response = {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid credentials'})
            }

    # Регистрация
    elif path == '/api/auth/register' and http_method == 'POST':
        try:
            user = create_user(
                username=body_data.get('username'),
                email=body_data.get('email'),
                password=body_data.get('password'),
                display_name=body_data.get('display_name')
            )

            if user:
                user.pop('password_hash', None)
                response = {
                    'statusCode': 201,
                    'body': json.dumps(user)
                }
            else:
                response = {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'User creation failed'})
                }
        except Exception as e:
            response = {
                'statusCode': 400,
                'body': json.dumps({'error': str(e)})
            }

    # Получение постов
    elif path == '/api/posts' and http_method == 'GET':
        page = int(query_params.get('page', 1))
        limit = int(query_params.get('limit', 10))

        posts_result = get_posts(page=page, limit=limit)
        response = {
            'statusCode': 200,
            'body': json.dumps(posts_result)
        }

    # Получение одного поста
    elif path.startswith('/api/posts/') and http_method == 'GET':
        post_id = path.split('/')[-1]
        user_id = current_user['user_id'] if current_user else None

        post = get_post_with_likes(post_id, user_id)

        if post:
            response = {
                'statusCode': 200,
                'body': json.dumps(post)
            }
        else:
            response = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Post not found'})
            }

    # Создание поста (только для админов)
    elif path == '/api/posts' and http_method == 'POST':
        if not current_user or current_user.get('role') != 'admin':
            response = {
                'statusCode': 403,
                'body': json.dumps({'error': 'Forbidden'})
            }
        else:
            post = create_post(
                title=body_data.get('title'),
                content=body_data.get('content'),
                author_id=current_user['user_id'],
                image_path=body_data.get('image_path'),
                status=body_data.get('status', 'draft'),
                excerpt=body_data.get('excerpt')
            )

            if post:
                response = {
                    'statusCode': 201,
                    'body': json.dumps(post)
                }

    # Лайк поста
    elif path.endswith('/like') and http_method == 'POST':
        if not current_user:
            response = {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        else:
            post_id = path.split('/')[-2]

            try:
                result = like_post(post_id, current_user['user_id'])
                response = {
                    'statusCode': 200,
                    'body': json.dumps(result)
                }
            except Exception as e:
                response = {
                    'statusCode': 400,
                    'body': json.dumps({'error': str(e)})
                }

    # Удаление лайка
    elif path.endswith('/like') and http_method == 'DELETE':
        if not current_user:
            response = {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        else:
            post_id = path.split('/')[-2]

            try:
                result = unlike_post(post_id, current_user['user_id'])
                response = {
                    'statusCode': 200,
                    'body': json.dumps(result)
                }
            except Exception as e:
                response = {
                    'statusCode': 400,
                    'body': json.dumps({'error': str(e)})
                }

    return response
