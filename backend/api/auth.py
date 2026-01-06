import os
import boto3
import json
import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta

def handler(event, context):
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=os.environ['YDB_ENDPOINT'],
        region_name=os.environ['YDB_REGION'],
        aws_access_key_id=os.environ['ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
    )

    users_table = dynamodb.Table('users')
    data = json.loads(event['body'])

    if event['httpMethod'] == 'POST':
        if 'email' not in data or 'password' not in data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing email or password'})
            }

        try:
            response = users_table.query(
                IndexName='idx_email',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': data['email']}
            )

            if response['Items']:
                return {
                    'statusCode': 409,
                    'body': json.dumps({'error': 'User already exists'})
                }

            user_id = str(uuid.uuid4())
            password_hash = bcrypt.hashpw(
                data['password'].encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

            users_table.put_item(Item={
                'user_id': user_id,
                'email': data['email'],
                'username': data.get('username', data['email'].split('@')[0]),
                'password_hash': password_hash,
                'display_name': data.get('display_name', ''),
                'role': 'user',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'is_active': True
            })

            token = jwt.encode({
                'user_id': user_id,
                'email': data['email'],
                'exp': datetime.utcnow() + timedelta(days=7)
            }, os.environ['JWT_SECRET'], algorithm='HS256')

            return {
                'statusCode': 201,
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user': {
                        'user_id': user_id,
                        'email': data['email']
                    }
                })
            }

        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }

    elif event['httpMethod'] == 'GET' and 'path' in event and event['path'].endswith('/login'):
        try:
            response = users_table.query(
                IndexName='idx_email',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': data['email']}
            )

            if not response['Items']:
                return {
                    'statusCode': 401,
                    'body': json.dumps({'error': 'Invalid credentials'})
                }

            user = response['Items'][0]

            if not bcrypt.checkpw(
                    data['password'].encode('utf-8'),
                    user['password_hash'].encode('utf-8')
            ):
                return {
                    'statusCode': 401,
                    'body': json.dumps({'error': 'Invalid credentials'})
                }

            token = jwt.encode({
                'user_id': user['user_id'],
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(days=7)
            }, os.environ['JWT_SECRET'], algorithm='HS256')

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user': {
                        'user_id': user['user_id'],
                        'email': user['email'],
                        'username': user.get('username')
                    }
                })
            }

        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
