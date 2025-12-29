import boto3
import json

def create_tables_with_documentapi():
    endpoint_url = "https://docapi.serverless.yandexcloud.net/ru-central1/b1g9m6ifucl0fqun2tt5/etn3unu88a78k9k8qlq7"

    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name='ru-central1',
        aws_access_key_id='YCAJEErXaLFasU8nB6l5L9WVN',
        aws_secret_access_key='YCP5Oc34BYXfzjJZpuR2UPKO7mjsxHXy5hIpegnp',
        aws_session_token='t1.9euelZqezImKz42em47Nxo2PnI7Ple3rnpWanZrLjceWmpPNxpCTzM-PzJLl9PdBKTk1-e99Pj3f3fT3AVg2NfnvfT4939Xi9eyGnNGQnoqLl9GPip2TlpzSjJuU7fmQj5qRlpvN5_XrnpWakJiXyZHLlorJmovMkp2dzYzv_MXrnpWakJiXyZHLlorJmovMkp2dzYy9656VmpKei8-WlZ6bkJiPyorNj8yUteuGnNGWnpLRkI-akZab0oyajYmajQ.oOlizBAp-g617EEH0V8yF3KcTimCfiR1okxCaXeRFGfDivhWD8h5Bu3j2Hf_rs2qbIw0r-HxPBg3S3-wYt8kBA'
    )

    users_table = dynamodb.create_table(
        TableName='users',
        KeySchema=[
            {
                'AttributeName': 'user_id',
                'KeyType': 'HASH'  # Partition key
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'user_id',
                'AttributeType': 'S'  # String
            },
            {
                'AttributeName': 'email',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'username',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'idx_email',
                'KeySchema': [
                    {
                        'AttributeName': 'email',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'idx_username',
                'KeySchema': [
                    {
                        'AttributeName': 'username',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    print(f"✓ Таблица users создана")
    print(f"  Поля: user_id (PK), username, email, password_hash, display_name, role, created_at, updated_at, is_active")

    # 2. Таблица постов с ВАШИМИ ПОЛЯМИ + объяснение slug и status
    posts_table = dynamodb.create_table(
        TableName='posts',
        KeySchema=[
            {
                'AttributeName': 'post_id',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'post_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'author_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'status',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'slug',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'idx_author',
                'KeySchema': [
                    {
                        'AttributeName': 'author_id',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'idx_slug',
                'KeySchema': [
                    {
                        'AttributeName': 'slug',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'idx_status',
                'KeySchema': [
                    {
                        'AttributeName': 'status',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    print(f"✓ Таблица posts создана")
    print(f"  Поля: post_id (PK), title, text, imgUrl, slug, status, author_id, created_at, updated_at, views_count, likes_count")

    # 3. Таблица лайков (оставляем как есть)
    post_likes_table = dynamodb.create_table(
        TableName='post_likes',
        KeySchema=[
            {
                'AttributeName': 'post_id',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'user_id',
                'KeyType': 'RANGE'  # Sort key
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'post_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'user_id',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'idx_user',
                'KeySchema': [
                    {
                        'AttributeName': 'user_id',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    print(f"✓ Таблица post_likes создана")

    # 4. НОВАЯ таблица комментариев
    comments_table = dynamodb.create_table(
        TableName='comments',
        KeySchema=[
            {
                'AttributeName': 'comment_id',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'comment_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'post_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'user_id',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'idx_comments_post',
                'KeySchema': [
                    {
                        'AttributeName': 'post_id',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'idx_comments_user',
                'KeySchema': [
                    {
                        'AttributeName': 'user_id',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    print(f"✓ Таблица comments создана")
    print(f"  Поля: comment_id (PK), post_id, user_id, text, created_at, updated_at")

    return dynamodb

if __name__ == '__main__':
    db = create_tables_with_documentapi()
    print("Все таблицы созданы успешно!")
