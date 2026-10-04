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

# Round 2 — Mock CSV + Data Model

## เป้าหมาย
สร้าง Mock CSV และ data layer กลางให้ทุกหน้าสามารถคำนวณข้อมูลจริงจาก CSV ได้

## Prompt
ต่อยอดจาก Round 1 โดยห้ามรื้อ UI ที่ทำงานแล้ว

ออกแบบ Mock CSV ที่รองรับ Dashboard ทั้งระบบ แต่ละ record ควรมีอย่างน้อย:
- complaint_id
- created_at
- closed_at (nullable)
- status
- year
- month
- region
- pea_office
- contact_channel
- voice_type_level1
- topic_level2
- issue_level3
- subissue_level4
- sla_status หรือข้อมูลวันที่ที่เพียงพอให้คำนวณ SLA

ให้ข้อมูล mock มีความหลากหลายพอสำหรับ:
- หลายปี/เดือน
- ทุกภูมิภาคและหลายการไฟฟ้า
- หลายสถานะ
- ประเภทเสียง 5 สีตาม Reference
- hierarchy Level 1–4
- ช่องทางติดต่อ
- SLA: เกินกำหนด / ใกล้ครบกำหนด / ภายในกำหนด

งาน:
1. สร้างไฟล์ CSV
2. สร้าง parser/loader
3. normalize field/type/date
4. สร้าง Type/Interface/Schema ของ record
5. สร้าง utility aggregation ที่ reusable
6. เตรียม mapping พื้นที่ → การไฟฟ้า
7. จัดการ malformed/missing data อย่างปลอดภัย
8. เปลี่ยน placeholder ที่จำเป็นให้เริ่มอ่านจาก data layer

ข้อสำคัญ:
**ห้าม hard-code จำนวนและเปอร์เซ็นต์บน Dashboard ทุกค่าต้อง derive จาก CSV**

## Acceptance Criteria
- เปลี่ยนข้อมูลใน CSV แล้วค่าที่อ่านใน app เปลี่ยนตาม
- ไม่มี aggregation logic ซ้ำกระจัดกระจาย
- hierarchy และ mapping พื้นที่/การไฟฟ้าพร้อมใช้
