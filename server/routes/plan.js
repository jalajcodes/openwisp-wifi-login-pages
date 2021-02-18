import { Router } from "express";
import getPlans from "../controllers/get-plans";

const router = Router({ mergeParams: true });

router.get("/", getPlans);

export default router;
