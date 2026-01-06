import os
import boto3
import json
import jwt
import uuid
import re
import base64
from datetime import datetime
from urllib.parse import urlparse

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def upload_to_s3(base64_data, filename):
    if 'base64,' in base64_data:
        base64_data = base64_data.split('base64,')[1]
    
    image_bytes = base64.b64decode(base64_data)
    
    if len(image_bytes) > 10 * 1024 * 1024:
        raise ValueError("Изображение слишком большое (максимум 10MB)")
    
    s3 = boto3.client(
        's3',
        endpoint_url=os.environ['BUCKET_ENDPOINT'],
        region_name='YDB_REGION',
        aws_access_key_id=os.environ.get('S3_ACCESS_KEY'),
        aws_secret_access_key=os.environ.get('S3_SECRET_KEY')
    )
    
    mime_type = 'image/jpeg'
    if base64_data.startswith('iVBORw0KGgo'):
        mime_type = 'image/png'
    elif base64_data.startswith('/9j/'):
        mime_type = 'image/jpeg'
    elif base64_data.startswith('R0lGOD'):
        mime_type = 'image/gif'

    ext_map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp'
    }
    extension = ext_map.get(mime_type, '.jpg')

    s3_filename = f"posts/{uuid.uuid4()}{extension}"

    s3.put_object(
        Bucket=os.environ.get('S3_BUCKET_NAME', 'echo-bucket-images'),
        Key=s3_filename,
        Body=image_bytes,
        ContentType=mime_type,
        ACL='public-read'
    )

    return f"https://storage.yandexcloud.net/{os.environ.get('S3_BUCKET_NAME')}/{s3_filename}"

def handler(event, context):
    auth_header = event.get('headers', {}).get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Authorization required'})
        }

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(
            token, 
            os.environ.get('JWT_SECRET'), 
            algorithms=['HS256']
        )
    except Exception as e:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': f'Invalid token: {str(e)}'})
        }
    
    dynamodb = boto3.resource('dynamodb',
                              endpoint_url=os.environ['YDB_ENDPOINT'],
                              region_name=os.environ['YDB_REGION'],
                              aws_access_key_id=os.environ['ACCESS_KEY_ID'],
                              aws_secret_access_key=os.environ['SECRET_ACCESS_KEY']
                              )

    posts_table = dynamodb.Table('posts')
    
    try:
        body = event.get('body', '{}')
        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body
        
        if 'title' not in data or not data['title'].strip():
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Title is required'})
            }

        img_url = data.get('imgUrl', '')

        if img_url and 'base64,' in img_url:
            try:
                print("Загрузка изображения в S3...")
                img_url = upload_to_s3(img_url, f"post_{uuid.uuid4()}")
                print(f"Изображение загружено: {img_url}")
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False, 
                        'error': f'Image upload failed: {str(e)}'
                    })
                }
        elif img_url and len(img_url) > 2048:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False, 
                    'error': 'Image URL too long. Please upload image as base64 or use shorter URL'
                })
            }
        
        post_id = str(uuid.uuid4())
        slug = data.get('slug') or slugify(data['title'])

        post_item = {
            'post_id': post_id,
            'title': data['title'].strip(),
            'text': data.get('text', '').strip(),
            'imgUrl': img_url if img_url else '',
            'slug': slug,
            'status': data.get('status', 'draft'),
            'author_id': payload['user_id'],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'views_count': 0,
            'likes_count': 0,
            'comments_count': 0
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
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Invalid JSON format'})
        }
    except KeyError as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': f'Missing field: {str(e)}'})
        }
    except Exception as e:
        print(f"Error in create_post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False, 
                'error': f'Server error: {str(e)}'
            })
        }