from pprint import pprint
import uuid
import datetime
from config import get_ydb_client, YDB_TABLE_PREFIX

ydb_client = get_ydb_client()
posts_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}posts')
post_likes_table = ydb_client.Table(f'{YDB_TABLE_PREFIX}post_likes')

def create_post(title: str, content: str, author_id: str, image_path: str = None,
                status: str = 'draft', excerpt: str = None):
    """Создание нового поста"""

    post_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().isoformat()

    # Генерация slug из заголовка
    import re
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')

    post_item = {
        'post_id': post_id,
        'title': title,
        'slug': slug,
        'content': content,
        'excerpt': excerpt or content[:200] + '...' if content else None,
        'image_path': image_path,
        'image_url': f"https://storage.yandexcloud.net/blog-bucket/{image_path}" if image_path else None,
        'author_id': author_id,
        'status': status,
        'published_at': created_at if status == 'published' else None,
        'created_at': created_at,
        'updated_at': created_at,
        'views_count': 0,
        'likes_count': 0
    }

    try:
        posts_table.put_item(Item=post_item)
        return post_item
    except Exception as e:
        print(f"Error creating post: {e}")
        return None

def get_post_by_id(post_id: str):
    """Получение поста по ID"""
    try:
        response = posts_table.get_item(Key={'post_id': post_id})
        post = response.get('Item')

        if post:
            # Увеличиваем счетчик просмотров
            posts_table.update_item(
                Key={'post_id': post_id},
                UpdateExpression="SET views_count = views_count + :inc",
                ExpressionAttributeValues={':inc': 1}
            )
            post['views_count'] = post.get('views_count', 0) + 1

        return post
    except Exception as e:
        print(f"Error getting post: {e}")
        return None

def get_post_by_slug(slug: str):
    """Получение поста по slug"""
    try:
        # Используем scan для поиска по slug (в реальном проекте лучше использовать индекс)
        response = posts_table.scan(
            FilterExpression='slug = :slug AND #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':slug': slug,
                ':status': 'published'
            }
        )

        items = response.get('Items', [])
        if items:
            post = items[0]
            # Увеличиваем счетчик просмотров
            posts_table.update_item(
                Key={'post_id': post['post_id']},
                UpdateExpression="SET views_count = views_count + :inc",
                ExpressionAttributeValues={':inc': 1}
            )
            post['views_count'] = post.get('views_count', 0) + 1
            return post
        return None
    except Exception as e:
        print(f"Error getting post by slug: {e}")
        return None

def get_posts(page: int = 1, limit: int = 10, status: str = 'published'):
    """Получение списка постов с пагинацией"""
    try:
        # В реальном проекте здесь был бы Query с индексом
        response = posts_table.scan(
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status},
            Limit=limit
        )

        items = response.get('Items', [])

        # Сортировка по дате публикации (новые первые)
        if status == 'published':
            items.sort(key=lambda x: x.get('published_at', ''), reverse=True)
        else:
            items.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Пагинация
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        return {
            'posts': items[start_idx:end_idx],
            'total': len(items),
            'page': page,
            'limit': limit,
            'has_more': len(items) > end_idx
        }
    except Exception as e:
        print(f"Error getting posts: {e}")
        return {'posts': [], 'total': 0, 'page': page, 'limit': limit, 'has_more': False}

def get_posts_by_author(author_id: str, limit: int = 20):
    """Получение постов автора"""
    try:
        response = posts_table.scan(
            FilterExpression='author_id = :author_id',
            ExpressionAttributeValues={':author_id': author_id},
            Limit=limit
        )

        items = response.get('Items', [])
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return items
    except Exception as e:
        print(f"Error getting posts by author: {e}")
        return []

def update_post(post_id: str, **kwargs):
    """Обновление поста"""
    # Проверяем существование поста
    post = get_post_by_id(post_id)
    if not post:
        return None

    # Нельзя обновлять некоторые поля напрямую
    forbidden_fields = ['post_id', 'created_at', 'author_id', 'views_count', 'likes_count']
    update_fields = {k: v for k, v in kwargs.items() if k not in forbidden_fields}

    if not update_fields:
        return post

    # Если обновляем заголовок - обновляем slug
    if 'title' in update_fields:
        import re
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', update_fields['title'].lower()).strip('-')
        update_fields['slug'] = slug

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

    # Если статус меняется на published - устанавливаем published_at
    if 'status' in update_fields and update_fields['status'] == 'published':
        if not post.get('published_at'):
            update_expression += ", #published_at = :published_at"
            expression_attribute_names["#published_at"] = "published_at"
            expression_attribute_values[":published_at"] = datetime.datetime.utcnow().isoformat()

    try:
        response = posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )

        return response.get('Attributes', {})
    except Exception as e:
        print(f"Error updating post: {e}")
        return None

def delete_post(post_id: str):
    """Удаление поста (мягкое удаление - изменение статуса)"""
    try:
        response = posts_table.update_item(
            Key={'post_id': post_id},
            UpdateExpression="SET #status = :status, #updated_at = :updated_at",
            ExpressionAttributeNames={
                '#status': 'status',
                '#updated_at': 'updated_at'
            },
            ExpressionAttributeValues={
                ':status': 'archived',
                ':updated_at': datetime.datetime.utcnow().isoformat()
            },
            ReturnValues="ALL_NEW"
        )

        return response.get('Attributes', {})
    except Exception as e:
        print(f"Error deleting post: {e}")
        return None

def get_top_posts(limit: int = 10):
    """Получение самых популярных постов"""
    try:
        response = posts_table.scan(
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'published'}
        )

        items = response.get('Items', [])

        # Сортировка по лайкам и просмотрам
        items.sort(key=lambda x: (
            x.get('likes_count', 0) * 2 +  # Лайки важнее в 2 раза
            x.get('views_count', 0)
        ), reverse=True)

        return items[:limit]
    except Exception as e:
        print(f"Error getting top posts: {e}")
        return []

if __name__ == '__main__':
    # Пример создания поста
    author_id = "550e8400-e29b-41d4-a716-446655440000"  # ID существующего пользователя

    new_post = create_post(
        title="Мой первый пост в блоге",
        content="# Привет, мир!\n\nЭто мой первый пост в новом блоге...",
        author_id=author_id,
        image_path="posts/first-post/cover.jpg",
        status="published",
        excerpt="Знакомство с новой блог-платформой"
    )

    if new_post:
        print("Post created:")
        pprint(new_post, sort_dicts=False)

    # Получение всех опубликованных постов
    posts = get_posts(limit=5)
    print("\nLatest posts:")
    for post in posts['posts']:
        print(f"- {post['title']} ({post['likes_count']} likes)")
