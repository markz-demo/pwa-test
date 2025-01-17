window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn1').onclick = requestPermission;
    document.getElementById('btn2').onclick = registWorker;
    document.getElementById('btn3').onclick = showNotification;
    document.getElementById('btn4').onclick = showNotification2;

    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');

    alert(`page=${page}`)

    // switch (page) {
    //     case 'profile':
    //         // 跳转到 /profile.html 或在当前页面加载 profile 内容
    //         window.location.href = '/profile.html';  // 示例：跳转到新页面
    //         break;
    //     case 'settings':
    //         // 跳转到 /settings.html 或在当前页面加载 settings 内容
    //         window.location.replace('/settings.html'); // 示例：替换当前历史记录
    //         break;
    //     default:
    //         // 显示默认内容
    //         console.log('Loading default content');
    // }
});

const msgs = [];
function log(msg, type) {
    // msgs.push(msg)
    const dom = document.createElement('div')
    dom.innerText = msg
    if (type === 'error') {
        dom.style.color = 'red'
    }
    document.getElementById('log-div').append(dom)
}

// 将 base64 url 转换为 Uint8Array
const publicVapidKey = 'BPMeC-iWoWVZly-9ktdliNr5IMM-QbeS0A5OoxHKTcJsySRwnYESVIL-qtmw_yY4kV6D6eJxPTWeyjziiSRgUZo'; // 后端生成的 VAPID 公钥

function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const hasPermission = () => Notification.permission === 'granted'
function requestPermission() {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            log('Notification permission granted.');
        } else {
            log('Notification permission denied.', 'error');
        }
    })
}

async function registWorker() {
    try {
        // let registration = await navigator.serviceWorker.getRegistration('/')
        // if (registration) {
        //     log('ServiceWorker registration exist.')
        //     return;
        // }

        const registration = await navigator.serviceWorker.register(`/pwa-test/service-worker.js`, { scope: '/pwa-test/' });
        log('ServiceWorker registration successful with scope: ' + registration.scope);
    }
    catch (e) {
        log('ServiceWorker registration failed: ' + e, 'error');
    }
}

navigator.serviceWorker.addEventListener('message', function (e) {
    const action = e.data;
    log(`receive post-message from sw, action is '${action}'`);
    switch (action) {
        case 'notification:alert': {
            alert(`notification alert`);
            break;
        }
        case 'notification:redirect-to-demo-page': {
            location.href = '/pwa-test/sub';
            break;
        }
    }
});

// todo
async function subscribe() {
    const registration = await navigator.serviceWorker.getRegistration('/pwa-test/')
    if (!registration) {
        log('cannot found registration')
        return;
    }
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        log('subscription exist')
        return;
    }
    subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(publicVapidKey)
    });
    log('subscribe done')

    const rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
    const key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
    const rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
    const authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

    return fetch('./register', {
        method: 'post',
        headers: new Headers({
            'content-type': 'application/json'

        }),
        body: JSON.stringify({
            endpoint: subscription.endpoint,
            key: key,
            authSecret: authSecret,
        }),
    });
}

async function showNotification() {
    if (!hasPermission()) {
        log('need request permission first.', 'error')
        return
    }

    const registration = await navigator.serviceWorker.getRegistration('/pwa-test/')
    if (!registration) {
        log('cannot found registration, need regist ServiceWorker first.')
        return;
    }

    registration.showNotification('test notify title 1', {
        body: 'click me to focus win.',
        tag: 'default',
    })

    // registration.active.postMessage(
    //     "Test message sent immediately after creation",
    // );

    // const registration = await navigator.serviceWorker.ready;
    // registration.showNotification('my title 2', {
    //     body: 'my body',
    // })
}

async function showNotification2() {
    if (!hasPermission()) {
        log('need request permission first.', 'error')
        return
    }

    const registration = await navigator.serviceWorker.getRegistration('/pwa-test/')
    if (!registration) {
        log('cannot found registration, need regist ServiceWorker first.')
        return;
    }

    registration.showNotification('test notify title 2', {
        body: 'click me redirect to demo page.',
        actions: [
            {
                action: "alert",
                title: "alert",
            },
            {
                action: "redirect-to-demo-page",
                title: "redirect to demo page",
            },
        ],
        tag: 'custom',
    })
}

// self.addEventListener('notificationclick', function (event) {
//     console.log(`[web] notificationclick event`, `tag=${event.notification.tag}`, `action=${event.action}`);
//     event.notification.close();
// });

// function doSubscribe() {
//     navigator.serviceWorker.ready.then(function (registration) {
//         log('serviceWorker.ready')
//         const applicationServerKey = urlB64ToUint8Array(publicVapidKey);
//         registration.pushManager.subscribe({
//             userVisibleOnly: true,
//             applicationServerKey: applicationServerKey
//         }).then(function (subscription) {
//             log('User is subscribed:' + subscription.toJSON());

//             fetch("/subscribe", {
//                 method: "POST",
//                 body: JSON.stringify(subscription),
//                 headers: {
//                     "content-type": "application/json"
//                 }
//             });

//         }).catch(function (error) {
//             log('Failed to subscribe the user:' + error);
//         });
//     });
// }

// webpush
// function pushMessage(subscription, data = {}) {
//     console.log('subscription', subscription)
//     webpush.sendNotification(subscription, data, {
//         proxy: '',
//     }).then(data => {
//         log('push service的相应数据:' + JSON.stringify(data));
//         return;
//     }).catch(err => {
//         // 判断状态码，440和410表示失效
//         // if (err.statusCode === 410 || err.statusCode === 404) {
//         // }
//         log(err);
//     })

// }
