# TRAVEL REVENUE NETWORK — ROLLBACK PROCEDURES

## Fast Rollback Checklist

1. **Disable Public Travel Endpoints**:
   - In `server/_core/index.ts`, comment out `registerTravelRoutes(app)` if endpoint issues arise.
2. **Disable Token Signing**:
   - Unset `TRAVEL_JOURNEY_SECRET` environment variable to switch system to degraded status without code rollback.
3. **Database Reversion**:
   - Standard Drizzle migration rollback.
