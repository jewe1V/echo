import os
import boto3
import json
import jwt
from datetime import datetime
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        return int(obj) if isinstance(obj, Decimal) else super().default(obj)

def get_user_from_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        return jwt.decode(
            auth_header.split(' ')[1],
            os.environ['JWT_SECRET'],
            algorithms=['HS256']
        )
    except:
        return None

def handler(event, context):
    if not (payload := get_user_from_token(event.get('headers', {}).get('Authorization'))):
        return {'statusCode': 401, 'body': json.dumps({'error': 'Invalid token'})}

    dynamodb = boto3.resource('dynamodb',
                              endpoint_url=os.environ['YDB_ENDPOINT'],
                              region_name=os.environ['YDB_REGION'],
                              aws_access_key_id=os.environ['ACCESS_KEY_ID'],
                              aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
                              )

    posts_table = dynamodb.Table('posts')
    likes_table = dynamodb.Table('post_likes')

    try:
        data = json.loads(event['body'])
        post_id = data['post_id']
        user_id = payload['user_id']

        key = {'post_id': post_id, 'user_id': user_id}
        existing = likes_table.get_item(Key=key).get('Item')

        if existing:
            likes_table.delete_item(Key=key)
            update_expr = 'SET likes_count = likes_count - :val'
            action = 'unliked'
        else:
            likes_table.put_item(Item={
                'post_id': post_id,
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat()
            })
            update_expr = 'SET likes_count = likes_count + :val'
            action = 'liked'

        posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues={':val': 1},
            ReturnValues='UPDATED_NEW'
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'success': True, 'action': action})
        }

    except KeyError:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Missing post_id'})}
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
