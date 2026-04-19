"""
Сообщения: получить чаты пользователя, создать чат, получить сообщения, отправить сообщение, реакции
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
    user_id = get_user_id(token, cur)
    if not user_id:
        conn.close()
        return err('Не авторизован', 401)

    # get_chats — список чатов пользователя
    if action == 'get_chats':
        cur.execute(f'''
            SELECT c.id, c.type, c.name, c.avatar_url, c.created_at,
                   m.text, m.type as msg_type, m.created_at as last_time,
                   u2.display_name as last_sender,
                   (SELECT COUNT(*) FROM {S}.messages WHERE chat_id=c.id AND is_read=false AND user_id != %s) as unread
            FROM {S}.chats c
            JOIN {S}.chat_members cm ON cm.chat_id=c.id AND cm.user_id=%s
            LEFT JOIN LATERAL (
                SELECT text, type, created_at, user_id FROM {S}.messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1
            ) m ON true
            LEFT JOIN {S}.users u2 ON u2.id=m.user_id
            ORDER BY COALESCE(m.created_at, c.created_at) DESC
        ''', (user_id, user_id))
        rows = cur.fetchall()
        chats = []
        for r in rows:
            chat_id = r[0]
            # for private chats get other user info
            other_user = None
            if r[1] == 'private':
                cur.execute(f'''
                    SELECT u.id, u.display_name, u.avatar_url, u.is_online, u.last_seen
                    FROM {S}.users u JOIN {S}.chat_members cm ON cm.user_id=u.id
                    WHERE cm.chat_id=%s AND u.id != %s LIMIT 1
                ''', (chat_id, user_id))
                ou = cur.fetchone()
                if ou:
                    other_user = {'id': ou[0], 'display_name': ou[1], 'avatar_url': ou[2] or '', 'is_online': ou[3], 'last_seen': str(ou[4])}
            chats.append({
                'id': chat_id,
                'type': r[1],
                'name': other_user['display_name'] if other_user else r[2],
                'avatar_url': other_user['avatar_url'] if other_user else r[3] or '',
                'is_online': other_user['is_online'] if other_user else False,
                'last_message': r[5] or '',
                'last_message_type': r[6] or 'text',
                'last_time': str(r[7]) if r[7] else str(r[4]),
                'last_sender': r[8] or '',
                'unread': int(r[9]) if r[9] else 0,
                'other_user': other_user,
            })
        conn.close()
        return ok({'chats': chats})

    # create_chat — создать приватный чат или группу
    if action == 'create_chat':
        chat_type = body.get('type', 'private')
        name = body.get('name', '')
        member_ids = body.get('member_ids', [])

        if chat_type == 'private':
            other_id = member_ids[0] if member_ids else None
            if not other_id:
                conn.close()
                return err('Укажите пользователя')
            # check if private chat already exists
            cur.execute(f'''
                SELECT c.id FROM {S}.chats c
                JOIN {S}.chat_members cm1 ON cm1.chat_id=c.id AND cm1.user_id=%s
                JOIN {S}.chat_members cm2 ON cm2.chat_id=c.id AND cm2.user_id=%s
                WHERE c.type='private'
                LIMIT 1
            ''', (user_id, other_id))
            existing = cur.fetchone()
            if existing:
                conn.close()
                return ok({'chat_id': existing[0]})

        cur.execute(f'INSERT INTO {S}.chats (type, name, created_by) VALUES (%s,%s,%s) RETURNING id', (chat_type, name, user_id))
        chat_id = cur.fetchone()[0]
        cur.execute(f'INSERT INTO {S}.chat_members (chat_id, user_id, role) VALUES (%s,%s,%s)', (chat_id, user_id, 'admin'))
        for mid in member_ids:
            if mid != user_id:
                cur.execute(f'INSERT INTO {S}.chat_members (chat_id, user_id) VALUES (%s,%s) ON CONFLICT DO NOTHING', (chat_id, mid))
        conn.commit()
        conn.close()
        return ok({'chat_id': chat_id})

    # get_messages
    if action == 'get_messages':
        chat_id = body.get('chat_id') or qs.get('chat_id')
        offset = int(body.get('offset', qs.get('offset', 0)))
        if not chat_id:
            conn.close()
            return err('chat_id обязателен')
        # verify membership
        cur.execute(f'SELECT id FROM {S}.chat_members WHERE chat_id=%s AND user_id=%s', (chat_id, user_id))
        if not cur.fetchone():
            conn.close()
            return err('Нет доступа', 403)
        cur.execute(f'''
            SELECT m.id, m.chat_id, m.user_id, m.text, m.type, m.file_url, m.file_name,
                   m.reply_to_id, m.is_read, m.created_at,
                   u.display_name, u.avatar_url,
                   r.id as reply_id, r.text as reply_text, ru.display_name as reply_user
            FROM {S}.messages m
            JOIN {S}.users u ON u.id=m.user_id
            LEFT JOIN {S}.messages r ON r.id=m.reply_to_id
            LEFT JOIN {S}.users ru ON ru.id=r.user_id
            WHERE m.chat_id=%s
            ORDER BY m.created_at DESC
            LIMIT 50 OFFSET %s
        ''', (chat_id, offset))
        rows = cur.fetchall()
        # mark as read
        cur.execute(f'UPDATE {S}.messages SET is_read=true WHERE chat_id=%s AND user_id != %s AND is_read=false', (chat_id, user_id))
        conn.commit()
        msgs = []
        for r in reversed(rows):
            # get reactions
            cur.execute(f'SELECT emoji, COUNT(*) FROM {S}.message_reactions WHERE message_id=%s GROUP BY emoji', (r[0],))
            reactions = {row[0]: row[1] for row in cur.fetchall()}
            msgs.append({
                'id': r[0], 'chat_id': r[1], 'user_id': r[2],
                'text': r[3] or '', 'type': r[4], 'file_url': r[5] or '', 'file_name': r[6] or '',
                'reply_to': {'id': r[12], 'text': r[13], 'user': r[14]} if r[12] else None,
                'is_read': r[8], 'created_at': str(r[9]),
                'sender_name': r[10], 'sender_avatar': r[11] or '',
                'reactions': reactions,
            })
        conn.close()
        return ok({'messages': msgs})

    # send_message — отправить сообщение
    if action == 'send_message':
        chat_id = body.get('chat_id')
        text = body.get('text', '')
        msg_type = body.get('type', 'text')
        file_url = body.get('file_url', '')
        file_name = body.get('file_name', '')
        reply_to_id = body.get('reply_to_id')

        if not chat_id:
            conn.close()
            return err('chat_id обязателен')
        cur.execute(f'SELECT id FROM {S}.chat_members WHERE chat_id=%s AND user_id=%s', (chat_id, user_id))
        if not cur.fetchone():
            conn.close()
            return err('Нет доступа', 403)

        cur.execute(
            f'INSERT INTO {S}.messages (chat_id, user_id, text, type, file_url, file_name, reply_to_id) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id, created_at',
            (chat_id, user_id, text, msg_type, file_url, file_name, reply_to_id)
        )
        msg_id, created_at = cur.fetchone()
        cur.execute(f'SELECT display_name, avatar_url FROM {S}.users WHERE id=%s', (user_id,))
        u = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({
            'message': {
                'id': msg_id, 'chat_id': chat_id, 'user_id': user_id,
                'text': text, 'type': msg_type, 'file_url': file_url, 'file_name': file_name,
                'reply_to': None, 'is_read': False, 'created_at': str(created_at),
                'sender_name': u[0] if u else '', 'sender_avatar': u[1] if u else '',
                'reactions': {},
            }
        })

    # add_reaction — добавить/убрать реакцию
    if action == 'add_reaction':
        message_id = body.get('message_id')
        emoji = body.get('emoji', '')
        if not message_id or not emoji:
            conn.close()
            return err('Укажите message_id и emoji')
        cur.execute(f'SELECT id FROM {S}.message_reactions WHERE message_id=%s AND user_id=%s AND emoji=%s', (message_id, user_id, emoji))
        if cur.fetchone():
            cur.execute(f'UPDATE {S}.message_reactions SET emoji=%s WHERE message_id=%s AND user_id=%s AND emoji=%s', (emoji, message_id, user_id, emoji))
        else:
            cur.execute(f'INSERT INTO {S}.message_reactions (message_id, user_id, emoji) VALUES (%s,%s,%s) ON CONFLICT DO NOTHING', (message_id, user_id, emoji))
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # get_chat_info
    if action == 'get_chat_info':
        chat_id = body.get('chat_id') or qs.get('chat_id')
        cur.execute(f'SELECT id, type, name, avatar_url, created_at FROM {S}.chats WHERE id=%s', (chat_id,))
        c = cur.fetchone()
        if not c:
            conn.close()
            return err('Чат не найден', 404)
        cur.execute(f'''
            SELECT u.id, u.display_name, u.avatar_url, u.is_online, cm.role
            FROM {S}.users u JOIN {S}.chat_members cm ON cm.user_id=u.id
            WHERE cm.chat_id=%s
        ''', (chat_id,))
        members = [{'id': r[0], 'display_name': r[1], 'avatar_url': r[2] or '', 'is_online': r[3], 'role': r[4]} for r in cur.fetchall()]
        conn.close()
        return ok({'chat': {'id': c[0], 'type': c[1], 'name': c[2], 'avatar_url': c[3] or '', 'created_at': str(c[4]), 'members': members}})

    conn.close()
    return err('Not found', 404)
