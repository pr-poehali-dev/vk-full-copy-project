"""
Посты: лента, создание, лайк, комментарии
"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
}
DB = os.environ['DATABASE_URL']
S = 't_p81363902_vk_full_copy_project'


def get_conn():
    conn = psycopg2.connect(DB)
    conn.autocommit = False
    return conn


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, default=str)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}


def get_user_id(token, cur):
    cur.execute(f'SELECT user_id FROM {S}.sessions WHERE token=%s AND expires_at > NOW()', (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    qs = event.get('queryStringParameters') or {}
    token = event.get('headers', {}).get('X-Auth-Token', '')
    action = body.get('action', qs.get('action', ''))

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(token, cur) if token else None

    # get_feed
    if action == 'get_feed':
        offset = int(body.get('offset', qs.get('offset', 0)))
        if user_id:
            cur.execute(f'''
                SELECT p.id, p.user_id, p.text, p.image_url, p.likes_count, p.comments_count, p.reposts_count, p.created_at,
                       u.display_name, u.avatar_url, u.username,
                       CASE WHEN pl.id IS NOT NULL THEN true ELSE false END as liked
                FROM {S}.posts p
                JOIN {S}.users u ON u.id=p.user_id
                LEFT JOIN {S}.post_likes pl ON pl.post_id=p.id AND pl.user_id=%s
                WHERE p.user_id=%s OR p.user_id IN (
                    SELECT following_id FROM {S}.follows WHERE follower_id=%s
                )
                ORDER BY p.created_at DESC
                LIMIT 20 OFFSET %s
            ''', (user_id, user_id, user_id, offset))
        else:
            cur.execute(f'''
                SELECT p.id, p.user_id, p.text, p.image_url, p.likes_count, p.comments_count, p.reposts_count, p.created_at,
                       u.display_name, u.avatar_url, u.username, false as liked
                FROM {S}.posts p JOIN {S}.users u ON u.id=p.user_id
                ORDER BY p.created_at DESC LIMIT 20 OFFSET %s
            ''', (offset,))
        posts = [{
            'id': r[0], 'user_id': r[1], 'text': r[2], 'image_url': r[3] or '',
            'likes_count': r[4], 'comments_count': r[5], 'reposts_count': r[6], 'created_at': str(r[7]),
            'user_name': r[8], 'user_avatar': r[9] or '', 'username': r[10], 'liked': r[11]
        } for r in cur.fetchall()]
        conn.close()
        return ok({'posts': posts})

    # create_post
    if action == 'create_post':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        text = body.get('text', '').strip()
        image_url = body.get('image_url', '')
        if not text and not image_url:
            conn.close()
            return err('Напишите что-нибудь')
        cur.execute(f'INSERT INTO {S}.posts (user_id, text, image_url) VALUES (%s,%s,%s) RETURNING id, created_at', (user_id, text, image_url))
        post_id, created_at = cur.fetchone()
        cur.execute(f'UPDATE {S}.users SET posts_count=posts_count+1 WHERE id=%s', (user_id,))
        cur.execute(f'SELECT display_name, avatar_url, username FROM {S}.users WHERE id=%s', (user_id,))
        u = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'post': {'id': post_id, 'user_id': user_id, 'text': text, 'image_url': image_url, 'likes_count': 0, 'comments_count': 0, 'reposts_count': 0, 'created_at': str(created_at), 'user_name': u[0], 'user_avatar': u[1] or '', 'username': u[2], 'liked': False}})

    # like_post
    if action == 'like_post':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        post_id = body.get('post_id')
        cur.execute(f'SELECT id FROM {S}.post_likes WHERE user_id=%s AND post_id=%s', (user_id, post_id))
        if cur.fetchone():
            cur.execute(f'UPDATE {S}.post_likes SET user_id=%s WHERE user_id=%s AND post_id=%s', (user_id, user_id, post_id))
            cur.execute(f'UPDATE {S}.posts SET likes_count=GREATEST(likes_count-1,0) WHERE id=%s', (post_id,))
            conn.commit()
            conn.close()
            return ok({'liked': False})
        cur.execute(f'INSERT INTO {S}.post_likes (user_id, post_id) VALUES (%s,%s)', (user_id, post_id))
        cur.execute(f'UPDATE {S}.posts SET likes_count=likes_count+1 WHERE id=%s', (post_id,))
        cur.execute(f'SELECT user_id FROM {S}.posts WHERE id=%s', (post_id,))
        owner = cur.fetchone()
        if owner and owner[0] != user_id:
            cur.execute(f'INSERT INTO {S}.notifications (user_id, from_user_id, type, entity_id, text) VALUES (%s,%s,%s,%s,%s)', (owner[0], user_id, 'like', post_id, 'оценил(а) ваш пост'))
        conn.commit()
        conn.close()
        return ok({'liked': True})

    # get_comments
    if action == 'get_comments':
        post_id = body.get('post_id') or qs.get('post_id')
        cur.execute(f'''
            SELECT c.id, c.user_id, c.text, c.created_at, u.display_name, u.avatar_url
            FROM {S}.comments c JOIN {S}.users u ON u.id=c.user_id
            WHERE c.post_id=%s ORDER BY c.created_at ASC
        ''', (post_id,))
        comments = [{'id': r[0], 'user_id': r[1], 'text': r[2], 'created_at': str(r[3]), 'user_name': r[4], 'user_avatar': r[5] or ''} for r in cur.fetchall()]
        conn.close()
        return ok({'comments': comments})

    # add_comment
    if action == 'add_comment':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        post_id = body.get('post_id')
        text = body.get('text', '').strip()
        if not text:
            conn.close()
            return err('Напишите комментарий')
        cur.execute(f'INSERT INTO {S}.comments (user_id, post_id, text) VALUES (%s,%s,%s) RETURNING id, created_at', (user_id, post_id, text))
        cid, cat = cur.fetchone()
        cur.execute(f'UPDATE {S}.posts SET comments_count=comments_count+1 WHERE id=%s', (post_id,))
        cur.execute(f'SELECT display_name, avatar_url FROM {S}.users WHERE id=%s', (user_id,))
        u = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'comment': {'id': cid, 'user_id': user_id, 'text': text, 'created_at': str(cat), 'user_name': u[0], 'user_avatar': u[1] or ''}})

    conn.close()
    return err('Not found', 404)
