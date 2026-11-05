import { env } from "./env.js";

export const services = {
    cnes: {
        name: "cnes-service",
        url: env.CNES_SERVICE_URL,
    },

    users: {
        name: "user-service",
        url: env.USER_SERVICE_URL,
    },
} as const;