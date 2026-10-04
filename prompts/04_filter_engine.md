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

# Round 4 — Filter Engine + Multiple Choice

## เป้าหมาย
ทำ Filter กลางให้ทุกองค์ประกอบใช้ state เดียวกัน

## Prompt
ต่อยอด Dashboard โดยสร้าง centralized filter state สำหรับ:
- สถานะ
- เดือน
- ปี
- ประเภทเสียง
- พื้นที่

Requirement:
1. ทุก filter เป็น Multiple Choice ตาม Reference
2. มี option `ทั้งหมด`
3. แสดงจำนวนรายการที่เลือกเมื่อเหมาะสม
4. Search/Apply ต้องทำให้ทุก KPI และ chart ใช้ filtered dataset เดียวกัน
5. Reset คืนค่า default ทั้งหมด
6. Filter options ที่เป็นไปได้ควร derive จาก data
7. รองรับการเลือกหลายปี/เดือน/พื้นที่/ประเภทเสียง
8. URL/state architecture ควรพร้อมสำหรับต่อยอด แต่ไม่ต้อง over-engineer

ตรวจสอบให้ aggregation ทุกตัวทำงานหลัง filter และไม่มี chart ใดใช้ dataset คนละชุดโดยไม่ตั้งใจ

## Acceptance Criteria
- เลือก filter หลายค่าได้
- KPI + charts เปลี่ยนพร้อมกัน
- Reset ทำงาน
- ผลรวมและเปอร์เซ็นต์ถูกต้องหลังกรอง
- ไม่มี stale state
