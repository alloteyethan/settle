import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sellersRouter from "./sellers";
import dealsRouter from "./deals";
import disputesRouter from "./disputes";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import paystackRouter from "./paystack";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sellersRouter);
router.use(dashboardRouter);
router.use(dealsRouter);
router.use(disputesRouter);
router.use(activityRouter);
router.use(adminRouter);
router.use(paystackRouter);

export default router;
