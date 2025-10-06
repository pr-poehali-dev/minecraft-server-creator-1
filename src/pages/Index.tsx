import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

type ServerStatus = 'online' | 'offline' | 'starting';
type ServerEdition = 'java' | 'bedrock';

interface Server {
  id: string;
  name: string;
  edition: ServerEdition;
  version: string;
  status: ServerStatus;
  ip: string;
  players: { current: number; max: number };
}

const Index = () => {
  const [activeView, setActiveView] = useState<'home' | 'servers' | 'create' | 'panel'>('home');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([
    {
      id: '1',
      name: 'Survival World',
      edition: 'java',
      version: '1.20.1',
      status: 'online',
      ip: 'survival.myserver.net',
      players: { current: 12, max: 20 }
    },
    {
      id: '2',
      name: 'Creative Build',
      edition: 'bedrock',
      version: '1.19.80',
      status: 'offline',
      ip: 'creative.myserver.net',
      players: { current: 0, max: 10 }
    }
  ]);

  const [consoleLog, setConsoleLog] = useState<string[]>([
    '[INFO] Server started successfully',
    '[INFO] Player joined: Steve',
    '[INFO] Player joined: Alex'
  ]);

  const [rconCommand, setRconCommand] = useState('');

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      case 'starting':
        return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: ServerStatus) => {
    switch (status) {
      case 'online':
        return 'Онлайн';
      case 'offline':
        return 'Оффлайн';
      case 'starting':
        return 'Запускается';
    }
  };

  const handleServerAction = (serverId: string, action: 'start' | 'stop' | 'restart') => {
    setServers(prev => prev.map(s => 
      s.id === serverId 
        ? { ...s, status: action === 'start' ? 'starting' : 'offline' as ServerStatus }
        : s
    ));
    
    setTimeout(() => {
      setServers(prev => prev.map(s => 
        s.id === serverId 
          ? { ...s, status: action === 'stop' ? 'offline' : 'online' as ServerStatus }
          : s
      ));
    }, 2000);
  };

  const executeRconCommand = () => {
    if (rconCommand.trim()) {
      setConsoleLog(prev => [...prev, `> ${rconCommand}`, '[INFO] Command executed']);
      setRconCommand('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Icon name="Box" className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                MCPanel
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveView('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeView === 'home' 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon name="Home" size={20} />
                <span>Главная</span>
              </button>
              
              <button
                onClick={() => setActiveView('servers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeView === 'servers' 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon name="Server" size={20} />
                <span>Мои серверы</span>
              </button>

              <Button
                onClick={() => setActiveView('create')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Icon name="Plus" size={20} className="mr-2" />
                Создать сервер
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeView === 'home' && (
          <div className="space-y-8">
            <div className="text-center py-12">
              <h2 className="text-4xl font-bold mb-4">Бесплатный хостинг Minecraft серверов</h2>
              <p className="text-xl text-gray-600 mb-8">Мощные серверы без ограничений</p>
              <Button 
                onClick={() => setActiveView('create')}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg px-8"
              >
                Создать свой сервер
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Icon name="Zap" className="text-green-600" size={24} />
                  </div>
                  <CardTitle>Мощные сервера</CardTitle>
                  <CardDescription>Высокая производительность для лучшего игрового опыта</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Icon name="Shield" className="text-blue-600" size={24} />
                  </div>
                  <CardTitle>100% Бесплатно</CardTitle>
                  <CardDescription>Никаких скрытых платежей и ограничений</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Icon name="Settings" className="text-purple-600" size={24} />
                  </div>
                  <CardTitle>Полный контроль</CardTitle>
                  <CardDescription>RCON, FTP, логи и полная настройка</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {servers.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Ваши серверы</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {servers.slice(0, 2).map(server => (
                    <Card key={server.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedServer(server);
                            setActiveView('panel');
                          }}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon name="Box" className="text-green-600" size={24} />
                            <div>
                              <CardTitle className="text-lg">{server.name}</CardTitle>
                              <CardDescription>{server.ip}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={server.status === 'online' ? 'default' : 'secondary'}
                                 className={server.status === 'online' ? 'bg-green-500' : ''}>
                            {getStatusText(server.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'servers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Мои серверы</h2>
              <Button onClick={() => setActiveView('create')} className="bg-green-500 hover:bg-green-600">
                <Icon name="Plus" size={20} className="mr-2" />
                Создать сервер
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map(server => (
                <Card key={server.id} className="hover:shadow-lg transition-all border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {server.edition === 'java' ? 'Java Edition' : 'Bedrock Edition'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                        <span className="text-sm font-medium">{getStatusText(server.status)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <Icon name="Box" className="text-green-600" size={32} />
                      <div>
                        <CardTitle className="text-xl">{server.name}</CardTitle>
                        <CardDescription>{server.version}</CardDescription>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="Globe" size={16} />
                        <span>{server.ip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="Users" size={16} />
                        <span>{server.players.current}/{server.players.max} игроков</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => {
                        setSelectedServer(server);
                        setActiveView('panel');
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Icon name="Settings" size={16} className="mr-2" />
                      Управление
                    </Button>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => handleServerAction(server.id, 'start')}
                        disabled={server.status === 'online'}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Icon name="Play" size={16} />
                      </Button>
                      <Button
                        onClick={() => handleServerAction(server.id, 'stop')}
                        disabled={server.status === 'offline'}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Icon name="Square" size={16} />
                      </Button>
                      <Button
                        onClick={() => handleServerAction(server.id, 'restart')}
                        disabled={server.status === 'offline'}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Icon name="RotateCw" size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeView === 'create' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Создать новый сервер</CardTitle>
                <CardDescription>Настройте свой бесплатный Minecraft сервер</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="server-name">Название сервера</Label>
                  <Input id="server-name" placeholder="Мой крутой сервер" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server-ip">Буквенный IP адрес</Label>
                  <Input id="server-ip" placeholder="myserver.mcpanel.net" />
                  <p className="text-xs text-gray-500">Уникальный адрес для подключения к серверу</p>
                </div>

                <div className="space-y-2">
                  <Label>Издание</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-2 border-green-500 bg-green-50 cursor-pointer hover:shadow-md transition-all">
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                          <Icon name="Box" className="text-green-600" size={24} />
                          <div>
                            <CardTitle className="text-sm">Java Edition</CardTitle>
                            <CardDescription className="text-xs">ПК версия</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                    <Card className="border-2 cursor-pointer hover:shadow-md transition-all">
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                          <Icon name="Smartphone" className="text-gray-600" size={24} />
                          <div>
                            <CardTitle className="text-sm">Bedrock Edition</CardTitle>
                            <CardDescription className="text-xs">Мобильная версия</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Версия сервера</Label>
                  <Select defaultValue="1.20.1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.20.1">1.20.1 (Последняя)</SelectItem>
                      <SelectItem value="1.19.4">1.19.4</SelectItem>
                      <SelectItem value="1.18.2">1.18.2</SelectItem>
                      <SelectItem value="1.16.5">1.16.5</SelectItem>
                      <SelectItem value="1.12.2">1.12.2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Поддерживаемые версии клиентов</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['1.20.x', '1.19.x', '1.18.x', '1.16.5', '1.12.2', '1.9-1.21'].map(version => (
                      <div key={version} className="flex items-center space-x-2">
                        <Checkbox id={version} />
                        <label htmlFor={version} className="text-sm cursor-pointer">{version}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-players">Максимум игроков</Label>
                  <Select defaultValue="20">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 игроков</SelectItem>
                      <SelectItem value="20">20 игроков</SelectItem>
                      <SelectItem value="50">50 игроков</SelectItem>
                      <SelectItem value="100">100 игроков</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg py-6">
                  <Icon name="Rocket" size={20} className="mr-2" />
                  Создать сервер
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'panel' && selectedServer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setActiveView('servers')}>
                  <Icon name="ArrowLeft" size={20} />
                </Button>
                <div>
                  <h2 className="text-3xl font-bold">{selectedServer.name}</h2>
                  <p className="text-gray-600">{selectedServer.ip}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={selectedServer.status === 'online' ? 'default' : 'secondary'}
                       className={selectedServer.status === 'online' ? 'bg-green-500' : ''}>
                  {getStatusText(selectedServer.status)}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleServerAction(selectedServer.id, 'start')}
                    disabled={selectedServer.status === 'online'}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Icon name="Play" size={16} className="mr-2" />
                    Запустить
                  </Button>
                  <Button
                    onClick={() => handleServerAction(selectedServer.id, 'stop')}
                    disabled={selectedServer.status === 'offline'}
                    variant="destructive"
                  >
                    <Icon name="Square" size={16} className="mr-2" />
                    Остановить
                  </Button>
                  <Button
                    onClick={() => handleServerAction(selectedServer.id, 'restart')}
                    disabled={selectedServer.status === 'offline'}
                    variant="outline"
                  >
                    <Icon name="RotateCw" size={16} className="mr-2" />
                    Перезагрузка
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="console" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="console">
                  <Icon name="Terminal" size={16} className="mr-2" />
                  Консоль
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <Icon name="FileText" size={16} className="mr-2" />
                  Логи
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Icon name="Settings" size={16} className="mr-2" />
                  Настройки
                </TabsTrigger>
                <TabsTrigger value="ftp">
                  <Icon name="FolderOpen" size={16} className="mr-2" />
                  FTP
                </TabsTrigger>
                <TabsTrigger value="players">
                  <Icon name="Users" size={16} className="mr-2" />
                  Игроки
                </TabsTrigger>
              </TabsList>

              <TabsContent value="console">
                <Card>
                  <CardHeader>
                    <CardTitle>RCON Консоль</CardTitle>
                    <CardDescription>Управляйте сервером через команды</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                      {consoleLog.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={rconCommand}
                        onChange={(e) => setRconCommand(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && executeRconCommand()}
                        placeholder="Введите команду..."
                        className="font-mono"
                      />
                      <Button onClick={executeRconCommand} className="bg-green-500 hover:bg-green-600">
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle>Логи сервера</CardTitle>
                    <CardDescription>Просмотр всех событий сервера</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                      <div>[2024-01-15 12:00:00] [INFO] Starting server...</div>
                      <div>[2024-01-15 12:00:05] [INFO] Server started on port 25565</div>
                      <div>[2024-01-15 12:01:23] [INFO] Player Steve joined</div>
                      <div>[2024-01-15 12:05:11] [INFO] Player Alex joined</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Настройки сервера</CardTitle>
                    <CardDescription>Конфигурация server.properties</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="motd">MOTD (описание сервера)</Label>
                      <Input id="motd" defaultValue="Welcome to my server!" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gamemode">Игровой режим</Label>
                      <Select defaultValue="survival">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="survival">Выживание</SelectItem>
                          <SelectItem value="creative">Творчество</SelectItem>
                          <SelectItem value="adventure">Приключение</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Сложность</Label>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="peaceful">Мирная</SelectItem>
                          <SelectItem value="easy">Легкая</SelectItem>
                          <SelectItem value="normal">Нормальная</SelectItem>
                          <SelectItem value="hard">Сложная</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Icon name="Save" size={16} className="mr-2" />
                      Сохранить настройки
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ftp">
                <Card>
                  <CardHeader>
                    <CardTitle>FTP Доступ</CardTitle>
                    <CardDescription>Управление файлами сервера</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Хост:</span>
                        <span className="text-gray-600">ftp.mcpanel.net</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Порт:</span>
                        <span className="text-gray-600">21</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Логин:</span>
                        <span className="text-gray-600">server_{selectedServer.id}</span>
                      </div>
                      <Button variant="outline" className="w-full mt-2">
                        <Icon name="Copy" size={16} className="mr-2" />
                        Скопировать данные
                      </Button>
                    </div>

                    <div className="border rounded-lg">
                      <div className="p-3 border-b bg-gray-50 font-medium">Файлы сервера</div>
                      <div className="divide-y">
                        {['plugins/', 'world/', 'server.properties', 'whitelist.json'].map((file) => (
                          <div key={file} className="p-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Icon name={file.endsWith('/') ? 'Folder' : 'FileText'} size={16} className="text-gray-500" />
                              <span>{file}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Icon name="Download" size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="players">
                <Card>
                  <CardHeader>
                    <CardTitle>Игроки онлайн</CardTitle>
                    <CardDescription>{selectedServer.players.current}/{selectedServer.players.max} игроков</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Steve', 'Alex'].map((player) => (
                        <div key={player} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg" />
                            <div>
                              <div className="font-medium">{player}</div>
                              <div className="text-xs text-gray-500">Играет 2 часа 15 минут</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Icon name="MessageSquare" size={16} />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Icon name="UserX" size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
