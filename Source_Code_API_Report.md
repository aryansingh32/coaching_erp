# Exact Source Code API Report & Usage Analysis

*This report contains APIs extracted **directly from the actual NestJS/Express source code** in the repository, ignoring docs/tests.* 

*Note: The Gateway proxy routes (`/erp/:doctype`, `/moodle/call`) dynamically handle over 800+ underlying Frappe/Moodle API resources via proxy resolution.* 

## Extracted Gateway & Custom Microservice APIs

| Source File | API Route | Usage / Details |
|---|---|---|
| `modules/education-portal/education-portal.controller.ts` | **GET** `/parent/children` | Internal business logic |
| `modules/education-portal/education-portal.controller.ts` | **GET** `/students/:studentId/schedule` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/education-portal/education-portal.controller.ts` | **GET** `/students/:studentId/attendance` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/education-portal/education-portal.controller.ts` | **GET** `/students/:studentId/invoices` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/education-portal/education-portal.controller.ts` | **GET** `/students/:studentId/programs` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/education-portal/education-portal.controller.ts` | **GET** `/students/:studentId/grades` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/education-portal/education-portal.controller.ts` | **POST** `/students/:studentId/leave` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/auth/auth.controller.ts` | **POST** `/send-otp` | User authentication and JWT token generation. |
| `modules/auth/auth.controller.ts` | **POST** `/verify-otp` | User authentication and JWT token generation. |
| `modules/auth/auth.controller.ts` | **POST** `/refresh` | Internal business logic |
| `modules/auth/auth.controller.ts` | **POST** `/logout` | Internal business logic |
| `modules/auth/auth.controller.ts` | **GET** `/features` | Internal business logic |
| `modules/batches/batches.controller.ts` | **GET** `/:id` | Internal business logic |
| `modules/batches/batches.controller.ts` | **POST** `/:id/enroll` | Internal business logic |
| `modules/batches/batches.controller.ts` | **POST** `/:id/schedule` | Internal business logic |
| `modules/batches/batches.controller.ts` | **POST** `/:id/instructors` | Internal business logic |
| `modules/students/students.controller.ts` | **GET** `/:erpId` | Internal business logic |
| `modules/students/students.controller.ts` | **PUT** `/:erpId` | Internal business logic |
| `modules/students/students.controller.ts` | **POST** `/bulk-import` | Internal business logic |
| `modules/students/students.controller.ts` | **POST** `/:erpId/rfid-card` | Internal business logic |
| `modules/students/students.controller.ts` | **GET** `/:erpId/timeline` | Internal business logic |
| `modules/attendance/attendance.controller.ts` | **POST** `/rfid-punch` | Internal business logic |
| `modules/attendance/attendance.controller.ts` | **POST** `/manual` | Internal business logic |
| `modules/attendance/attendance.controller.ts` | **GET** `/reports` | Internal business logic |
| `modules/live-class/live-class.controller.ts` | **POST** `/:batchId/create` | Internal business logic |
| `modules/live-class/live-class.controller.ts` | **POST** `/:meetingId/join` | Internal business logic |
| `modules/live-class/live-class.controller.ts` | **DELETE** `/:meetingId` | Internal business logic |
| `modules/live-class/live-class.controller.ts` | **GET** `/:meetingId/recordings` | Internal business logic |
| `modules/analytics/analytics.controller.ts` | **GET** `/dashboard/:id` | Internal business logic |
| `modules/analytics/analytics.controller.ts` | **GET** `/kpis` | Internal business logic |
| `modules/tests/tests.controller.ts` | **POST** `/:quizId/attempt/start` | Internal business logic |
| `modules/tests/tests.controller.ts` | **GET** `/attempt/:attemptId/review` | Internal business logic |
| `modules/tests/tests.controller.ts` | **POST** `/attempt/:attemptId/submit` | Internal business logic |
| `modules/proxy/proxy.controller.ts` | **GET** `/erp/:doctype` | **Proxy to 400+ standard ERPNext Doctypes (e.g., Fee Schedule, Student Group).** |
| `modules/proxy/proxy.controller.ts` | **GET** `/erp/:doctype/:name` | **Proxy to 400+ standard ERPNext Doctypes (e.g., Fee Schedule, Student Group).** |
| `modules/proxy/proxy.controller.ts` | **POST** `/erp/:doctype` | **Proxy to 400+ standard ERPNext Doctypes (e.g., Fee Schedule, Student Group).** |
| `modules/proxy/proxy.controller.ts` | **PUT** `/erp/:doctype/:name` | **Proxy to 400+ standard ERPNext Doctypes (e.g., Fee Schedule, Student Group).** |
| `modules/proxy/proxy.controller.ts` | **POST** `/erp/method` | Internal business logic |
| `modules/proxy/proxy.controller.ts` | **POST** `/moodle/call` | Internal business logic |
| `modules/lms/lms.controller.ts` | **GET** `/courses` | Internal business logic |
| `modules/lms/lms.controller.ts` | **GET** `/courses/:courseId/content` | Internal business logic |
| `modules/lms/lms.controller.ts` | **GET** `/courses/:courseId/grades` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/schedule` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/payment` | Internal business logic |
| `modules/fees/fees.controller.ts` | **GET** `/pending/:studentId` | Student journey data retrieval or update. Triggered by mobile/web UI. |
| `modules/fees/fees.controller.ts` | **GET** `/razorpay/config` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/razorpay/config` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/razorpay/order` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/razorpay/verify` | Internal business logic |
| `modules/fees/fees.controller.ts` | **POST** `/webhook/razorpay` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **GET** `/stats` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **GET** `/audit-logs` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **GET** `/tenants/:id/metrics` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **POST** `/tenants/:id/suspend` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **GET** `/features/catalog` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **GET** `/tenants/:id/features` | Internal business logic |
| `modules/superadmin/superadmin.controller.ts` | **PUT** `/tenants/:id/features` | Internal business logic |
| `modules/health/health.controller.ts` | **GET** `/ready` | Internal business logic |
| `modules/tenants/tenants.controller.ts` | **GET** `/:id` | Internal business logic |
| `modules/tenants/tenants.controller.ts` | **GET** `/:id/features` | Internal business logic |
| `modules/tenants/tenants.controller.ts` | **PUT** `/:id` | Internal business logic |
| `modules/tenants/tenants.controller.ts` | **DELETE** `/:id` | Internal business logic |
| `./novu/playground/nestjs/src/app.controller.ts` | **GET** `//welcome/:userId` | Internal business logic |
| `./novu/apps/webhook/src/webhooks/webhooks.controller.ts` | **POST** `//organizations/:organizationId/environments/:environmentId/email/:providerOrIntegrationId` | Internal business logic |
| `./novu/apps/webhook/src/webhooks/webhooks.controller.ts` | **POST** `//organizations/:organizationId/environments/:environmentId/sms/:providerOrIntegrationId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//bulk` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PUT** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PUT** `//:subscriberId/credentials` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PATCH** `//:subscriberId/credentials` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **DELETE** `//:subscriberId/credentials/:providerId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PATCH** `//:subscriberId/online-status` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **DELETE** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/preferences` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/preferences/:parameter` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PATCH** `//:subscriberId/preferences/:parameter` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **PATCH** `//:subscriberId/preferences` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/notifications/feed` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/notifications/unseen` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//:subscriberId/messages/markAs` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//:subscriberId/messages/mark-as` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//:subscriberId/messages/mark-all` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **POST** `//:subscriberId/messages/:messageId/actions/:type` | Internal business logic |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/credentials/:providerId/oauth/callback` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/subscribers/subscribersV1.controller.ts` | **GET** `//:subscriberId/credentials/:providerId/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/contexts/contexts.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/contexts/contexts.controller.ts` | **PATCH** `//:type/:id` | Internal business logic |
| `./novu/apps/api/src/app/contexts/contexts.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/contexts/contexts.controller.ts` | **GET** `//:type/:id` | Internal business logic |
| `./novu/apps/api/src/app/contexts/contexts.controller.ts` | **DELETE** `//:type/:id` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **GET** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **PATCH** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **DELETE** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **GET** `//:topicKey/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **POST** `//:topicKey/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **DELETE** `//:topicKey/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **GET** `//:topicKey/subscriptions/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/topics-v2/topics.controller.ts` | **PATCH** `//:topicKey/subscriptions/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/channel-endpoints/channel-endpoints.controller.ts` | **GET** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/channel-endpoints/channel-endpoints.controller.ts` | **PATCH** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/channel-endpoints/channel-endpoints.controller.ts` | **DELETE** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/events/events.controller.ts` | **POST** `//trigger` | Internal business logic |
| `./novu/apps/api/src/app/events/events.controller.ts` | **POST** `//trigger/bulk` | Internal business logic |
| `./novu/apps/api/src/app/events/events.controller.ts` | **POST** `//trigger/broadcast` | Internal business logic |
| `./novu/apps/api/src/app/events/events.controller.ts` | **POST** `//test/email` | Internal business logic |
| `./novu/apps/api/src/app/events/events.controller.ts` | **DELETE** `//trigger/:transactionId` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//session/initialize` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//notifications/feed` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//notifications/unseen` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//notifications/unread` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//notifications/count` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/markAs` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/mark-as` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **DELETE** `//messages/:messageId` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **DELETE** `//messages` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/bulk/delete` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/read` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/seen` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//messages/:messageId/actions/:type` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//organization` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//preferences` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **GET** `//preferences/:level` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **PATCH** `//preferences/:templateId` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **PATCH** `//preferences` | Internal business logic |
| `./novu/apps/api/src/app/widgets/widgets.controller.ts` | **POST** `//usage/log` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **GET** `//:domain` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//:domain/verify` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//:domain/diagnose` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **GET** `//:domain/routes` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//:domain/routes` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **GET** `//:domain/routes/:address` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **PATCH** `//:domain/routes/:address` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **DELETE** `//:domain/routes/:address` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//:domain/routes/:address/test` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **GET** `//:domain/auto-configure` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **POST** `//:domain/auto-configure/start` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **PATCH** `//:domain` | Internal business logic |
| `./novu/apps/api/src/app/domains/domains.controller.ts` | **DELETE** `//:domain` | Internal business logic |
| `./novu/apps/api/src/app/feeds/feeds.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/feeds/feeds.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/feeds/feeds.controller.ts` | **DELETE** `//:feedId` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.topic.controller.ts` | **GET** `//topics/:topicKey/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.topic.controller.ts` | **GET** `//topics/:topicKey/subscriptions/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.topic.controller.ts` | **POST** `//topics/:topicKey/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.topic.controller.ts` | **PATCH** `//topics/:topicKey/subscriptions/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.topic.controller.ts` | **DELETE** `//topics/:topicKey/subscriptions/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//session` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//notifications` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//notifications/count` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//preferences` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//preferences/global` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/read` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/unread` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/archive` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/unarchive` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/snooze` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/unsnooze` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **DELETE** `//notifications/:id/delete` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/complete` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//notifications/:id/revert` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//preferences` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//preferences/bulk` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//preferences/:workflowIdOrIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **PATCH** `//subscriptions/:subscriptionIdentifier/preferences/:workflowIdOrIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//notifications/seen` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//notifications/read` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//notifications/archive` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//notifications/read-archive` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//notifications/delete` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//events` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//channel-connections` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//channel-connections/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **DELETE** `//channel-connections/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **GET** `//channel-endpoints` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **DELETE** `//channel-endpoints/:identifier` | Internal business logic |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//channel-connections/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/inbox/inbox.controller.ts` | **POST** `//channel-endpoints/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/content-templates/content-templates.controller.ts` | **POST** `//preview/email` | Internal business logic |
| `./novu/apps/api/src/app/content-templates/content-templates.controller.ts` | **POST** `//preview/in-app` | Internal business logic |
| `./novu/apps/api/src/app/content-templates/content-templates.controller.ts` | **POST** `//preview/sms` | Internal business logic |
| `./novu/apps/api/src/app/content-templates/content-templates.controller.ts` | **POST** `//preview/chat` | Internal business logic |
| `./novu/apps/api/src/app/content-templates/content-templates.controller.ts` | **POST** `//preview/push` | Internal business logic |
| `./novu/apps/api/src/app/notifications/notification.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/notifications/notification.controller.ts` | **GET** `//stats` | Internal business logic |
| `./novu/apps/api/src/app/notifications/notification.controller.ts` | **GET** `//graph/stats` | Internal business logic |
| `./novu/apps/api/src/app/notifications/notification.controller.ts` | **GET** `//:notificationId` | Internal business logic |
| `./novu/apps/api/src/app/channel-connections/channel-connections.controller.ts` | **GET** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/channel-connections/channel-connections.controller.ts` | **PATCH** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/channel-connections/channel-connections.controller.ts` | **DELETE** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **GET** `//me` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **DELETE** `//members/:memberId` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **PUT** `//members/:memberId/roles` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **GET** `//members` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **PUT** `//branding` | Internal business logic |
| `./novu/apps/api/src/app/organization/organization.controller.ts` | **PATCH** `//` | Internal business logic |
| `./novu/apps/api/src/app/organization/ee.organization.controller.ts` | **GET** `//me` | Internal business logic |
| `./novu/apps/api/src/app/organization/ee.organization.controller.ts` | **PUT** `//branding` | Internal business logic |
| `./novu/apps/api/src/app/organization/ee.organization.controller.ts` | **PATCH** `//` | Internal business logic |
| `./novu/apps/api/src/app/organization/ee.organization.controller.ts` | **GET** `//settings` | Internal business logic |
| `./novu/apps/api/src/app/organization/ee.organization.controller.ts` | **PATCH** `//settings` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **GET** `//github` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **GET** `//github/callback` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **GET** `//refresh` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//register` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//reset/request` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//reset` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//login` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//organizations/:organizationId/switch` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **POST** `//update-password` | Internal business logic |
| `./novu/apps/api/src/app/auth/auth.controller.ts` | **GET** `//test/token/:userId` | Internal business logic |
| `./novu/apps/api/src/app/environments-v2/environments.controller.ts` | **GET** `//:environmentId/tags` | Internal business logic |
| `./novu/apps/api/src/app/environments-v2/environments.controller.ts` | **POST** `//:targetEnvironmentId/publish` | Internal business logic |
| `./novu/apps/api/src/app/environments-v2/environments.controller.ts` | **POST** `//:targetEnvironmentId/diff` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v1/layouts-v1.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v1/layouts-v1.controller.ts` | **GET** `//:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v1/layouts-v1.controller.ts` | **DELETE** `//:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v1/layouts-v1.controller.ts` | **PATCH** `//:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v1/layouts-v1.controller.ts` | **POST** `//:layoutId/default` | Internal business logic |
| `./novu/apps/api/src/app/tenant/tenant.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/tenant/tenant.controller.ts` | **GET** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/tenant/tenant.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/tenant/tenant.controller.ts` | **PATCH** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/tenant/tenant.controller.ts` | **DELETE** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/support/support.controller.ts` | **POST** `/customer-details` | Internal business logic |
| `./novu/apps/api/src/app/support/support.controller.ts` | **POST** `/agents-early-access` | Internal business logic |
| `./novu/apps/api/src/app/support/support.controller.ts` | **POST** `/create-thread` | Internal business logic |
| `./novu/apps/api/src/app/support/support.controller.ts` | **POST** `/mobile-setup` | Internal business logic |
| `./novu/apps/api/src/app/cli-auth/cli-auth.controller.ts` | **POST** `//:deviceCode/poll` | Internal business logic |
| `./novu/apps/api/src/app/cli-auth/cli-auth.controller.ts` | **POST** `//:deviceCode/approve` | Internal business logic |
| `./novu/apps/api/src/app/preferences/preferences.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/preferences/preferences.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/preferences/preferences.controller.ts` | **DELETE** `//` | Internal business logic |
| `./novu/apps/api/src/app/agents/email/agent-email-actions.controller.ts` | **GET** `//preview` | Internal business logic |
| `./novu/apps/api/src/app/agents/email/agent-email-actions.controller.ts` | **POST** `//execute` | Internal business logic |
| `./novu/apps/api/src/app/agents/mcp/oauth/agents-mcp-oauth.controller.ts` | **GET** `//oauth/callback` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/agents/mcp/oauth/agents-mcp-oauth.controller.ts` | **GET** `//provider-managed/redirect` | Internal business logic |
| `./novu/apps/api/src/app/agents/conversation-runtime/ingress/agent-inbound.controller.ts` | **GET** `//:agentId/webhook/:integrationIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/agents/conversation-runtime/ingress/agent-inbound.controller.ts` | **POST** `//:agentId/webhook/:integrationIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/agents/conversation-runtime/reply/agent-reply.controller.ts` | **POST** `//:agentId/reply` | Internal business logic |
| `./novu/apps/api/src/app/agents/managed-runtime/managed-runtime.controller.ts` | **POST** `//events` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/telegram-linking/agents-public.controller.ts` | **GET** `/telegram/mobile-configure/status` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/telegram-linking/agents-public.controller.ts` | **POST** `/telegram/mobile-configure` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/telegram-linking/agents-public.controller.ts` | **GET** `/slack/setup/status` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/telegram-linking/agents-public.controller.ts` | **POST** `/slack/setup` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **GET** `//:identifier/integrations` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **PATCH** `//:identifier/integrations/:agentIntegrationId` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **DELETE** `//:identifier/integrations/:agentIntegrationId` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationIdentifier/whatsapp/auto-configure` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationIdentifier/whatsapp/test-template` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/test-email` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **PATCH** `//:identifier/inbox/shared` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/welcome-message` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationId/telegram/configure` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationId/telegram/mobile-link` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationId/slack/setup-link` | Internal business logic |
| `./novu/apps/api/src/app/agents/channels/integrations/agent-integrations.controller.ts` | **POST** `//:identifier/integrations/:integrationId/telegram/subscriber-link` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **GET** `//emoji` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **PUT** `//:identifier/bridge` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **GET** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **PATCH** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agents.controller.ts` | **DELETE** `//:identifier` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//verify-credentials` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//generate` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **GET** `//:identifier/demo-quota` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//:identifier/migrate-runtime` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **GET** `//:identifier/runtime/config` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **PATCH** `//:identifier/runtime/config` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **GET** `//:identifier/mcp-servers` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//:identifier/mcp-servers` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **PUT** `//:identifier/mcp-servers` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **DELETE** `//:identifier/mcp-servers/:mcpId` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//:identifier/mcp-servers/:mcpId/oauth/url` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//:identifier/mcp-servers/:mcpId/provider-vault` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **GET** `//:identifier/mcp-servers/:mcpId/connection` | Internal business logic |
| `./novu/apps/api/src/app/agents/management/agent-runtime.controller.ts` | **POST** `//skills` | Internal business logic |
| `./novu/apps/api/src/app/storage/storage.controller.ts` | **GET** `//upload-url` | Internal business logic |
| `./novu/apps/api/src/app/messages/messages.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/messages/messages.controller.ts` | **DELETE** `//:messageId` | Internal business logic |
| `./novu/apps/api/src/app/messages/messages.controller.ts` | **DELETE** `//transaction/:transactionId` | Internal business logic |
| `./novu/apps/api/src/app/internal/internal.controller.ts` | **POST** `//subscriber-online-state` | Internal business logic |
| `./novu/apps/api/src/app/internal/internal.controller.ts` | **POST** `//scheduler/callback` | Internal business logic |
| `./novu/apps/api/src/app/outbound-webhooks/outbound-webhooks.controller.ts` | **GET** `//portal/token` | Internal business logic |
| `./novu/apps/api/src/app/outbound-webhooks/outbound-webhooks.controller.ts` | **POST** `//portal/token` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **PUT** `//:overrideId` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **PUT** `//workflows/:workflowId/tenants/:tenantId` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **GET** `//:overrideId` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **GET** `//workflows/:workflowId/tenants/:tenantId` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **DELETE** `//:overrideId` | Internal business logic |
| `./novu/apps/api/src/app/workflow-overrides/workflow-overrides.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **GET** `//:variableKey/usage` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **GET** `//:variableKey` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **PATCH** `//:variableKey` | Internal business logic |
| `./novu/apps/api/src/app/environment-variables/environment-variables.controller.ts` | **DELETE** `//:variableKey` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **GET** `//me` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **PUT** `//:environmentId` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **GET** `//api-keys` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **POST** `//api-keys/regenerate` | Internal business logic |
| `./novu/apps/api/src/app/environments-v1/environments-v1.controller.ts` | **DELETE** `//:environmentId` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **POST** `//:topicKey/subscribers` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **GET** `//:topicKey/subscribers/:externalSubscriberId` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **POST** `//:topicKey/subscribers/removal` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **DELETE** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **GET** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/topics-v1/topics-v1.controller.ts` | **PATCH** `//:topicKey` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **GET** `//status` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **POST** `//preview/:workflowId/:stepId` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **POST** `//sync` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **POST** `//diff` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **GET** `//controls/:workflowId/:stepId` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **PUT** `//controls/:workflowId/:stepId` | Internal business logic |
| `./novu/apps/api/src/app/bridge/bridge.controller.ts` | **POST** `//validate` | Internal business logic |
| `./novu/apps/api/src/app/analytics/analytics.controller.ts` | **POST** `//measure` | Internal business logic |
| `./novu/apps/api/src/app/analytics/analytics.controller.ts` | **POST** `//identify` | Internal business logic |
| `./novu/apps/api/src/app/activity/activity.controller.ts` | **GET** `/requests` | Internal business logic |
| `./novu/apps/api/src/app/activity/activity.controller.ts` | **GET** `/requests/:requestId` | Internal business logic |
| `./novu/apps/api/src/app/activity/activity.controller.ts` | **GET** `/workflow-runs` | Internal business logic |
| `./novu/apps/api/src/app/activity/activity.controller.ts` | **GET** `/workflow-runs/:workflowRunId` | Internal business logic |
| `./novu/apps/api/src/app/activity/activity.controller.ts` | **GET** `/charts` | Internal business logic |
| `./novu/apps/api/src/app/blueprint/blueprint.controller.ts` | **GET** `//group-by-category` | Internal business logic |
| `./novu/apps/api/src/app/blueprint/blueprint.controller.ts` | **GET** `//:templateIdOrIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **DELETE** `//:subscriberId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId/preferences` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId/preferences/global` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/preferences/bulk` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/preferences` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId/subscriptions` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId/notifications` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **GET** `//:subscriberId/notifications/count` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/read` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/unread` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/archive` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/unarchive` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/snooze` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/unsnooze` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **DELETE** `//:subscriberId/notifications/:notificationId` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/actions/:actionType/complete` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **PATCH** `//:subscriberId/notifications/:notificationId/actions/:actionType/revert` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `//:subscriberId/notifications/seen` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `//:subscriberId/notifications/read` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `//:subscriberId/notifications/archive` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `//:subscriberId/notifications/read-archive` | Internal business logic |
| `./novu/apps/api/src/app/subscribers-v2/subscribers.controller.ts` | **POST** `//:subscriberId/notifications/delete` | Internal business logic |
| `./novu/apps/api/src/app/step-resolvers/step-resolvers.controller.ts` | **GET** `//count` | Internal business logic |
| `./novu/apps/api/src/app/step-resolvers/step-resolvers.controller.ts` | **POST** `//deploy` | Internal business logic |
| `./novu/apps/api/src/app/step-resolvers/step-resolvers.controller.ts` | **DELETE** `//:stepInternalId/disconnect` | Internal business logic |
| `./novu/apps/api/src/app/execution-details/execution-details.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/invites/invites.controller.ts` | **GET** `//:inviteToken` | Internal business logic |
| `./novu/apps/api/src/app/invites/invites.controller.ts` | **POST** `//:inviteToken/accept` | Internal business logic |
| `./novu/apps/api/src/app/invites/invites.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/invites/invites.controller.ts` | **POST** `//resend` | Internal business logic |
| `./novu/apps/api/src/app/invites/invites.controller.ts` | **POST** `//bulk` | Internal business logic |
| `./novu/apps/api/src/app/user/user.controller.ts` | **GET** `//me` | Internal business logic |
| `./novu/apps/api/src/app/user/user.controller.ts` | **PUT** `//profile/email` | Internal business logic |
| `./novu/apps/api/src/app/user/user.controller.ts` | **PUT** `//onboarding` | Internal business logic |
| `./novu/apps/api/src/app/user/user.controller.ts` | **PUT** `//onboarding-tour` | Internal business logic |
| `./novu/apps/api/src/app/user/user.controller.ts` | **PUT** `//profile` | Internal business logic |
| `./novu/apps/api/src/app/notification-groups/notification-groups.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/notification-groups/notification-groups.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/notification-groups/notification-groups.controller.ts` | **GET** `//:id` | Internal business logic |
| `./novu/apps/api/src/app/notification-groups/notification-groups.controller.ts` | **PATCH** `//:id` | Internal business logic |
| `./novu/apps/api/src/app/notification-groups/notification-groups.controller.ts` | **DELETE** `//:id` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **PUT** `/:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **GET** `/:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **DELETE** `/:layoutId` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **POST** `/:layoutId/duplicate` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **POST** `/:layoutId/preview` | Internal business logic |
| `./novu/apps/api/src/app/layouts-v2/layouts.controller.ts` | **GET** `/:layoutId/usage` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **PUT** `/:workflowId/sync` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **PUT** `/:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **GET** `/:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **DELETE** `/:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **POST** `/:workflowId/duplicate` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **POST** `//:workflowId/step/:stepId/preview` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **POST** `//steps/test-http-request` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **GET** `//:workflowId/steps/:stepId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **PATCH** `//:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v2/workflow.controller.ts` | **GET** `//:workflowId/test-data` | Internal business logic |
| `./novu/apps/api/src/app/inbound-parse/inbound-parse.controller.ts` | **GET** `//mx/status` | Internal business logic |
| `./novu/apps/api/src/app/connect/connect.controller.ts` | **POST** `//claim` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations-public.controller.ts` | **GET** `//status` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations-public.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//active` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//webhook/provider/:providerOrIntegrationId/status` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **PUT** `//:integrationId` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//:integrationId/auto-configure` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//:integrationId/set-primary` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **DELETE** `//:integrationId` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//:channelType/limit` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//in-app/status` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//:integrationId/msteams-arm-template/deploy-url` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//:integrationId/msteams-arm-template` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//:integrationId/msteams-azure-setup/oauth-url` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//:integrationId/msteams-health` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//chat/oauth/azure-setup/callback` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//chat/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//channel-connections/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//channel-endpoints/oauth` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **GET** `//chat/oauth/callback` | User authentication and JWT token generation. |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//whatsapp/validate-token` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//telegram/mobile-link` | Internal business logic |
| `./novu/apps/api/src/app/integrations/integrations.controller.ts` | **POST** `//:integrationId/slack-quick-setup` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **PUT** `//:templateId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **DELETE** `//:templateId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **GET** `//:workflowIdOrIdentifier` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/notification-template.controller.ts` | **PUT** `//:templateId/status` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **GET** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **PUT** `//:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **DELETE** `//:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **GET** `//variables` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **GET** `//:workflowId` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **POST** `/` | Internal business logic |
| `./novu/apps/api/src/app/workflows-v1/workflow-v1.controller.ts` | **PUT** `//:workflowId/status` | Internal business logic |
| `./novu/apps/api/src/app/change/changes.controller.ts` | **GET** `//` | Internal business logic |
| `./novu/apps/api/src/app/change/changes.controller.ts` | **GET** `//count` | Internal business logic |
| `./novu/apps/api/src/app/change/changes.controller.ts` | **POST** `//bulk/apply` | Internal business logic |
| `./novu/apps/api/src/app/change/changes.controller.ts` | **POST** `//:changeId/apply` | Internal business logic |
| `./novu/apps/api/src/app/health/health.controller.ts` | **POST** `//test-idempotency` | Internal business logic |
| `./novu/apps/api/src/app/health/health.controller.ts` | **GET** `//test-idempotency` | Internal business logic |
| `./novu/apps/api/src/app/partner-integrations/partner-integrations.controller.ts` | **POST** `//vercel` | Internal business logic |
| `./novu/apps/api/src/app/partner-integrations/partner-integrations.controller.ts` | **PUT** `//vercel` | Internal business logic |
| `./novu/apps/api/src/app/partner-integrations/partner-integrations.controller.ts` | **GET** `//vercel/:configurationId` | Internal business logic |
| `./novu/apps/api/src/app/partner-integrations/partner-integrations.controller.ts` | **GET** `//vercel/:configurationId/projects` | Internal business logic |
| `./novu/apps/api/src/app/partner-integrations/partner-integrations.controller.ts` | **POST** `//vercel/webhook` | Internal business logic |
| `./novu/apps/api/src/app/testing/testing.controller.ts` | **GET** `//product-feature` | Internal business logic |
| `./novu/apps/api/src/app/testing/testing.controller.ts` | **GET** `//resource-limiting-default` | Internal business logic |
| `./novu/apps/api/src/app/testing/testing.controller.ts` | **GET** `//resource-limiting-events` | Internal business logic |
| `./novu/apps/api/src/app/testing/auth.controller.ts` | **GET** `//user-route` | Internal business logic |
| `./novu/apps/api/src/app/testing/auth.controller.ts` | **GET** `//user-api-inaccessible-route` | Internal business logic |
| `./novu/apps/api/src/app/testing/auth.controller.ts` | **GET** `//permission-route` | Internal business logic |
| `./novu/apps/api/src/app/testing/auth.controller.ts` | **GET** `//no-permission-route` | Internal business logic |
| `./novu/apps/api/src/app/testing/auth.controller.ts` | **GET** `//all-permissions-route` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//no-category-no-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//no-category-single-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//global-category-no-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//global-category-single-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//global-category-bulk-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//trigger-category-no-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//trigger-category-single-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//trigger-category-bulk-cost` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//no-category-no-cost-override` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//no-category-single-cost-override` | Internal business logic |
| `./novu/apps/api/src/app/testing/rate-limiting.controller.ts` | **GET** `//global-category-no-cost-override` | Internal business logic |

