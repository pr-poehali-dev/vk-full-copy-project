"""
Авторизация: action=register|login|me|logout
"""
import json
import os
import hashlib
import secrets
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


def hash_password(p):
    return hashlib.sha256(p.encode()).hexdigest()


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, default=str)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    action = body.get('action', '')
    token = event.get('headers', {}).get('X-Auth-Token', '')

    if action == 'register':
        username = body.get('username', '').strip()
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        display_name = body.get('display_name', username).strip()
        if not username or not email or not password:
            return err('Заполните все поля')
        if len(password) < 6:
            return err('Пароль минимум 6 символов')
        if len(username) < 3:
            return err('Имя пользователя минимум 3 символа')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f'SELECT id FROM {S}.users WHERE username=%s OR email=%s', (username, email))
        if cur.fetchone():
            conn.close()
            return err('Пользователь уже существует')
        pw_hash = hash_password(password)
        cur.execute(f'INSERT INTO {S}.users (username, email, password_hash, display_name) VALUES (%s,%s,%s,%s) RETURNING id', (username, email, pw_hash, display_name))
        user_id = cur.fetchone()[0]
        token_val = secrets.token_hex(32)
        cur.execute(f'INSERT INTO {S}.sessions (user_id, token) VALUES (%s,%s)', (user_id, token_val))
        conn.commit()
        conn.close()
        return ok({'token': token_val, 'user': {'id': user_id, 'username': username, 'display_name': display_name, 'email': email, 'avatar_url': '', 'bio': '', 'city': '', 'followers_count': 0, 'following_count': 0, 'posts_count': 0}})

    if action == 'login':
        login = body.get('login', '').strip().lower()
        password = body.get('password', '')
        if not login or not password:
            return err('Заполните все поля')
        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f'SELECT id, username, display_name, email, avatar_url, bio, city, followers_count, following_count, posts_count FROM {S}.users WHERE (username=%s OR email=%s) AND password_hash=%s', (login, login, pw_hash))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err('Неверный логин или пароль', 401)
        user_id = row[0]
        cur.execute(f'UPDATE {S}.users SET is_online=true, last_seen=NOW() WHERE id=%s', (user_id,))
        token_val = secrets.token_hex(32)
        cur.execute(f'INSERT INTO {S}.sessions (user_id, token) VALUES (%s,%s)', (user_id, token_val))
        conn.commit()
        conn.close()
        return ok({'token': token_val, 'user': {'id': row[0], 'username': row[1], 'display_name': row[2], 'email': row[3], 'avatar_url': row[4] or '', 'bio': row[5] or '', 'city': row[6] or '', 'followers_count': row[7], 'following_count': row[8], 'posts_count': row[9]}})

    if action == 'me':
        if not token:
            return err('Не авторизован', 401)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f'SELECT user_id FROM {S}.sessions WHERE token=%s AND expires_at > NOW()', (token,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err('Сессия истекла', 401)
        user_id = row[0]
        cur.execute(f'SELECT id, username, display_name, email, avatar_url, bio, city, website, followers_count, following_count, posts_count FROM {S}.users WHERE id=%s', (user_id,))
        u = cur.fetchone()
        conn.close()
        if not u:
            return err('Пользователь не найден', 404)
        return ok({'user': {'id': u[0], 'username': u[1], 'display_name': u[2], 'email': u[3], 'avatar_url': u[4] or '', 'bio': u[5] or '', 'city': u[6] or '', 'website': u[7] or '', 'followers_count': u[8], 'following_count': u[9], 'posts_count': u[10]}})

    if action == 'logout':
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f'UPDATE {S}.sessions SET expires_at=NOW() WHERE token=%s', (token,))
            conn.commit()
            conn.close()
        return ok({'ok': True})

    return err('Неизвестное действие', 400)
