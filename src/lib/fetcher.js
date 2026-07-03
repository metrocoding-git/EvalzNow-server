import api from "./api";

const fetcher = (url) => api.get(url).then((res) => res.data);

export default fetcher;