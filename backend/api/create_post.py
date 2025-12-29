import os
import boto3
import json
import jwt
import uuid
import re
from datetime import datetime

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def handler(event, context):
    auth_header = event.get('headers', {}).get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Authorization required'})
        }

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
    except:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Invalid token'})
        }

    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=os.environ['YDB_ENDPOINT'],
        region_name=os.environ['YDB_REGION'],
        aws_access_key_id=context.token['access_key_id'],
        aws_secret_access_key=context.token['secret_access_key']
    )

    posts_table = dynamodb.Table('posts')
    data = json.loads(event['body'])

    try:
        post_id = str(uuid.uuid4())
        slug = data.get('slug') or slugify(data['title'])

        post_item = {
            'post_id': post_id,
            'title': data['title'],
            'text': data.get('text', ''),
            'imgUrl': data.get('imgUrl', ''),
            'slug': slug,
            'status': data.get('status', 'draft'),
            'author_id': payload['user_id'],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'views_count': 0,
            'likes_count': 0
        }

        posts_table.put_item(Item=post_item)

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'post': post_item
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
