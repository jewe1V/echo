import os
import boto3
from botocore.config import Config

YDB_ENDPOINT = os.getenv('YDB_ENDPOINT', 'https://docapi.serverless.yandexcloud.net/ru-central1/b1g9m6ifucl0fqun2tt5/etn8e43qu4jkq4i5bamj')
YDB_REGION = os.getenv('YDB_REGION', 'ru-central1')
YDB_TABLE_PREFIX = os.getenv('YDB_TABLE_PREFIX', 'blog/')

def get_ydb_client():
    """Создание клиента для работы с YDB Document API"""
    config = Config(
        region_name=YDB_REGION,
        retries={'max_attempts': 3, 'mode': 'standard'}
    )

    return boto3.resource(
        'dynamodb',
        endpoint_url=YDB_ENDPOINT,
        config=config
    )
