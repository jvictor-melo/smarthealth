
import { Router } from "express";

import cnesRoutes from "./cnes.routes.js";

const router = Router();

router.use(cnesRoutes);

export default router;
