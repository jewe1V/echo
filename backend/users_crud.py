from pprint import pprint
import uuid
import hashlib
import jwt
import datetime
from config import get_ydb_client, YDB_TABLE_PREFIX

# Инициализация таблиц
ydb_client = get_ydb_client()
users_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}users')
post_likes_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}post_likes')

# Секретный ключ для JWT (в продакшене хранить в Yandex Lockbox)
JWT_SECRET = 'your-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    salt = "blog-platform-salt"  # В продакшене использовать уникальную соль
    return hashlib.sha256((password + salt).encode()).hexdigest()

def create_user(username: str, email: str, password: str, display_name: str = None, role: str = 'user'):
    """Создание нового пользователя"""

    # Проверка существования пользователя
    existing_user = get_user_by_email(email)
    if existing_user:
        raise Exception("User with this email already exists")

    user_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().isoformat()

    user_item = {
        'user_id': user_id,
        'username': username,
        'email': email,
        'password_hash': hash_password(password),
        'display_name': display_name or username,
        'role': role,
        'created_at': created_at,
        'updated_at': created_at,
        'is_active': True
    }

    try:
        users_table.put_item(Item=user_item)
        return user_item
    except Exception as e:
        print(f"Error creating user: {e}")
        return None

def get_user_by_id(user_id: str):
    """Получение пользователя по ID"""
    try:
        response = users_table.get_item(Key={'user_id': user_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def get_user_by_email(email: str):
    """Получение пользователя по email (используя индекс)"""
    try:
        # Используем scan для поиска по email (в реальном проекте лучше использовать индекс)
        response = users_table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )

        items = response.get('Items', [])
        return items[0] if items else None
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None

def authenticate_user(email: str, password: str):
    """Аутентификация пользователя"""
    user = get_user_by_email(email)

    if not user:
        return None

    if user['password_hash'] != hash_password(password):
        return None

    if not user.get('is_active', True):
        return None

    # Генерация JWT токена
    token_payload = {
        'user_id': user['user_id'],
        'email': user['email'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }

    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    # Убираем пароль из ответа
    user.pop('password_hash', None)

    return {
        'user': user,
        'token': token
    }

def update_user(user_id: str, **kwargs):
    """Обновление данных пользователя"""
    # Проверяем существование пользователя
    user = get_user_by_id(user_id)
    if not user:
        return None

    # Нельзя обновлять некоторые поля напрямую
    forbidden_fields = ['user_id', 'created_at', 'password_hash']
    update_fields = {k: v for k, v in kwargs.items() if k not in forbidden_fields}

    if not update_fields:
        return user

    # Подготавливаем выражение для обновления
    update_expression = "SET "
    expression_attribute_names = {}
    expression_attribute_values = {}

    for i, (key, value) in enumerate(update_fields.items()):
        update_expression += f"#{key} = :{key}"
        expression_attribute_names[f"#{key}"] = key
        expression_attribute_values[f":{key}"] = value

        if i < len(update_fields) - 1:
            update_expression += ", "

    # Добавляем updated_at
    update_expression += ", #updated_at = :updated_at"
    expression_attribute_names["#updated_at"] = "updated_at"
    expression_attribute_values[":updated_at"] = datetime.datetime.utcnow().isoformat()

    try:
        response = users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )

        updated_user = response.get('Attributes', {})
        updated_user.pop('password_hash', None)
        return updated_user
    except Exception as e:
        print(f"Error updating user: {e}")
        return None

def delete_user(user_id: str):
    """Удаление пользователя (мягкое удаление)"""
    try:
        response = users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression="SET #is_active = :is_active, #updated_at = :updated_at",
            ExpressionAttributeNames={
                '#is_active': 'is_active',
                '#updated_at': 'updated_at'
            },
            ExpressionAttributeValues={
                ':is_active': False,
                ':updated_at': datetime.datetime.utcnow().isoformat()
            },
            ReturnValues="ALL_NEW"
        )

        return response.get('Attributes', {})
    except Exception as e:
        print(f"Error deleting user: {e}")
        return None

def get_user_liked_posts(user_id: str, limit: int = 20):
    """Получение постов, которые лайкнул пользователь"""
    try:
        response = post_likes_table.query(
            IndexName='idx_post_likes_user',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            Limit=limit,
            ScanIndexForward=False  # Сначала новые
        )

        liked_posts = response.get('Items', [])

        # Получаем детали постов
        # В реальном проекте здесь был бы JOIN с таблицей posts
        return liked_posts
    except Exception as e:
        print(f"Error getting user liked posts: {e}")
        return []

if __name__ == '__main__':
    # Пример использования
    # 1. Создание пользователя
    new_user = create_user(
        username="admin_user",
        email="admin@example.com",
        password="secure_password123",
        display_name="Администратор",
        role="admin"
    )

    if new_user:
        print("User created:")
        pprint(new_user, sort_dicts=False)

    # 2. Аутентификация
    auth_result = authenticate_user("admin@example.com", "secure_password123")
    if auth_result:
        print("\nAuthentication successful:")
        pprint(auth_result, sort_dicts=False)

    # 3. Получение пользователя
    if new_user:
        user = get_user_by_id(new_user['user_id'])
        print("\nUser retrieved:")
        pprint(user, sort_dicts=False)
