import os
import boto3
import json
import jwt
from datetime import datetime, timedelta

def handler(event, context):
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
        auth_header = headers.get('Authorization', headers.get('authorization', ''))

        if not auth_header or not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Требуется авторизация'})
            }

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                os.environ.get('JWT_SECRET', 'V4fy5zy070veLOC28z9cNg4FvviK9Mc/prHJyL0b/3s='),
                algorithms=['HS256']
            )
            user_id = payload.get('user_id')
            user_role = payload.get('role', 'user')

            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Неверный токен'})
                }

        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Неверный или истекший токен'})
            }

        query_params = event.get('queryStringParameters', {}) or {}
        post_id = query_params.get('post_id')

        if not post_id:
            body = event.get('body', '{}')
            if isinstance(body, str):
                try:
                    data = json.loads(body)
                    post_id = data.get('post_id')
                except:
                    pass

        if not post_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Отсутствует post_id'})
            }

        try:
            post_response = posts_table.get_item(
                Key={'post_id': post_id},
                AttributesToGet=['post_id', 'author_id', 'is_deleted']
            )

            if 'Item' not in post_response:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Пост не найден'})
                }

            post = post_response['Item']

            # Проверка прав
            is_author = post['author_id'] == user_id
            is_admin = user_role == 'admin'

            if not (is_author or is_admin):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Только автор или администратор может удалить пост'
                    })
                }

            # Проверяем, не удален ли уже пост
            if post.get('is_deleted'):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Пост уже удален'
                    })
                }

        except Exception as e:
            print(f"Ошибка при проверке поста: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Ошибка при проверке поста'})
            }

        # Мягкое удаление (помечаем как удаленный)
        try:
            current_time = datetime.utcnow()
            deleted_at = current_time.isoformat()

            # Устанавливаем дату автоматического полного удаления (через 30 дней)
            permanent_delete_at = (current_time + timedelta(days=30)).isoformat()

            update_response = posts_table.update_item(
                Key={'post_id': post_id},
                UpdateExpression="""
                    SET is_deleted = :deleted,
                        deleted_at = :deleted_at,
                        deleted_by = :deleted_by,
                        permanent_delete_at = :permanent_delete_at,
                        status = :status,
                        updated_at = :updated_at
                """,
                ExpressionAttributeValues={
                    ':deleted': True,
                    ':deleted_at': deleted_at,
                    ':deleted_by': user_id,
                    ':permanent_delete_at': permanent_delete_at,
                    ':status': 'deleted',
                    ':updated_at': current_time.isoformat()
                },
                ReturnValues='ALL_NEW'
            )

            updated_post = update_response.get('Attributes', {})

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Пост помечен как удаленный. Полное удаление через 30 дней.',
                    'post': updated_post,
                    'permanent_delete_date': permanent_delete_at
                })
            }

        except Exception as e:
            print(f"Ошибка при мягком удалении поста: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': f'Ошибка при удалении поста: {str(e)}'
                })
            }

    except Exception as e:
        print(f"Необработанная ошибка: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'error': 'Внутренняя ошибка сервера'
            })
        }
