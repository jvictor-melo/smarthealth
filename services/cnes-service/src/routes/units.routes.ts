import { Router } from "express";
import * as unitsController from "../controllers/units.controller.js";

const router = Router();

router.get("/health", unitsController.health);
router.get("/units", unitsController.listarUnidades);
router.get("/units/:codigoCnes", unitsController.buscarUnidade);
router.get("/unit-types", unitsController.listarTipos);

export default router;
