# Настройка реального Docker хостинга для Minecraft серверов

## Текущий статус
✅ База данных настроена
✅ API для управления серверами работает  
✅ Docker API интеграция готова
⚠️ Требуется подключение к Docker хосту для запуска реальных серверов

## Что сейчас работает?
- Создание серверов в базе данных
- Сохранение всех настроек (версия, порт, RCON пароль)
- Логирование всех действий
- Интерфейс управления

## Как запустить РЕАЛЬНЫЕ серверы?

### Вариант 1: Локальный Docker (для разработки)
1. Установи Docker Desktop: https://www.docker.com/products/docker-desktop
2. Включи Docker API на порту 2375
3. Добавь секрет `DOCKER_HOST_URL=http://localhost:2375`

### Вариант 2: Облачный сервер (для продакшена)
1. Арендуй VPS сервер (DigitalOcean, AWS, Hetzner)
2. Установи Docker на сервер:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

3. Открой Docker API:
```bash
sudo systemctl edit docker.service
```

Добавь:
```
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock
```

4. Перезапусти Docker:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

5. Добавь секрет `DOCKER_HOST_URL=http://your-server-ip:2375`

### Вариант 3: Использование существующего хостинга
Интеграция с API существующих хостингов:
- Aternos (бесплатно, есть ограничения)
- Minehut (бесплатно, 2 сервера)
- PebbleHost (платный, от $1/мес)

## Безопасность
⚠️ **ВАЖНО**: Docker API без SSL опасен для продакшена!

Для безопасности используй:
- VPN между сервером и приложением
- Docker API через HTTPS с сертификатами
- Firewall с whitelist IP адресов

## Технические детали
- Используется образ `itzg/minecraft-server` (Java)
- Используется образ `itzg/minecraft-bedrock-server` (Bedrock)
- Каждый сервер получает уникальный порт
- Автоматический перезапуск контейнеров
- 2GB RAM на сервер по умолчанию

## Что происходит при создании сервера?
1. Сервер сохраняется в PostgreSQL базу
2. Создаётся Docker контейнер с Minecraft
3. Контейнер запускается автоматически
4. Игроки могут подключаться по IP:порт
5. Все логи сохраняются в БД

## Режим симуляции
Если Docker хост не настроен:
- Серверы сохраняются в базу данных
- Интерфейс работает полностью
- Docker контейнеры НЕ создаются
- Показывается сообщение "simulation mode"
