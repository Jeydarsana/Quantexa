import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quantlensRouter from "./quantlens";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quantlensRouter);

export default router;
