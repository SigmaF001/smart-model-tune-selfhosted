# งานที่ Frontend แก้ได้เอง

ตรวจสอบเมื่อ: 25 กันยายน 2026  
ขอบเขต: `tunelab-frontend-selfhosted` โดยไม่เปลี่ยน backend contract

## ลำดับงานที่แนะนำ

### P0 — เปลี่ยนข้อมูลจำลองที่ผู้ใช้เห็นให้เป็นข้อมูลจริง

#### 1. Wire Dataset Insights กับ API ที่มีอยู่แล้ว

หน้า `/projects/:id/insights` แสดงรายการ dataset จริงใน tab แรก แต่ tab Quality ยังใช้ `src/data/datasetMockData.ts` และ `src/lib/qualityCalculator.ts`. Backend มี `GET /api/v1/datasets/{dataset_id}/insights` แล้ว จึงแก้ frontend ได้ทันทีโดยไม่ต้องรอ backend.

งานที่ควรทำ:

- เพิ่ม type `DatasetInsightsResponse` ใน `src/api/types.ts` ตาม OpenAPI
- เพิ่ม `getDatasetInsights(id)` ใน `src/api/endpoints/datasets.ts` และ React Query hook ใน `src/hooks/queries.ts`
- ให้ selector แสดงเฉพาะ dataset ของ project ที่เลือก และโหลด insight ของ dataset นั้น
- รองรับ loading, empty, 403/404, `scan_truncated` และ `null` ของข้อมูลที่ไม่มีสำหรับ task type นั้น
- ลบข้อความที่ระบุว่าเป็น illustrative sample เมื่อใช้ response จริง และค่อยลบ legacy mock/quality calculator เมื่อไม่มี import เหลือ

#### 2. Wire Templates กับ catalog ที่มีอยู่แล้ว

หน้า `/templates` เป็น prototype แต่ backend มี `GET /api/v1/templates` และ `PUT /api/v1/templates/{template_id}/rating`.

งานที่ frontend ทำได้เอง:

- เพิ่ม endpoint/types/hooks สำหรับ list, filter, search, sort, pagination และ rating
- แสดงเฉพาะ template ที่ backend อนุญาต แล้วใช้ template เพื่อ prefill New Project wizard
- เพิ่ม empty/error/loading state และ refresh cache หลัง rating
- อย่าส่ง default training parameter ที่ frontend เดาเองหาก template response ไม่ได้ระบุ ให้ยึด field จาก contract

### P1 — ความทนทานและความถูกต้องที่แก้ได้เฉพาะ client

| งาน | จุดแก้หลัก | ผลลัพธ์ |
| --- | --- | --- |
| สร้าง idempotency key ต่อการ submit | `useGenerateDataset`, `useStartTraining`, `useStartEvaluation`, export | กดซ้ำหรือ retry แล้วไม่สร้างงานซ้ำโดยไม่ตั้งใจ |
| ตรวจไฟล์ก่อน upload | `DataUploadStep.tsx` | แจ้งชนิดไฟล์/ขนาด/JSON ที่ผิดก่อนส่ง ลด request ที่ล้มเหลว |
| ตรวจ input แบบเดียวกับ API | New Project และ Training dialog | ลด 422 และข้อความ error ที่อ่านยาก |
| ใช้ข้อมูลจาก API เป็น source เดียว | component ที่ยัง import `src/data/*MockData.ts` | production UI ไม่แสดงตัวเลข/ชื่อจำลอง |
| แสดง error ตาม `ApiError` | `src/api/client.ts` และ component call site | แยก 401, 403, 404, 409, 422 และ 5xx ได้ชัดเจน พร้อม request ID เมื่อมี |
| ทดสอบ contract | `src/api/endpoints/endpoints.contract.test.ts` | ตรวจ path, method, query และ request body ก่อน merge |

สำหรับ idempotency ให้สร้าง key ครั้งเดียวต่อการกด submit และ reuse เฉพาะ retry ของ action เดิม; ต้องไม่สร้าง key ใหม่ทุก render. API layer รองรับ header อยู่แล้ว แต่ mutation hooks ปัจจุบันยังไม่ได้ส่ง key จาก UI.

