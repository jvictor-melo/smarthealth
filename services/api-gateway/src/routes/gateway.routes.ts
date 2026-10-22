import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
// aqui import do user-services 

const router = Router();

router.use(
    "/users",
    createProxyMiddleware({
        target: services.users,
        changeOrigin: true,
    }),
);