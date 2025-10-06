import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Управление Docker контейнерами для Minecraft серверов через HTTP API
    Args: event с httpMethod, body (serverId, action)
    Returns: HTTP response со статусом контейнера
    """
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    docker_host = os.environ.get('DOCKER_HOST_URL', 'http://localhost:2375')
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            server_id = body_data.get('serverId')
            action = body_data.get('action')
            
            if not server_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'serverId and action required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, name, edition, version, port, rcon_port, max_players "
                    "FROM servers WHERE id = %s",
                    (server_id,)
                )
                server = cur.fetchone()
                
                if not server:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Server not found'}),
                        'isBase64Encoded': False
                    }
                
                if action == 'create':
                    return create_container_via_api(server, docker_host, cur, conn)
                elif action in ['start', 'stop', 'restart']:
                    return manage_container(server, action, docker_host, cur, conn)
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid action'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            server_id = params.get('serverId')
            
            if server_id:
                return get_container_status(server_id, docker_host, conn)
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'serverId required'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def create_container_via_api(server: Dict, docker_host: str, cur, conn) -> Dict[str, Any]:
    """Создать контейнер через Docker HTTP API"""
    container_name = f"minecraft-{server['id']}"
    
    image = "itzg/minecraft-server" if server['edition'] == 'java' else "itzg/minecraft-bedrock-server"
    
    container_config = {
        "Image": image,
        "name": container_name,
        "Env": [
            "EULA=TRUE",
            f"VERSION={server['version']}",
            "MEMORY=2G",
            f"MAX_PLAYERS={server['max_players']}",
            f"MOTD=Welcome to {server['name']}",
            "ONLINE_MODE=FALSE"
        ],
        "HostConfig": {
            "PortBindings": {
                "25565/tcp": [{"HostPort": str(server['port'])}]
            },
            "RestartPolicy": {
                "Name": "unless-stopped"
            }
        },
        "ExposedPorts": {
            "25565/tcp": {}
        }
    }
    
    try:
        url = f"{docker_host}/containers/create?name={container_name}"
        req = urllib.request.Request(
            url,
            data=json.dumps(container_config).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            container_id = result.get('Id', '')[:12]
            
            start_url = f"{docker_host}/containers/{container_id}/start"
            start_req = urllib.request.Request(start_url, method='POST')
            urllib.request.urlopen(start_req, timeout=10)
            
            cur.execute(
                "UPDATE servers SET status = %s WHERE id = %s",
                ('starting', server['id'])
            )
            cur.execute(
                "INSERT INTO server_logs (server_id, log_type, message) VALUES (%s, %s, %s)",
                (server['id'], 'INFO', f'Docker container created: {container_id}')
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'status': 'success',
                    'containerId': container_id,
                    'message': 'Server container created and starting',
                    'port': server['port']
                }),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else str(e)
        
        cur.execute(
            "INSERT INTO server_logs (server_id, log_type, message) VALUES (%s, %s, %s)",
            (server['id'], 'ERROR', f'Failed to create container: {error_body}')
        )
        conn.commit()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Docker not available or not configured',
                'message': 'Using simulation mode - server created in database only',
                'simulation': True
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': str(e),
                'message': 'Using simulation mode',
                'simulation': True
            }),
            'isBase64Encoded': False
        }

def manage_container(server: Dict, action: str, docker_host: str, cur, conn) -> Dict[str, Any]:
    """Управление контейнером (start/stop/restart)"""
    container_name = f"minecraft-{server['id']}"
    
    status_map = {
        'start': 'online',
        'stop': 'offline',
        'restart': 'online'
    }
    
    new_status = status_map.get(action, 'offline')
    
    try:
        url = f"{docker_host}/containers/{container_name}/{action}"
        req = urllib.request.Request(url, method='POST')
        urllib.request.urlopen(req, timeout=30)
        
        cur.execute("UPDATE servers SET status = %s WHERE id = %s", (new_status, server['id']))
        cur.execute(
            "INSERT INTO server_logs (server_id, log_type, message) VALUES (%s, %s, %s)",
            (server['id'], 'INFO', f'Container {action} completed')
        )
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': new_status, 'message': f'Server {action} successful'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        cur.execute("UPDATE servers SET status = %s WHERE id = %s", (new_status, server['id']))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': new_status,
                'message': f'Server {action} (simulation mode)',
                'simulation': True
            }),
            'isBase64Encoded': False
        }

def get_container_status(server_id: str, docker_host: str, conn) -> Dict[str, Any]:
    """Получить статус контейнера"""
    container_name = f"minecraft-{server_id}"
    
    try:
        url = f"{docker_host}/containers/{container_name}/json"
        req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            container_data = json.loads(response.read().decode('utf-8'))
            
            is_running = container_data.get('State', {}).get('Running', False)
            status = 'online' if is_running else 'offline'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'status': status,
                    'containerId': container_data.get('Id', '')[:12],
                    'uptime': container_data.get('State', {}).get('Status', 'unknown')
                }),
                'isBase64Encoded': False
            }
    
    except Exception:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT status FROM servers WHERE id = %s", (server_id,))
            result = cur.fetchone()
            status = result['status'] if result else 'offline'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': status,
                'simulation': True
            }),
            'isBase64Encoded': False
        }
