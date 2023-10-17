
const {app, BrowserWindow, Menu, ipcMain, session, dialog} = require('electron');

require('dotenv').config({path: './resources/application.env'});

const path = require('node:path'), fs = require('node:fs');


const stripJSONComments = (data) => {
    var re = new RegExp('\/\/(.*)', 'g');
    return data.replace(re, '');
}


const templates = [];
const database = {};

const Prompter = require('./sources/prompter');
const prompter = new Prompter(database);


const reloadData = () => {
    const re$data = JSON.parse(fs.readFileSync(path.join(__dirname, './resources/database.json')));
    const re$temp = JSON.parse(fs.readFileSync(path.join(__dirname, './resources/templates.json')));

    for (const key in database) database[key] = undefined;
    for (const key in re$data) database[key] = re$data[key];

    templates.length = 0, templates.push(...re$temp), index = -1;

    return {database, templates};
}


let index = -1;
let counter = 0; 
const limit = Number(process.env.LIMIT || '25');


app.on('ready', async () => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47';
        details.requestHeaders['Sec-Ch-Ua'] = '"Microsoft Edge";v="117", "Not;A=Brand";v="8", "Chromium";v="117"';
        callback({ cancel: false, requestHeaders: details.requestHeaders }); // Go for the Edge bonus reward points
    });

    let window = new BrowserWindow({
        width: 1365,
        height: 900,
        title: 'Image Creator from Microsoft Bing',
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: true,
            preload: path.join(__dirname, "./views/main.js") 
        }
    });
    window.on('closed', function() {
        app.quit();
    });
    window.webContents.session.clearCache().finally(() => {
        window.loadURL('https://www.bing.com/images/create');
    });

    
    const {template, fileMenu} = require('./menu'); 
    
    fileMenu().submenu.unshift(...[
        {
            label: 'Sync Data',
            accelerator: 'CommandOrControl+S',
            click: reloadData
        },
		{ 
            type: "separator" 
        }
    ]);

    template.push({
        label: 'Run',
        submenu: [
            {
                label: 'Start',
                click: async () => {
                    window.webContents.send('generate', {"command": "start"});
                }
            },
            {
                label: 'Stop',
                click: async () => {
                    counter = 0;
                    window.webContents.send('generate', {"command": "stop"});
                }
            },
            {
                label: 'Pause',
                click: async () => {
                    window.webContents.send('generate', {"command": "stop"});
                }
            },
            {
                label: 'Rewind',
                click: async () => {
                    index = -1;
                }
            },
            {
                label: 'Restart',
                click: async () => {
                    window.webContents.send('generate', {"command": "stop"});
                    index = -1; counter = 0;
                    window.webContents.send('generate', {"command": "start"});
                }
            }
        ]
    }, {
        label: 'Account',
        submenu: [
            {
                label: 'Home',
                accelerator: 'CommandOrControl+H',
                click: async () => {
                    window.loadURL('https://www.bing.com/images/create');
                }
            },
            {
                label: 'Logout',
                accelerator: 'CommandOrControl+L',
                click: async () => {
                    const returnUrl = encodeURIComponent('https://www.bing.com/images/create');
                    const cookie = (await window.webContents.session.cookies.get({url: 'https://www.bing.com', name: '_SS'})).shift();
                    const signature = cookie.value.split('&').find(item => item.startsWith('SID=')) || 'SID=';
                    window.loadURL(`https://www.bing.com/fd/auth/signout?provider=windows_live_id&return_url=${returnUrl}&${signature.replace('SID=', 'sig=')}`);
                }
            }
        ]
    }); 
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    try { reloadData(); } catch(e) { dialog.showErrorBox('Error in template file', e.message); }
});


ipcMain.handle('prompt', async () => {
    if (++counter > limit) return counter = 0, '__LIMIT_REACHED__';
    
    if (process.env.RAND !== 'true') {
        return prompter.evaluate(templates[index = (index + 1) % templates.length]);
    } else {
        return prompter.evaluate(templates[Math.floor(Math.random()*templates.length)]);
    }
});


const windows = {};
ipcMain.handle('open', async (e, link) => {
    console.log('Downloading image:', link.info);
    const window = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: true,
            preload: path.join(__dirname, "./views/image.js") 
        }
    });
    windows[link.href] = window, 
    window.loadURL(link.href);
});


const download = require('./sources/download');
ipcMain.handle('download', async (e, image) => {
    // const extension = image.src.split('.').pop(); 
    const filename = image.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 192-5-image.uid.length) + '_' + image.uid + '.jpg';
    await download(image.src, path.join(path.normalize(process.env.DEST || './images'), filename));
    
    if (windows[image.href] !== undefined) {
        await windows[image.href].close(); 
        delete windows[image.href];
    }
});


ipcMain.handle('logerror', async (e, error) => {
    console.error(error.message);
    if (windows[error.source] !== undefined) {
        await windows[error.source].close(); 
        delete windows[error.source];
    }
});
