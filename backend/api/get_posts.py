import os
import boto3
import json
from decimal import Decimal
from datetime import datetime

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def get_comments_for_posts(dynamodb, post_ids, limit_per_post=5):
    """Получаем комментарии для списка постов"""
    if not post_ids:
        return {}

    comments_table = dynamodb.Table('comments')
    comments_by_post = {}

    try:
        # Получаем комментарии для всех постов
        for post_id in post_ids:
            response = comments_table.query(
                IndexName='idx_comments_post',
                KeyConditionExpression='post_id = :post_id',
                ExpressionAttributeValues={':post_id': post_id},
                Limit=limit_per_post,
                ScanIndexForward=False  # Сначала новые комментарии
            )
            comments_by_post[post_id] = response.get('Items', [])

            # Получаем количество всех комментариев для поста
            count_response = comments_table.query(
                IndexName='idx_comments_post',
                KeyConditionExpression='post_id = :post_id',
                ExpressionAttributeValues={':post_id': post_id},
                Select='COUNT'
            )
            comments_by_post[post_id + '_total'] = count_response.get('Count', 0)

    except Exception as e:
        print(f"Ошибка при получении комментариев: {e}")

    return comments_by_post

def get_likes_info_for_posts(dynamodb, post_ids, user_id=None):
    """Получаем информацию о лайках для постов"""
    if not post_ids:
        return {}, {}

    likes_table = dynamodb.Table('post_likes')
    likes_by_post = {}
    user_likes = set()

    try:
        # Получаем количество лайков для каждого поста
        for post_id in post_ids:
            # Используем индекс idx_post для подсчета лайков
            response = likes_table.query(
                KeyConditionExpression='post_id = :post_id',
                ExpressionAttributeValues={':post_id': post_id},
                Select='COUNT'
            )
            likes_by_post[post_id] = response.get('Count', 0)

        # Если пользователь авторизован, проверяем его лайки
        if user_id:
            response = likes_table.query(
                IndexName='idx_user',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            user_likes = {item['post_id'] for item in response.get('Items', [])}

    except Exception as e:
        print(f"Ошибка при получении лайков: {e}")

    return likes_by_post, user_likes

def get_author_info(dynamodb, author_ids):
    """Получаем информацию об авторах"""
    if not author_ids:
        return {}

    users_table = dynamodb.Table('users')
    authors_by_id = {}

    # Убираем дубликаты
    unique_author_ids = list(set(author_ids))

    try:
        # Получаем информацию об авторах
        for author_id in unique_author_ids:
            response = users_table.get_item(
                Key={'user_id': author_id}
            )
            if 'Item' in response:
                user = response['Item']
                # Возвращаем только нужные поля
                authors_by_id[author_id] = {
                    'user_id': user.get('user_id'),
                    'username': user.get('username'),
                    'display_name': user.get('display_name', ''),
                    'avatar_url': user.get('avatar_url', '')
                }
    except Exception as e:
        print(f"Ошибка при получении информации об авторе: {e}")

    return authors_by_id

def handler(event, context):
    # Прямое подключение к YDB
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=os.environ['YDB_ENDPOINT'],
        region_name=os.environ['YDB_REGION'],
        aws_access_key_id=os.environ['ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
    )

    posts_table = dynamodb.Table('posts')

    try:
        # Получаем параметры запроса
        query_params = event.get('queryStringParameters', {}) or {}
        headers = event.get('headers', {})

        # Основные параметры
        author_id = query_params.get('author_id')
        limit = min(int(query_params.get('limit', 20)), 100)
        status = query_params.get('status', 'published')
        include_comments = query_params.get('include_comments', 'true').lower() == 'true'
        comments_limit = int(query_params.get('comments_limit', 3))  # Кол-во комментариев на пост
        include_author = query_params.get('include_author', 'true').lower() == 'true'

        # Получаем user_id из токена (если есть)
        user_id = None
        auth_header = headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            # Здесь можно распарсить JWT токен для получения user_id
            # Пока оставляем заглушку
            pass

        # Обработка ключа пагинации
        last_key = None
        last_key_str = query_params.get('last_key')
        if last_key_str:
            try:
                last_key = json.loads(last_key_str)
            except:
                pass

        # Получаем посты
        if author_id:
            # Посты конкретного автора
            query_kwargs = {
                'IndexName': 'idx_author',
                'KeyConditionExpression': 'author_id = :author_id',
                'FilterExpression': '#status = :status',
                'ExpressionAttributeNames': {'#status': 'status'},
                'ExpressionAttributeValues': {
                    ':author_id': author_id,
                    ':status': status
                },
                'Limit': limit,
                'ScanIndexForward': False,
                'ReturnConsumedCapacity': 'TOTAL'
            }

            if last_key:
                query_kwargs['ExclusiveStartKey'] = last_key

            response = posts_table.query(**query_kwargs)
        else:
            # Все посты
            scan_kwargs = {
                'Limit': limit,
                'FilterExpression': '#status = :status',
                'ExpressionAttributeNames': {'#status': 'status'},
                'ExpressionAttributeValues': {':status': status},
                'ReturnConsumedCapacity': 'TOTAL'
            }

            if last_key:
                scan_kwargs['ExclusiveStartKey'] = last_key

            response = posts_table.scan(**scan_kwargs)
            posts = response.get('Items', [])
            if posts:
                posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        posts = response.get('Items', [])

        # Подготавливаем дополнительные данные
        post_ids = [post['post_id'] for post in posts]
        author_ids = list(set([post['author_id'] for post in posts]))

        # Получаем дополнительные данные если нужно
        comments_by_post = {}
        likes_by_post = {}
        user_likes = set()
        authors_by_id = {}

        if posts:
            if include_comments:
                comments_by_post = get_comments_for_posts(dynamodb, post_ids, comments_limit)

            likes_by_post, user_likes = get_likes_info_for_posts(dynamodb, post_ids, user_id)

            if include_author:
                authors_by_id = get_author_info(dynamodb, author_ids)

        # Обогащаем посты дополнительными данными
        enriched_posts = []
        for post in posts:
            enriched_post = post.copy()

            # Добавляем комментарии
            if include_comments:
                enriched_post['recent_comments'] = comments_by_post.get(post['post_id'], [])
                enriched_post['comments_count'] = comments_by_post.get(post['post_id'] + '_total', 0)

            # Добавляем информацию о лайках
            enriched_post['likes_count'] = likes_by_post.get(post['post_id'], 0)
            enriched_post['is_liked'] = post['post_id'] in user_likes

            # Добавляем информацию об авторе
            if include_author:
                enriched_post['author_info'] = authors_by_id.get(post['author_id'], {
                    'user_id': post['author_id'],
                    'username': 'Неизвестный автор',
                    'display_name': 'Неизвестный автор'
                })

            enriched_posts.append(enriched_post)

        # Формируем метаданные для пагинации
        last_evaluated_key = response.get('LastEvaluatedKey')

        response_data = {
            'success': True,
            'meta': {
                'count': len(enriched_posts),
                'has_more': bool(last_evaluated_key),
                'limit': limit,
                'author_id': author_id,
                'status': status,
                'include_comments': include_comments,
                'include_author': include_author,
                'total_scanned': response.get('ScannedCount', 0),
                'consumed_capacity': response.get('ConsumedCapacity', {})
            },
            'data': enriched_posts
        }

        if last_evaluated_key:
            response_data['meta']['next_key'] = json.dumps(last_evaluated_key, cls=DecimalEncoder)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=30' if not user_id else 'no-cache'
            },
            'body': json.dumps(response_data, cls=DecimalEncoder)
        }

    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'error': 'Неверные параметры запроса',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f"Ошибка в get_posts: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'message': 'Ошибка при получении постов'
            })
        }
