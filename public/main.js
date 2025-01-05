const authenticated = document.getElementById('authenticated');
const unauthenticated = document.getElementById('unauthenticated');
const qrContainer = document.getElementById('qr');
const qrImage = document.getElementById('qr-image');
const qrLoading = document.getElementById('qr-loading');
const qrReload = document.getElementById('qr-reload');
const content = document.getElementById('content');
const contentLoading = document.getElementById('content-loading');
const userName = document.getElementById('user-name');
const userDescription = document.getElementById('user-description');
const userAvater = document.getElementById('user-avatar');

const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');

  socket.emit('events', { action: 'register' });
});

socket.on('events', function (data) {
  const { status, qr = undefined, user = undefined } = data;

  content.style.display = 'block';
  contentLoading.style.display = 'none';

  switch (status) {
    case 'connecting':
      setAuthenticated(false, { qr: undefined });
      break;
    case 'unauthenticated':
      setAuthenticated(false, { qr });
      break;
    case 'authenticated':
      setAuthenticated(true, { user });
      break;
  }
});

socket.on('exception', function (e) {
  console.log(e);
  if (e === 'unauthenticated') {
  }
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

document.getElementById('logout').addEventListener('click', function () {
  socket.emit('events', { action: 'logout' });
});

qrReload.addEventListener('click', function () {
  socket.emit('events', { action: 'login' });
});

function setAuthenticated(loggedIn = false, data = undefined) {
  if (loggedIn) {
    unauthenticated.style.display = 'none';
    authenticated.style.display = 'flex';

    const { user } = data ?? { user: {} };

    let id = user.id.split(':');
    id = id[0].split('@');
    id = id[0];

    userName.innerHTML = user.name?.length ? user.name : 'unknown';
    userDescription.innerHTML = id;
    if (user.imgUrl) {
      userAvater.src = user.imgUrl;
    }

    return;
  }

  unauthenticated.style.display = 'flex';
  authenticated.style.display = 'none';

  if (data?.qr) {
    qrLoading.style.display = 'none';
    qrContainer.style.display = 'block';

    if (data.qr === 'timeout') {
      qrReload.style.display = 'block';
      return;
    }

    qrReload.style.display = 'none';

    qrImage.src = data.qr;
  } else {
    qrLoading.style.display = 'block';
    qrContainer.style.display = 'none';
  }
}
