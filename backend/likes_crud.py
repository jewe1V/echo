from pprint import pprint
import datetime
from config import get_ydb_client, YDB_TABLE_PREFIX

ydb_client = get_ydb_client()
posts_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}posts')
post_likes_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}post_likes')

def like_post(post_id: str, user_id: str, reaction_type: str = 'like'):
    """Поставить лайк посту"""

    # Проверяем существование поста
    post = posts_table.get_item(Key={'post_id': post_id}).get('Item')
    if not post:
        raise Exception("Post not found")

    # Проверяем, не лайкнул ли уже пользователь этот пост
    existing_like = post_likes_table.get_item(
        Key={'post_id': post_id, 'user_id': user_id}
    ).get('Item')

    if existing_like:
        raise Exception("User already liked this post")

    # Создаем запись о лайке
    like_item = {
        'post_id': post_id,
        'user_id': user_id,
        'created_at': datetime.datetime.utcnow().isoformat(),
        'reaction_type': reaction_type
    }

    try:
        # Транзакция: добавляем лайк и обновляем счетчик
        # В YDB Document API нет транзакций как в DynamoDB,
        # поэтому делаем два отдельных запроса

        # 1. Добавляем лайк
        post_likes_table.put_item(Item=like_item)

        # 2. Обновляем счетчик лайков в посте
        posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression="SET likes_count = likes_count + :inc",
            ExpressionAttributeValues={':inc': 1},
            ReturnValues="UPDATED_NEW"
        )

        # Получаем обновленный пост
        updated_post = posts_table.get_item(Key={'post_id': post_id}).get('Item')

        return {
            'success': True,
            'like': like_item,
            'post': {
                'post_id': post_id,
                'likes_count': updated_post.get('likes_count', 0),
                'title': updated_post.get('title', '')
            }
        }
    except Exception as e:
        print(f"Error liking post: {e}")
        return {'success': False, 'error': str(e)}

def unlike_post(post_id: str, user_id: str):
    """Убрать лайк с поста"""

    # Проверяем, ставил ли пользователь лайк
    existing_like = post_likes_table.get_item(
        Key={'post_id': post_id, 'user_id': user_id}
    ).get('Item')

    if not existing_like:
        raise Exception("User hasn't liked this post")

    try:
        # 1. Удаляем лайк
        post_likes_table.delete_item(
            Key={'post_id': post_id, 'user_id': user_id}
        )

        # 2. Обновляем счетчик лайков в посте
        posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression="SET likes_count = likes_count - :dec",
            ExpressionAttributeValues={':dec': 1},
            ReturnValues="UPDATED_NEW"
        )

        # Получаем обновленный пост
        updated_post = posts_table.get_item(Key={'post_id': post_id}).get('Item')

        return {
            'success': True,
            'post': {
                'post_id': post_id,
                'likes_count': updated_post.get('likes_count', 0),
                'title': updated_post.get('title', '')
            }
        }
    except Exception as e:
        print(f"Error unliking post: {e}")
        return {'success': False, 'error': str(e)}

def get_post_likes(post_id: str, limit: int = 50):
    """Получение списка пользователей, лайкнувших пост"""
    try:
        response = post_likes_table.query(
            KeyConditionExpression='post_id = :post_id',
            ExpressionAttributeValues={':post_id': post_id},
            Limit=limit
        )

        return {
            'post_id': post_id,
            'total': response.get('Count', 0),
            'likes': response.get('Items', []),
            'has_more': 'LastEvaluatedKey' in response
        }
    except Exception as e:
        print(f"Error getting post likes: {e}")
        return {'post_id': post_id, 'total': 0, 'likes': [], 'has_more': False}

def get_user_likes(user_id: str, limit: int = 20):
    """Получение постов, лайкнутых пользователем"""
    try:
        # Используем индекс для поиска по user_id
        response = post_likes_table.query(
            IndexName='idx_post_likes_user',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            Limit=limit,
            ScanIndexForward=False  # Сначала новые
        )

        return {
            'user_id': user_id,
            'total': response.get('Count', 0),
            'likes': response.get('Items', []),
            'has_more': 'LastEvaluatedKey' in response
        }
    except Exception as e:
        print(f"Error getting user likes: {e}")
        return {'user_id': user_id, 'total': 0, 'likes': [], 'has_more': False}

def has_user_liked_post(post_id: str, user_id: str):
    """Проверка, лайкнул ли пользователь пост"""
    try:
        response = post_likes_table.get_item(
            Key={'post_id': post_id, 'user_id': user_id}
        )

        return bool(response.get('Item'))
    except Exception as e:
        print(f"Error checking like: {e}")
        return False

def get_post_with_likes(post_id: str, user_id: str = None):
    """Получение поста с информацией о лайках пользователя"""
    try:
        # Получаем пост
        post_response = posts_table.get_item(Key={'post_id': post_id})
        post = post_response.get('Item')

        if not post:
            return None

        result = {
            **post,
            'user_liked': False,
            'user_reaction': None
        }

        # Если передан user_id, проверяем лайкнул ли он пост
        if user_id:
            like_response = post_likes_table.get_item(
                Key={'post_id': post_id, 'user_id': user_id}
            )

            if like_response.get('Item'):
                result['user_liked'] = True
                result['user_reaction'] = like_response['Item'].get('reaction_type')

        # Получаем общее количество лайков
        likes_response = post_likes_table.query(
            KeyConditionExpression='post_id = :post_id',
            Select='COUNT',
            ExpressionAttributeValues={':post_id': post_id}
        )

        result['total_likes'] = likes_response.get('Count', 0)

        return result
    except Exception as e:
        print(f"Error getting post with likes: {e}")
        return None

if __name__ == '__main__':
    # Примеры использования

    post_id = "123e4567-e89b-12d3-a456-426614174000"
    user_id = "550e8400-e29b-41d4-a716-446655440000"

    # 1. Поставить лайк
    print("1. Liking post...")
    result = like_post(post_id, user_id)
    pprint(result, sort_dicts=False)

    # 2. Проверить, лайкнул ли пользователь
    print("\n2. Checking if user liked the post...")
    liked = has_user_liked_post(post_id, user_id)
    print(f"User liked post: {liked}")

    # 3. Получить лайки поста
    print("\n3. Getting post likes...")
    likes = get_post_likes(post_id)
    pprint(likes, sort_dicts=False)

    # 4. Получить пост с информацией о лайке
    print("\n4. Getting post with like info...")
    post_with_likes = get_post_with_likes(post_id, user_id)
    pprint(post_with_likes, sort_dicts=False)

    # 5. Убрать лайк
    print("\n5. Unliking post...")
    result = unlike_post(post_id, user_id)
    pprint(result, sort_dicts=False)
