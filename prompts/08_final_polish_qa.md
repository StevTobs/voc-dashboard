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

# Round 8 — Final Polish + QA

## เป้าหมาย
ตรวจทั้งระบบเทียบ Reference และแก้ defect ก่อนถือว่า Prototype เสร็จ

## Prompt
ห้ามเพิ่ม feature ใหม่โดยไม่จำเป็น รอบนี้เน้น QA และ polish

ทำงานดังนี้:
1. ตรวจทุกหน้าเทียบภาพ Reference
2. ปรับ spacing, font size/weight, border, radius, alignment, chart sizing และสี
3. ตรวจ responsive desktop/tablet/mobile
4. ตรวจ Multiple Choice, Search, Reset
5. ตรวจ Cross-filter
6. ตรวจ hierarchy Level 1–4
7. ตรวจพื้นที่ ↔ การไฟฟ้า + Inline Error
8. ตรวจ tooltip, legend, scrollbar และ selected state
9. ตรวจ KPI/percent/total ว่า reconcile กับ filtered CSV
10. ตรวจไม่มี hard-coded dashboard numbers
11. ตรวจ console/build/lint/type errors
12. ลด duplicated code และแก้เฉพาะจุดที่จำเป็น
13. สรุป architecture และวิธีเปลี่ยน data source จาก Mock CSV เป็น API/Database ในอนาคต โดยไม่ต้อง implement API ตอนนี้

สร้าง checklist ทดสอบอย่างน้อย:
- default state
- multi-select
- single voice type
- multiple voice types
- single region
- multiple regions
- invalid electricity office
- hierarchy selection
- reset
- empty result
- mobile viewport

## Definition of Done
Prototype ใช้งานได้ครบตาม Requirement และค่าทั้งหมดมาจาก Mock CSV ผ่าน data/filter layer เดียวกัน
