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

# Round 7 — Validation + Edge Cases + Navigation

## เป้าหมาย
จัดการ validation และสถานการณ์ผิดปกติให้พร้อมใช้งาน

## Prompt
เพิ่ม validation โดยเฉพาะ `พื้นที่ ↔ การไฟฟ้า`

Requirement:
1. ช่องการไฟฟ้ารองรับ Search
2. การไฟฟ้าที่เลือก/ค้นต้องอยู่ในพื้นที่ที่เลือก
3. หากไม่ตรง ให้แสดง **Inline Error** ใต้ field ตาม Reference
4. อย่าใช้ modal สำหรับ validation นี้
5. ถ้าเลือกหลายพื้นที่ ให้ search ได้เฉพาะการไฟฟ้าที่อยู่ในพื้นที่ที่อนุญาต
6. ถ้าไม่มีข้อมูลหลัง filter ให้แสดง Empty State ที่ชัดเจน
7. รองรับ loading, CSV load error, malformed data
8. ป้องกัน NaN/Infinity/หารด้วยศูนย์
9. ตรวจ navigation ระหว่าง Overview ↔ Complaint Detail
10. ทำ user menu/logout UI ตาม Reference (ใช้ mock behavior หากยังไม่มี authentication จริง)
11. เพิ่ม success/error feedback ที่จำเป็น โดยไม่รบกวน UX

## Acceptance Criteria
- Error case ใน Reference จำลองได้
- invalid office ไม่ trigger query/filter
- empty/loading/error state ไม่ทำให้ layout พัง
- navigation/reset/logout mock ทำงานตามขอบเขต