### P1 — ดูแล self-hosted frontend เอง

- ตั้งค่า browser-only variables ใน `.env`: `VITE_AUTH_URL`, `VITE_AUTH_REALM`, `VITE_AUTH_CLIENT_ID`; ห้ามใส่ password, JWKS private key หรือ database credential ใน `VITE_*`
- ตั้ง proxy runtime variables: `ENGINE_UPSTREAM*`, `READY_UPSTREAM*`, `AUTH_UPSTREAM` ให้ตรง network deployment
- คง `/api/v1/`, `/ws/`, `/health`, `/ready`, `/auth/` ใน `nginx/default.conf.template`; route เหล่านี้ห้ามตกไปที่ SPA fallback
- ทดสอบทั้ง `npm run test` และ `npm run build`; ใช้ `npm run dev:mock` เฉพาะ development UI ที่ไม่มี backend
- เพิ่ม E2E smoke test ฝั่ง browser: login, protected route, create project, upload, start job, reconnect WebSocket และ open presigned download

### P2 — ปรับ UX ได้เองโดยไม่เปลี่ยน API

- ปรับภาษา, theme, responsive layout, accessibility, focus management และ skeleton/empty/error states
- ปรับการค้นหา/เรียงลำดับใน client สำหรับข้อมูลที่โหลดมาแล้ว เช่น Leaderboard
- แสดง progress จาก REST snapshot ระหว่าง WebSocket reconnect และแสดงสถานะ reconnect/unauthorized ให้ผู้ใช้เข้าใจ
- ทำ client-side pagination ให้ครบทุก list ที่ข้อมูลอาจเกิน 200 รายการ
- จัดการ localStorage เฉพาะ state ที่ไม่ใช่ข้อมูลธุรกิจ: onboarding และ legacy-route mapping. อย่าเก็บ access token, dataset หรือ training state สำคัญเอง

## ต้องรอ backend contract ก่อนเริ่มทำเต็มรูปแบบ

| หน้า | เหตุผล | สิ่งที่ต้องได้ก่อน |
| --- | --- | --- |
| `/analytics` | เป็น `PrototypePage`; API analytics ยังไม่มี | schema, access scope, filter, aggregate/time-series และ retention |
| `/deployment` | ไม่มี managed-deployment resource | lifecycle API, quota, status/job format, endpoint security และ logs policy |
| inference แบบ stream | `ChatPanel` ใช้ `stream: false` เพราะ API ปัจจุบันไม่รองรับ stream | protocol SSE/WS, event schema, cancellation และ error semantics |

## การจัดระเบียบ source ที่ทำได้ในรอบถัดไป

ไม่ต้องย้ายไฟล์เพื่อให้ระบบทำงานในรอบนี้ แต่หลัง wire Dataset Insights/Templates แล้วให้จัดการไฟล์ตามนี้เพื่อกัน mock ปะปนกับ production:

```text
src/
├── api/                 # client, types, endpoints, websocket
├── auth/                # Keycloak integration
├── components/          # UI ที่ใช้ซ้ำ แยกตาม domain
├── hooks/               # React Query และ browser hooks
├── pages/               # route components
├── lib/                 # pure helpers
├── i18n/                # translation/context
├── mocks/               # เฉพาะ VITE_MOCK=1 และ test fixtures
└── data/                # static product content เท่านั้น; ไม่เก็บ production fallback
```

ลบ `src/data/*MockData.ts` และ helper ที่อาศัยมันเมื่อไม่มี route/import เหลือ โดยทำเป็น PR แยกหลัง migration เพื่อให้ review และ rollback ง่าย. อย่าย้ายหรือแก้ mock engine ระหว่างที่ `dev:mock` และ test ยังใช้มันอยู่.

## สิ่งที่ยืนยันได้แล้ว

- HTTP client เติม bearer token และอ่าน `X-Request-ID` เป็น `ApiError.requestId`
- WebSocket สร้าง URL same-origin และส่ง bearer token ด้วย subprotocol ตาม backend
- Nginx frontend มี proxy สำหรับ API, WebSocket, health และ ready
- Download dataset/model ใช้ presigned URL แล้วเปิดแท็บใหม่ จึงไม่ต้องทำ download proxy ใน browser
