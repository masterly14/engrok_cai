import axios from "axios";

// ── LOG GLOBAL DE AXIOS ────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  // Petición saliente
  axios.interceptors.request.use((req) => {
    const { method, url, params, data } = req;
    console.log("[Axios][Request]", method?.toUpperCase(), url, {
      params,
      data,
    });
    return req;
  });

  // Respuesta o error
  axios.interceptors.response.use(
    (res) => {
      console.log("[Axios][Response]", res.status, res.config.url);
      return res;
    },
    (err) => {
      console.error(
        "[Axios][Error]",
        err.config?.url,
        err.response?.status ?? "NO_STATUS",
        err.response?.data ?? err.message,
      );
      throw err;
    },
  );
}
