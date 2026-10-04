# PEA VOC Dashboard — Common Rules

ใช้ภาพ Reference ที่ผู้ใช้ให้ไว้ใน conversation เป็นแหล่งอ้างอิงด้าน UI/UX หลัก

## Baseline requirements
- ระบบ: PEA VOC Dashboard
- ระยะแรกใช้ Mock CSV เป็น data source
- ห้าม hard-code จำนวน, เปอร์เซ็นต์, KPI หรือค่าบนกราฟ ข้อมูลทั้งหมดต้องคำนวณจาก CSV
- Filter หลัก: สถานะ, เดือน, ปี, ประเภทเสียง, พื้นที่
- Filter หลักรองรับ Multiple Choice
- มี Search และ Reset
- การไฟฟ้าต้องสัมพันธ์กับพื้นที่ที่เลือก หากไม่สัมพันธ์ให้แสดง Inline Error
- ทุก KPI และทุกกราฟต้องใช้ filtered dataset เดียวกัน
- รองรับ Cross-filter จากการคลิกกราฟ
- Hierarchy: Level 1 → Level 2 → Level 3 → Level 4
- เมื่อเลือกข้อมูล Level บน ต้องกรอง Level ล่าง
- สีประเภทเสียงให้ยึดตาม Reference ให้ใกล้เคียงที่สุด:
  - ร้องเรียน: แดง
  - ข้อเสนอแนะ/ข้อคิดเห็น: ส้ม
  - แจ้งเหตุ: เหลือง
  - แจ้งเบาะแส: เขียวอ่อน
  - ชื่นชม: เขียว
- Layout ต้อง responsive
- อย่ารื้อ architecture หรือ component ที่ทำงานแล้วโดยไม่จำเป็น
- หลังจบแต่ละรอบ ให้สรุปไฟล์ที่เพิ่ม/แก้, วิธีทดสอบ, และสิ่งที่ยังไม่ทำ


---

# Round 6 — Complaint Detail + Hierarchy Level 1–4

## เป้าหมาย
สร้างหน้า `ประเภทเสียงร้องเรียน` ให้ครบตาม Reference

## Prompt
สร้าง/ปรับหน้า Complaint Detail โดย reuse filter/data architecture เดิม

ด้านบนมี:
สถานะ / เดือน / ปี / ประเภทเสียง / พื้นที่ / การไฟฟ้า / Search / Reset

แสดง 6 chart cards:
1. การไฟฟ้า 10 อันดับแรกที่มีเสียงมากที่สุด
2. ช่องทางการติดต่อทั้งหมด
3. ประเภทเสียง (Level 1)
4. แสดงหัวข้อ (Level 2)
5. แสดงประเด็นเสียง (Level 3)
6. แสดงประเด็นย่อย (Level 4)

Hierarchy:
`Level 1 → Level 2 → Level 3 → Level 4`

เมื่อเลือก Level 1 ต้องกรอง 2–4
เมื่อเลือก Level 2 ต้องกรอง 3–4
เมื่อเลือก Level 3 ต้องกรอง 4
และต้องรองรับการล้าง selection

เมื่อมีหลายประเภทเสียง ให้ใช้ stacked bars ตามสีประเภทเสียงเหมือน Reference; เมื่อ filter เหลือประเภทเดียว ให้แสดงสีของประเภทนั้น

รองรับ tooltip, scroll ภายใน chart card สำหรับรายการจำนวนมาก และ sorting ที่เหมาะสม

## Acceptance Criteria
- 6 charts อ่านจาก CSV
- hierarchy cascade ถูกต้อง
- chart interactions ไม่ขัดกับ global filters
- top 10 คำนวณจริง
- contact channels คำนวณจริง
