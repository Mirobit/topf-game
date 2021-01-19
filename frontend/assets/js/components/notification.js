import Store from '../store.js';

const displayNotification = (success, message) => {
  if (success === true) {
    Store.messageNode.innerHTML = `<div class="alert alert-success alert-dismissible" role="alert"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>${message}</div>`;
  } else {
    Store.messageNode.innerHTML = `<div class="alert alert-warning alert-dismissible" role="alert"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>${message}</div>`;
  }
};

const closeNotification = () => {
  document.getElementById('message').innerHTML = '';
};

export { displayNotification, closeNotification };
