import { displayNotification } from './components/notification.js';

const BASE_URL = window.location.origin;

const handleError = (result) => {
  if (result.status === 200) return;
  // if (result.status === 401) {
  //   window.location.pathname = '/login';
  //   return;
  // }

  displayNotification(
    false,
    result.status === 400
      ? result.message
      : "Unexpected server error. Couldn't finish action."
  );
};

const sendData = async (endpoint, type, data) => {
  const url = `${BASE_URL}/api${endpoint}`;
  console.log(type, url);
  const options = {
    method: type,
    headers: {
      Accept: 'application/json',
      // Authorization: 'test',
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(data),
  };
  const response = await (await fetch(url, options)).json();
  handleError(response);
  return response;
};

const getData = async (endpoint) => {
  const url = `${BASE_URL}/api${endpoint}`;
  const options = {
    method: 'GET',
    headers: {
      // Authorization: 'test',
    },
  };

  const response = await (await fetch(url, options)).json();
  handleError(response);
  return response;
};

export { sendData, getData };
