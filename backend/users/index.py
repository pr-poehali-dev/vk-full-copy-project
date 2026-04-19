"""
Пользователи: поиск, профиль, подписка/отписка, обновление профиля
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

    # search
    if action == 'search':
        q = body.get('q', qs.get('q', '')).strip()
        if not q:
            conn.close()
            return ok({'users': []})
        cur.execute(f'''
            SELECT id, username, display_name, avatar_url, bio, city, followers_count, is_online
            FROM {S}.users
            WHERE display_name ILIKE %s OR username ILIKE %s
            LIMIT 20
        ''', (f'%{q}%', f'%{q}%'))
        users = []
        for r in cur.fetchall():
            is_following = False
            if user_id:
                cur2 = conn.cursor()
                cur2.execute(f'SELECT id FROM {S}.follows WHERE follower_id=%s AND following_id=%s', (user_id, r[0]))
                is_following = cur2.fetchone() is not None
                cur2.close()
            users.append({'id': r[0], 'username': r[1], 'display_name': r[2], 'avatar_url': r[3] or '', 'bio': r[4] or '', 'city': r[5] or '', 'followers_count': r[6], 'is_online': r[7], 'is_following': is_following})
        conn.close()
        return ok({'users': users})

    # get_profile
    if action == 'get_profile':
        target_id = body.get('user_id') or qs.get('user_id') or user_id
        if not target_id:
            conn.close()
            return err('Не авторизован', 401)
        cur.execute(f'''
            SELECT id, username, display_name, email, avatar_url, bio, city, website, cover_url, followers_count, following_count, posts_count, is_online, last_seen, created_at
            FROM {S}.users WHERE id=%s
        ''', (target_id,))
        u = cur.fetchone()
        if not u:
            conn.close()
            return err('Пользователь не найден', 404)
        is_following = False
        if user_id and int(target_id) != user_id:
            cur.execute(f'SELECT id FROM {S}.follows WHERE follower_id=%s AND following_id=%s', (user_id, target_id))
            is_following = cur.fetchone() is not None
        # get posts
        cur.execute(f'SELECT id, text, image_url, likes_count, comments_count, created_at FROM {S}.posts WHERE user_id=%s ORDER BY created_at DESC LIMIT 12', (target_id,))
        posts = [{'id': r[0], 'text': r[1], 'image_url': r[2] or '', 'likes_count': r[3], 'comments_count': r[4], 'created_at': str(r[5])} for r in cur.fetchall()]
        conn.close()
        return ok({'user': {'id': u[0], 'username': u[1], 'display_name': u[2], 'email': u[3], 'avatar_url': u[4] or '', 'bio': u[5] or '', 'city': u[6] or '', 'website': u[7] or '', 'cover_url': u[8] or '', 'followers_count': u[9], 'following_count': u[10], 'posts_count': u[11], 'is_online': u[12], 'last_seen': str(u[13]), 'created_at': str(u[14]), 'is_following': is_following, 'is_me': user_id == u[0]}, 'posts': posts})

    # update_profile
    if action == 'update_profile':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        display_name = body.get('display_name')
        bio = body.get('bio')
        city = body.get('city')
        website = body.get('website')
        avatar_url = body.get('avatar_url')
        cover_url = body.get('cover_url')
        fields = []
        vals = []
        if display_name is not None:
            fields.append('display_name=%s'); vals.append(display_name)
        if bio is not None:
            fields.append('bio=%s'); vals.append(bio)
        if city is not None:
            fields.append('city=%s'); vals.append(city)
        if website is not None:
            fields.append('website=%s'); vals.append(website)
        if avatar_url is not None:
            fields.append('avatar_url=%s'); vals.append(avatar_url)
        if cover_url is not None:
            fields.append('cover_url=%s'); vals.append(cover_url)
        if fields:
            vals.append(user_id)
            cur.execute(f'UPDATE {S}.users SET {", ".join(fields)} WHERE id=%s', vals)
            conn.commit()
        conn.close()
        return ok({'ok': True})

    # follow
    if action == 'follow':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        target_id = body.get('user_id')
        if not target_id or int(target_id) == user_id:
            conn.close()
            return err('Неверный пользователь')
        cur.execute(f'SELECT id FROM {S}.follows WHERE follower_id=%s AND following_id=%s', (user_id, target_id))
        if cur.fetchone():
            cur.execute(f'UPDATE {S}.follows SET follower_id=%s WHERE follower_id=%s AND following_id=%s', (user_id, user_id, target_id))
            conn.commit()
            conn.close()
            return ok({'following': True})
        cur.execute(f'INSERT INTO {S}.follows (follower_id, following_id) VALUES (%s,%s)', (user_id, target_id))
        cur.execute(f'UPDATE {S}.users SET following_count=following_count+1 WHERE id=%s', (user_id,))
        cur.execute(f'UPDATE {S}.users SET followers_count=followers_count+1 WHERE id=%s', (target_id,))
        cur.execute(f'INSERT INTO {S}.notifications (user_id, from_user_id, type, text) VALUES (%s,%s,%s,%s)', (target_id, user_id, 'follow', 'подписался на вас'))
        conn.commit()
        conn.close()
        return ok({'following': True})

    # unfollow
    if action == 'unfollow':
        if not user_id:
            conn.close()
            return err('Не авторизован', 401)
        target_id = body.get('user_id')
        cur.execute(f'SELECT id FROM {S}.follows WHERE follower_id=%s AND following_id=%s', (user_id, target_id))
        if cur.fetchone():
            cur.execute(f'UPDATE {S}.follows SET follower_id=follower_id WHERE follower_id=%s AND following_id=%s', (user_id, target_id))
            cur.execute(f'UPDATE {S}.users SET following_count=GREATEST(following_count-1,0) WHERE id=%s', (user_id,))
            cur.execute(f'UPDATE {S}.users SET followers_count=GREATEST(followers_count-1,0) WHERE id=%s', (target_id,))
            conn.commit()
        conn.close()
        return ok({'following': False})

    # recommendations
    if action == 'recommendations':
        cur.execute(f'''
            SELECT id, username, display_name, avatar_url, followers_count, is_online
            FROM {S}.users
            WHERE id != %s
            ORDER BY followers_count DESC, created_at DESC
            LIMIT 10
        ''', (user_id or 0,))
        users = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'avatar_url': r[3] or '', 'followers_count': r[4], 'is_online': r[5]} for r in cur.fetchall()]
        conn.close()
        return ok({'users': users})

    conn.close()
    return err('Not found', 404)
