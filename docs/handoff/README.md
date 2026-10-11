# เอกสารส่งต่องาน Frontend / Backend

ตรวจสอบเมื่อ: 25 กันยายน 2026  
ขอบเขต: `tunelab-frontend-selfhosted` เทียบกับ `../slm-finetune-platform-dem`

เอกสารชุดนี้จัดตามผู้รับผิดชอบ เพื่อให้เลือกอ่านและส่งต่องานได้ตรงส่วน

```text
docs/
└── handoff/
    ├── README.md
    ├── 01-backend/
    │   └── required-changes.md
    └── 02-frontend/
        └── frontend-owned-changes.md
```

| เอกสาร | ใช้ตอบคำถาม |
| --- | --- |
| [01-backend/required-changes.md](01-backend/required-changes.md) | Backend ต้องเพิ่มหรือยืนยันอะไรจึงจะเปิดฟังก์ชันบน self-hosted frontend ได้ |
| [02-frontend/frontend-owned-changes.md](02-frontend/frontend-owned-changes.md) | เรื่องใด frontend แก้และทดสอบได้เอง โดยไม่ต้องรอ backend |

## ข้อสรุปจากการตรวจ

Pipeline หลักเชื่อมต่อกันแล้ว: project, upload/SDG, training/HPO, artifact export/download, evaluation, inference, usage, metadata และ job progress ผ่าน REST/WebSocket. ไม่พบ endpoint หลักที่ frontend เรียกแล้วไม่มีใน backend ปัจจุบัน

สิ่งที่ยังไม่เป็นหน้าจอจริงแบ่งเป็น 2 แบบ:

1. Backend มี API แล้ว แต่ frontend ยังใช้ mock หรือ prototype ได้แก่ Dataset Insights และ Templates
2. Backend ยังไม่มี product API ได้แก่ Analytics และ Deployment จึงยังเป็น `PrototypePage`

ให้ยึด `src/api/types.ts` ของ frontend และ `../slm-finetune-platform-dem/openapi.json` เป็น API contract ร่วมกัน ไม่ยึดข้อมูลใน `src/mocks/` หรือ `src/data/*MockData.ts` เป็น contract production
