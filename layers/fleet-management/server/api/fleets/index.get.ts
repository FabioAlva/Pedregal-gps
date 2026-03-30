import { db } from "@nuxthub/db";
import { FleetService } from "../../services/Fleet/Fleet.service";

export default defineEventHandler(async () => {
  const service = new FleetService(db);
  return await service.getAllFleets();
});