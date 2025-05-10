# Routes Comparison between entrypoint.js and server/routes.ts

## Routes in entrypoint.js
1. GET `/api/health-check`
2. GET `/api/health`
3. GET `/api/rfps`
4. GET `/api/user`
5. POST `/api/login`
6. POST `/api/logout`
7. GET `/api/rfps/:id`
8. GET `/api/rfps/:id/rfi`
9. POST `/api/rfps/:id/rfi`
10. GET `/api/rfis`
11. GET `/api/analytics/rfp/:id`
12. GET `/api/analytics/boosted`
13. GET `*` (catch-all for SPA)

## Routes in server/routes.ts (including payments router)
1. POST `/api/upload`
2. GET `/api/rfps`
3. GET `/api/rfps/featured`
4. GET `/api/rfps/:id`
5. POST `/api/rfps`
6. PUT `/api/rfps/:id`
7. DELETE `/api/rfps/:id`
8. GET `/api/employees`
9. POST `/api/employees`
10. DELETE `/api/employees/:id`
11. POST `/api/user/settings`
12. POST `/api/user/deactivate`
13. DELETE `/api/user`
14. GET `/api/analytics/boosted`
15. POST `/api/analytics/track-view`
16. GET `/api/analytics/rfp/:id`
17. POST `/api/rfps/:id/rfi`
18. GET `/api/rfps/:id/rfi`
19. GET `/api/rfis`
20. POST `/api/user/onboarding`
21. PUT `/api/rfps/:rfpId/rfi/:rfiId/status`
22. POST `/api/payments/create-payment-intent`
23. POST `/api/payments/confirm-payment`
24. GET `/api/payments/price`
25. GET `/api/payments/status/:paymentIntentId`

## Missing Routes in entrypoint.js (need to be added)
1. POST `/api/upload`
2. GET `/api/rfps/featured`
3. POST `/api/rfps`
4. PUT `/api/rfps/:id`
5. DELETE `/api/rfps/:id`
6. GET `/api/employees`
7. POST `/api/employees`
8. DELETE `/api/employees/:id`
9. POST `/api/user/settings`
10. POST `/api/user/deactivate`
11. DELETE `/api/user`
12. POST `/api/analytics/track-view`
13. POST `/api/user/onboarding`
14. PUT `/api/rfps/:rfpId/rfi/:rfiId/status`
15. GET `/api/payments/price`
16. POST `/api/payments/create-payment-intent`
17. POST `/api/payments/confirm-payment`
18. GET `/api/payments/status/:paymentIntentId`

## Missing Routes in server/routes.ts (possibly removed or consolidated)
1. GET `/api/health-check` (likely redundant with `/api/health`)
2. GET `/api/user` (needs to be added)
3. POST `/api/login` (needs to be added)
4. POST `/api/logout` (needs to be added)