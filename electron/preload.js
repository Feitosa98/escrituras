const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electron', {
    // Informações do sistema
    getVersion: () => ipcRenderer.invoke('get-version'),

    // Notificações
    showNotification: (title, body) => {
        new Notification(title, { body });
    }
});
