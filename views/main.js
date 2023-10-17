
const {ipcRenderer} = require('electron');


let createInterval;


const handleCreate = () => {
    const url = document.location.href.trim().toLowerCase();
    if (!url.startsWith('https://www.bing.com/images/create')) return;
    
    const nodes = document.querySelectorAll('#girrcc a.girr_set');
    for (const node of nodes) node.href = 'javascript:void(0)';

    if (sessionStorage.getItem('bing-image-creator.started') === '1') {
        setInterval(handlePrompts, 30000), handlePrompts();
    } 
    setInterval(handleImages, 10000);
}

const generateExists = () => {
    const element = document.getElementById('create_btn_c');
    return !!element; 
}

const generateEnabled = () => {
    const element = document.getElementById('create_btn_c');
    return element && !element.classList.contains('disabled'); 
}

const generateProgress = () => {
    const element = document.getElementById('create_btn');
    return element && element.textContent === 'Creating';
}

const generateImages = async (prompt) => {
    if (!generateExists() || generateProgress()) return;

    const query = document.querySelector('input[name="q"]') || document.querySelector('textarea[name="q"]');
    query.value = prompt;
    query.dispatchEvent(new Event('change', {bubbles: true}));

    const generate = document.getElementById('create_btn_c');
    generate.click();
}

const handlePrompts = async () => {
    if (!generateExists() || generateProgress()) {
        window.refreshPage = window.refreshPage || setTimeout(() => { 
            sessionStorage.setItem('bing-image-creator.refresh', '0'); // Unsafe script workaround
            location.reload();  // Workaround for already finished creations stuck on server side
        }, 60000); return; 
    }
    window.refreshPage && clearTimeout(window.refreshPage);

    await handleImages(); // Save if not saved yet

    if (sessionStorage.getItem('bing-image-creator.refresh') !== '1') {
        ipcRenderer.invoke('prompt').then(prompt => {
            if (prompt === '__LIMIT_REACHED__') {
                sessionStorage.setItem('bing-image-creator.started', '0'); // Start will be needed again
                clearInterval(createInterval);
            } else if ((prompt || '').trim() !== '') {
                sessionStorage.setItem('bing-image-creator.refresh', '1'); // Unsafe script workaround
                generateImages(prompt.trim());
            } else {
                const error = new Error('No prompt was received, you should check your templates');
                ipcRenderer.invoke('logerror', error);
            }
        });
    } else {
        sessionStorage.setItem('bing-image-creator.refresh', '0'); // Unsafe script workaround
        location.reload();
    }
}

const handleImages = async () => {
    const links = document.querySelectorAll('div#gir_async a[href*="/images/create');
    for (const link of links) {
        const marker = sessionStorage.getItem(`bing-image-creator.download.${link.href}`);
        if ((marker || '') !== '') continue;
        
        const img = link.querySelector('img.mimg') || link.querySelector('img.gir_mimg');
        sessionStorage.setItem(`bing-image-creator.download.${link.href}`, '0');
        ipcRenderer.invoke('open', {
            href: link.href,
            info: img && img.getAttribute('alt') || 'Warning: no image info, might be a bug'
        }).then(() => {
            sessionStorage.setItem(`bing-image-creator.download.${link.href}`, '1');
        });
    }
}


window.addEventListener('load', () => {
    setTimeout(handleCreate, 1000);
});


ipcRenderer.on('generate', (e, message) => {
    switch (message.command) {
        case 'start':
            sessionStorage.setItem('bing-image-creator.started', '1');
            createInterval = setInterval(handlePrompts, 30000), handlePrompts(); 
            break;
        case 'stop':
            sessionStorage.setItem('bing-image-creator.started', '0');
            clearInterval(createInterval);
            break;
    }
});
