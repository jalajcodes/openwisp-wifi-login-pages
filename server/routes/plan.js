import { Router } from "express";
import getPlans from "../controllers/getPlans";

const router = Router({ mergeParams: true });

router.get("/", getPlans);

export default router;
