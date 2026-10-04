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

# Round 3 — PEA Complaint ภาพรวม

## เป้าหมาย
ทำหน้า Overview ให้ทำงานจาก Mock CSV จริงตามภาพ Reference

## Prompt
ต่อยอดจาก Round 1–2 และใช้ data layer ที่มีอยู่

สร้างหน้า **PEA Complaint ภาพรวม** ให้ครบ:
1. KPI `ปิดคำร้อง`
   - จำนวนรวม
   - สัดส่วน
   - เกินกำหนด
   - ภายในกำหนด
2. KPI `อยู่ระหว่างดำเนินการ`
   - จำนวนรวม
   - เกินกำหนด
   - ใกล้ครบกำหนด
   - ภายในกำหนด
3. KPI `รวมคำร้องทั้งหมด`
4. Donut `จำแนกตามพื้นที่`
5. Donut `ประเภทเสียง`
6. Main stacked bar แยกตามการไฟฟ้า/พื้นที่ตาม Reference

ทุกจำนวนและเปอร์เซ็นต์ต้องคำนวณจาก CSV และ denominator ต้องถูกต้อง

รักษาสีประเภทเสียงตาม Common Rules และให้ tooltip/label อ่านง่าย

ยังไม่ต้องทำ Cross-filter เต็มรูปแบบในรอบนี้ แต่ component ต้องออกแบบให้รองรับ event selection ในรอบถัดไป

## Acceptance Criteria
- KPI และกราฟ reconcile กับ CSV
- ไม่มีค่าจำลอง hard-coded
- สี/legend/label ใกล้ Reference
- Empty dataset ไม่ทำให้หน้า crash
