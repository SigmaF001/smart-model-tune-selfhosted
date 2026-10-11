# งานที่ Backend ต้องดำเนินการสำหรับ Self-hosted Frontend

ตรวจสอบเมื่อ: 25 กันยายน 2026  
หลักฐาน frontend: `src/api/endpoints/`, `src/api/types.ts`, `src/api/ws.ts`, `nginx/default.conf.template`  
เทียบกับ backend: `../slm-finetune-platform-dem/openapi.json` และ `api/routers/`

## สถานะปัจจุบัน

Backend ปัจจุบันมี contract ครบสำหรับ workflow หลักที่ frontend เรียกอยู่แล้ว จึงไม่ควรเปลี่ยนชื่อ path, HTTP method, enum, response field หรือรูปแบบ progress โดยไม่ออก version ใหม่และทดสอบ contract ร่วมกัน

สิ่งที่ต้องทำแบ่งเป็นงานเพื่อเปิดระบบจริง และงานเพิ่มความสามารถให้หน้าที่ยังเป็น prototype

## P0 — ต้องยืนยันในการ deploy ทุก environment

### 1. เปิดและตรวจ OIDC ให้ตรงกับ Keycloak ของ frontend

Frontend ส่ง `Authorization: Bearer <access token>` ทุก REST request ยกเว้น `/health` และ `/ready`; WebSocket ใช้ subprotocol `['bearer', '<access token>']`.

Backend ต้องตั้งค่าดังนี้:

- เปิด `AUTH_REQUIRED=true` ใน environment ที่ให้ผู้ใช้ใช้งานจริง
- ตั้ง issuer, JWKS URL และ audience ให้ตรงกับ Keycloak ที่ public ผ่าน `/auth`
- ตรวจ owner/tenant ของ project, dataset, training, model, evaluation, download link และ inference ทุกครั้ง
- WebSocket `/ws/jobs/{job_id}` ต้องตรวจ token และ ownership ก่อน accept; `4401` สำหรับ token ผิด/หมดอายุ และ `4403` สำหรับ job ที่ผู้ใช้ไม่มีสิทธิ์

ไฟล์ compose ที่ frontend เตรียมไว้สำหรับ backend คือ `docker-compose.backend-oidc.yml` และ `docker-compose.backend-remote-oidc.yml`; ให้เลือกไฟล์ที่ตรงกับรูปแบบการ deploy แล้วตรวจด้วยผู้ใช้สองรายว่าอ่าน job ข้ามกันไม่ได้

### 2. เชื่อม network และ reverse proxy ให้ครบทุก route

Browser เรียก same-origin route ผ่าน Nginx ของ frontend ดังนี้:

| Route จาก browser | ปลายทางที่ backend ต้องพร้อมรับ | หมายเหตุ |
| --- | --- | --- |
| `/api/v1/*` | Engine API | REST ที่ต้องมี bearer token |
| `/ws/jobs/{job_id}` | Engine WebSocket | ต้องรองรับ Upgrade และ bearer subprotocol |
| `/health` | Engine liveness | public probe |
| `/ready` | API/readiness service | public probe; frontend แยก `READY_UPSTREAM` ได้ |

หาก backend อยู่คนละ Docker host ให้ใช้ `docker-compose.backend-remote-oidc.yml` และให้ `ENGINE_UPSTREAM`, `READY_UPSTREAM`, `ENGINE_UPSTREAM_HOST` ชี้ host/TLS certificate ที่เข้าถึงได้จาก container frontend. หากอยู่ Docker network เดียวกัน ใช้ `docker-compose.backend-network.yml`.

เกณฑ์ตรวจรับ: login สำเร็จ, สร้างงานได้, refresh ระหว่างงานแล้วยังเห็น progress, `/ready` ส่ง JSON จาก backend ไม่ใช่ `index.html`, และ WebSocket ไม่ถูกตัดโดย proxy.

### 3. รักษา job progress ให้กู้คืนได้

หน้าจอใช้ทั้ง `GET /api/v1/jobs/{job_id}/progress` และ `/ws/jobs/{job_id}`. Backend ปัจจุบันมี snapshot-on-connect และ Redis snapshot อยู่แล้ว; ต้องคงพฤติกรรมนี้เมื่อปรับ worker, Redis หรือ gateway.

Progress frame ต้องมี `type` ที่ frontend รองรับ ได้แก่ `sdg_progress`, `training_progress`, `hpo_progress`, `export_progress`, `evaluation_progress`, `completed`, `failed` และมี `job_id` ที่ตรงกับ URL. การเปลี่ยน field หรือส่งเพียง delta จะทำให้หน้าจอ progress แสดงผิดหลัง reconnect.

### 4. รองรับ idempotency สำหรับงานที่สร้าง queue

API client รองรับ header `Idempotency-Key` แล้ว และ backend ปัจจุบันรองรับอย่างน้อย SDG, training และ evaluation. ต้องคงการเก็บและ replay ผลลัพธ์เดิมต่อผู้ใช้เดียวกัน โดยเฉพาะหลัง retry จาก network error. งาน export ควรกำหนด policy เดียวกันก่อนเปิดปุ่มซ้ำได้

