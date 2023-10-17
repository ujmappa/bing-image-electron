
const {ipcRenderer} = require('electron');


const handleImage = () => {
    const image = document.querySelector('div.imgContainer img');
    if (image === undefined || image === null) {
        ipcRenderer.invoke('logerror', {
            message: `Cannot find image on url ${document.location.href}`,
            source: document.location.href
        }); return;
    }

    const title = document.querySelector('span.ptitle');
    ipcRenderer.invoke('download', {
        href: document.location.href,
        src: image.src,
        prompt: title && title.textContent || '',
        uid: '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    });
}


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(handleImage, 2000);
});

window.addEventListener('load', () => {
    // setTimeout(handleImage, 2000);
});
