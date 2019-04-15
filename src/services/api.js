import axios from 'axios';

const api = axios.create({
  baseURL: 'https://omnistack-backend-node.herokuapp.com/',
});

export default api;