## P1 — ต้องเพิ่มเมื่อจะเปิดหน้า prototype เป็นผลิตภัณฑ์จริง

### Analytics

หน้า `/analytics` ยังเป็น `PrototypePage` เพราะไม่มี endpoint analytics สำหรับผู้ใช้ใน Engine API. หากต้องการเปิดหน้า ให้ backend ออก contract ก่อน แล้ว frontend จึง wire UI.

contract ขั้นต่ำที่แนะนำ:

```http
GET /api/v1/analytics?from=2026-09-01&to=2026-09-30&project_id=<optional>
```

response ควรมี time-series และ aggregate ที่จำเป็นต่อ UI เช่น จำนวน/ระยะเวลางานตาม stage, success/failure/cancelled, queue wait, token/cost และตัวกรอง period/project. ต้อง scope ตาม owner/organization; ห้ามส่ง system-wide metrics ให้ผู้ใช้ทั่วไป.

### Deployment

หน้า `/deployment` ยังเป็น `PrototypePage` และ Engine ไม่มี managed-serving resource. หากจะรองรับ deploy model จริง ต้องตกลง lifecycle ก่อน แล้วเพิ่ม API เช่น:

- `POST /api/v1/deployments` สร้าง deployment จาก `model_artifact_id`
- `GET /api/v1/deployments` และ `GET /api/v1/deployments/{id}` อ่านสถานะ/endpoint/log ที่อนุญาต
- `PATCH` สำหรับ scale หรือ configuration ที่ปลอดภัย
- `POST .../stop` หรือ `DELETE` สำหรับหยุด deployment

response ต้องบอกสถานะ async, job ID, URL ที่ไม่เปิดเผย secret และ usage/cost ที่ผูก owner. ต้องกำหนด quota, network isolation, secret injection, audit log และการลบ endpoint เมื่อ model/artifact ถูกลบ.

## P2 — ปรับปรุงตาม roadmap

| ความสามารถ | สถานะ backend ปัจจุบัน | งาน backend ที่ควรทำ |
| --- | --- | --- |
| Templates | มี `GET /api/v1/templates` และ `PUT /api/v1/templates/{id}/rating` | รักษา pagination/filter (`category`, `featured`, `search`, `sort`) และสิทธิ์; frontend ยังไม่ได้ใช้ |
| Dataset Insights | มี `GET /api/v1/datasets/{id}/insights` | รักษา schema/สิทธิ์และผล `scan_truncated`; frontend ยังใช้ mock จึงเป็นงาน wire ฝั่ง frontend |
| Download | มี presigned `.../download-url` | กำหนด TTL, object scope และ header `Content-Disposition`; URL ต้องเปิดในแท็บใหม่ได้ |
| Inference streaming | ปัจจุบัน frontend ส่ง `stream: false` | เพิ่ม streaming protocol เฉพาะเมื่อระบุ SSE/WS event schema, cancellation และ quota ชัดเจน |
| ข้อมูลแบบ pagination | endpoint list ใช้ `items`, `total`, `limit`, `offset` | คง response envelope เดิมและ cap limit ที่สอดคล้องกับ UI |

## Contract ที่ต้องรักษา

| กลุ่ม | Paths ที่ frontend ใช้ |
| --- | --- |
| Project | `/api/v1/projects`, `/{id}`, `/{id}/activity`, `/{id}/usage` |
| Dataset | `/api/v1/datasets`, `/upload-seed`, `/generate`, `/{id}`, `/{id}/preview`, `/{id}/cancel`, `/{id}/download-url` |
| Training | `/api/v1/trainings`, `/{id}`, `/{id}/cancel`, `/{id}/mlflow-url`, `/{id}/metrics`, `/{id}/loss-history` |
| Model | `/api/v1/models`, `/{id}`, `/{id}/export`, `/{id}/export/cancel`, `/{id}/download-url` |
| Evaluation | `/api/v1/evaluations`, `/{id}`, `/{id}/cancel`, `/compare` |
| Inference/metadata | `/api/v1/inference/*`, `/api/v1/tasks`, `/api/v1/base-models`, `/api/v1/sdg-pipeline`, `/api/v1/usage` |
| System/progress | `/health`, `/ready`, `/api/v1/jobs/{job_id}/progress`, `/ws/jobs/{job_id}` |

## ไม่ใช่งาน backend ที่ต้องทำเพิ่ม

- `VITE_MOCK=1` และ `src/mocks/mockEngine.ts` มีไว้สำหรับ development/test เท่านั้น
- Dataset Insights และ Templates ไม่ได้ขาด API ใน backend ปัจจุบัน; frontend ต้องเปลี่ยนจาก mock/prototype มาเรียก endpoint ที่มีอยู่
- ป้ายชื่อ model, theme, ภาษา, empty/loading/error UI และ local onboarding state เป็นหน้าที่ frontend