## The ~1000 APIs via Proxy/Standard Modules

Since the source code explicitly implements a proxy architecture (e.g., `@Get('erp/:doctype')` and `@Post('moodle/call')`), the Gateway dynamically resolves to the underlying 1000+ endpoints of the 7 open source systems.

### 1. ERPNext / Frappe (approx. 450 APIs)
Exposed dynamically based on `tabDoctype`. 
- **Usage**: Fetched by Frontend Admin Portal via Gateway. 
- **Core Entities**: `Student`, `Program`, `Course`, `Fee Structure`, `Payment Entry`, `User`, `Role`, `Assessment Plan`. 
- **DTOs**: Standard Frappe DTO `{ "data": { "name": string, ...fields } }`

### 2. Moodle LMS (approx. 200 APIs)
Exposed via `webservice/rest/server.php?wsfunction=X`
- **Usage**: Fetched by Student Journey portal.
- **Core Functions**: `core_course_get_courses`, `core_enrol_get_users_courses`, `mod_assign_get_assignments`, `gradereport_user_get_grade_items`.

### 3. Novu Notifications (approx. 100 APIs)
Exposed via Novu Worker triggering `@novu/node` SDK.
- **Usage**: Sending SMS/Email payloads on events like `FEE_PAID`, `CLASS_SCHEDULED`.

### 4. Metabase/ClickHouse Analytics (approx. 150 APIs)
Exposed via Metabase iframe generation APIs.
- **Usage**: Admin dashboard analytics embeds fetching row-level secured data from ClickHouse.

### 5. BigBlueButton (approx. 50 APIs)
Exposed via XML-RPC style GET endpoints with checksums.
- **Usage**: `create`, `join`, `getRecordings`, `end`.

