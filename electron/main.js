const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { startServer, getServerInfo } = require('../backend/server');

let mainWindow;
let tray;
let serverInfo = null;

async function createWindow() {
    try {
        // Iniciar servidor backend
        serverInfo = await startServer();
        console.log(`Servidor iniciado em http://localhost:${serverInfo.port}`);

        // Criar janela principal
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            icon: path.join(__dirname, 'icon.ico'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            show: false
        });

        // Carregar aplicação
        mainWindow.loadURL(`http://localhost:${serverInfo.port}`);

        // Mostrar quando estiver pronta
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();

            // Abrir DevTools apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                mainWindow.webContents.openDevTools();
            }
        });

        // Minimizar para bandeja ao invés de fechar
        mainWindow.on('close', (event) => {
            if (!app.isQuitting) {
                event.preventDefault();
                mainWindow.hide();
            }
        });

        createTray();
        createMenu();

    } catch (error) {
        console.error('Erro ao iniciar aplicação:', error);
        dialog.showErrorBox(
            'Erro ao Iniciar',
            `Não foi possível iniciar o servidor: ${error.message}`
        );
        app.quit();
    }
}

function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    tray = new Tray(iconPath);

    const updateTrayMenu = () => {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Sistema de Escrituras',
                enabled: false,
                icon: iconPath
            },
            { type: 'separator' },
            {
                label: '📡 Servidor Ativo',
                enabled: false
            },
            {
                label: `🔗 http://localhost:${serverInfo?.port || '...'}`,
                click: () => {
                    require('electron').shell.openExternal(`http://localhost:${serverInfo.port}`);
                }
            },
            {
                label: `🌐 Rede: ${serverInfo?.networkIp || 'Carregando...'}`,
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Abrir Sistema',
                click: () => {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
            {
                label: 'Sobre',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Sobre',
                        message: 'Sistema de Controle de Escrituras',
                        detail: `Versão: ${app.getVersion()}\n\nDesenvolvido por:\nIago Feitosa\nFeitosa Soluções em Informática\n\n© 2026 Todos os direitos reservados.`,
                        buttons: ['OK']
                    });
                }
            },
            { type: 'separator' },
            {
                label: 'Sair',
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setContextMenu(contextMenu);
    };

    updateTrayMenu();
    tray.setToolTip('Sistema de Escrituras - Servidor Ativo');

    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

function createMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Minimizar para Bandeja',
                    click: () => mainWindow.hide()
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.isQuitting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                { role: 'undo', label: 'Desfazer' },
                { role: 'redo', label: 'Refazer' },
                { type: 'separator' },
                { role: 'cut', label: 'Recortar' },
                { role: 'copy', label: 'Copiar' },
                { role: 'paste', label: 'Colar' },
                { role: 'selectAll', label: 'Selecionar Tudo' }
            ]
        },
        {
            label: 'Visualizar',
            submenu: [
                { role: 'reload', label: 'Recarregar' },
                { role: 'forceReload', label: 'Forçar Recarga' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom Padrão' },
                { role: 'zoomIn', label: 'Aumentar Zoom' },
                { role: 'zoomOut', label: 'Diminuir Zoom' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Tela Cheia' }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre',
                            message: 'Sistema de Controle de Escrituras',
                            detail: `Versão: ${app.getVersion()}\n\nDesenvolvido por:\nIago Feitosa\nFeitosa Soluções em Informática\n\n© 2026 Todos os direitos reservados.`,
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Eventos do app
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // No Windows, manter app rodando em background
    if (process.platform !== 'darwin') {
        // Não fazer nada, app continua rodando
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Prevenir múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
