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

# Round 1 — Project Foundation + UI Shell

## เป้าหมาย
สร้างโครงสร้าง Frontend และ UI shell ของ PEA VOC Dashboard ให้ใกล้เคียงภาพ Reference โดยยังไม่เน้น data logic

## Prompt
คุณกำลังพัฒนา **PEA VOC Dashboard** จากภาพ Reference ที่แนบไว้ใน conversation

ให้เริ่มจากตรวจสอบ codebase ปัจจุบันก่อน หากมี project อยู่แล้วให้ต่อยอดจากของเดิม ห้ามสร้างใหม่หรือเปลี่ยน framework โดยไม่จำเป็น

งานรอบนี้:
1. สร้าง/ปรับ Header และ Navigation ให้ใกล้ Reference: PEA branding, VOC Dashboard, tabs และ user area
2. สร้าง route/page อย่างน้อย:
   - PEA Complaint ภาพรวม
   - ประเภทเสียงร้องเรียน
3. วาง Filter bar placeholder สำหรับ สถานะ / เดือน / ปี / ประเภทเสียง / พื้นที่ และ Search/Reset
4. สร้าง reusable Card/Chart container/KPI shell
5. วาง layout หน้า Overview: KPI ด้านบน, donut 2 กราฟซ้าย, main chart ขวา
6. วาง layout หน้า Complaint Detail: 6 chart cards แบบ 2 columns ตาม Reference
7. ทำ responsive สำหรับ desktop/tablet/mobile
8. ใช้ typography, spacing, border, radius และสีให้ใกล้ Reference

ข้อจำกัด:
- รอบนี้ยังไม่ต้องทำ business logic เต็มรูปแบบ
- อย่า hard-code mock KPI เพื่อให้ดูเหมือนข้อมูลจริง; ใช้ placeholder ที่แยกออกจาก data layer ชัดเจน
- เตรียม component structure ให้พร้อมเชื่อม CSV ใน Round 2

## Acceptance Criteria
- เปิดทั้ง 2 หน้าได้
- layout ใกล้ Reference และไม่ overflow ผิดปกติ
- components แยกใช้งานซ้ำได้
- responsive
- ไม่มี error ใน console/build
