/**
 * Default configurations
 */


export default {
  home: process.env.FBRS_HOME || process.env.HOME,
  ip: process.env.FBRS_IP || "127.0.0.1",
  port: Number(process.env.FBRS_PORT) || 9432,
  adapter: process.env.FBRS_ADAPTER || "sails-disk",
  adapterConfig: {},
};
