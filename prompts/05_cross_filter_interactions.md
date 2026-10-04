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

# Round 5 — Cross-filter + Chart Interaction

## เป้าหมาย
ทำให้กราฟเป็นตัวกรองข้อมูลแบบ interactive ตาม Reference

## Prompt
เพิ่ม Cross-filter โดยใช้ filter state กลางเดิม

พฤติกรรมหลัก:
- คลิก slice ของ `จำแนกตามพื้นที่` → filter พื้นที่
- คลิก slice ของ `ประเภทเสียง` → filter ประเภทเสียง
- คลิก bar/segment ที่เหมาะสม → filter dimension นั้น
- selection จาก chart ต้องสะท้อนกับ filter state ด้านบน
- สามารถยกเลิก selection ได้
- Reset ต้องล้างทั้ง filter จาก controls และ chart
- ห้ามสร้าง filter state แยกกันจนเกิดข้อมูลไม่ตรงกัน

กำหนด selected/unselected visual state ให้ชัดเจนและใกล้ Reference เช่นส่วนที่ไม่ได้เลือกเป็นสีเทาเมื่อเหมาะสม

ระวัง feedback loop ของ chart event และ state update

## Acceptance Criteria
- Cross-filter ทำงานสองทางกับ controls
- ทุก chart/KPI refresh ถูกต้อง
- ไม่มี infinite re-render
- selection state มองเห็นได้
