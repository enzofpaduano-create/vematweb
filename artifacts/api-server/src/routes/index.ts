import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import cataloguesRouter from "./catalogues";
import notifyRouter from "./notify";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(cataloguesRouter);
router.use(notifyRouter);
router.use(reportsRouter);

export default router;
