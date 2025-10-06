import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import random
import string

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Управление Minecraft серверами (создание, получение списка, управление)
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP response с данными серверов
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'GET':
            return get_servers(event, conn)
        elif method == 'POST':
            return create_server(event, conn)
        elif method == 'PUT':
            return update_server(event, conn)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def get_servers(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """Получить список серверов пользователя"""
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id', 'demo-user')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, server_ip, edition, version, max_players, status, port, created_at "
            "FROM servers WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        servers = cur.fetchall()
        
        result = []
        for server in servers:
            result.append({
                'id': str(server['id']),
                'name': server['name'],
                'ip': server['server_ip'],
                'edition': server['edition'],
                'version': server['version'],
                'status': server['status'],
                'players': {'current': 0, 'max': server['max_players']},
                'port': server['port']
            })
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'servers': result}),
        'isBase64Encoded': False
    }

def create_server(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """Создать новый Minecraft сервер"""
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id', 'demo-user')
    
    body_data = json.loads(event.get('body', '{}'))
    name = body_data.get('name')
    server_ip = body_data.get('ip')
    edition = body_data.get('edition', 'java')
    version = body_data.get('version', '1.20.1')
    max_players = int(body_data.get('maxPlayers', 20))
    
    if not name or not server_ip:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Name and IP are required'}),
            'isBase64Encoded': False
        }
    
    port = random.randint(25565, 35565)
    rcon_port = port + 10000
    rcon_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "INSERT INTO servers (user_id, name, server_ip, edition, version, max_players, port, rcon_port, rcon_password) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, name, server_ip, edition, version, max_players, status, port",
            (user_id, name, server_ip, edition, version, max_players, port, rcon_port, rcon_password)
        )
        server = cur.fetchone()
        
        cur.execute(
            "INSERT INTO server_settings (server_id, motd) VALUES (%s, %s)",
            (server['id'], f'Welcome to {name}!')
        )
        
        cur.execute(
            "INSERT INTO server_logs (server_id, log_type, message) VALUES (%s, %s, %s)",
            (server['id'], 'INFO', f'Server {name} created successfully')
        )
        
        conn.commit()
        
        result = {
            'id': str(server['id']),
            'name': server['name'],
            'ip': server['server_ip'],
            'edition': server['edition'],
            'version': server['version'],
            'status': server['status'],
            'players': {'current': 0, 'max': server['max_players']},
            'port': server['port']
        }
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'server': result}),
        'isBase64Encoded': False
    }

def update_server(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """Обновить статус сервера (запуск/остановка)"""
    body_data = json.loads(event.get('body', '{}'))
    server_id = body_data.get('serverId')
    action = body_data.get('action')
    
    if not server_id or not action:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Server ID and action are required'}),
            'isBase64Encoded': False
        }
    
    status_map = {
        'start': 'starting',
        'stop': 'offline',
        'restart': 'starting'
    }
    
    new_status = status_map.get(action, 'offline')
    
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE servers SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (new_status, server_id)
        )
        
        cur.execute(
            "INSERT INTO server_logs (server_id, log_type, message) VALUES (%s, %s, %s)",
            (server_id, 'INFO', f'Server {action} initiated')
        )
        
        conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': new_status, 'action': action}),
        'isBase64Encoded': False
    }
