# คู่มือติดตั้ง TAWANVERSE 2 — ภาษาไทย

ชุดนี้เป็นแอป Next.js + Supabase + DeepSeek จริง ต้องตั้งฐานข้อมูลและบัญชีก่อนบันทึกข้อมูลหรือใช้ AI ได้ โหมด “ดูตัวอย่างหน้าตาเว็บ” ใช้ข้อมูลสมมติและไม่บันทึกข้อมูล

## 1. เปิดในเครื่องจาก htdocs

โปรเจกต์อยู่ที่ `C:\xampp\htdocs\tawanverse-v2`

เปิด Terminal / PowerShell ในโฟลเดอร์นี้ แล้วรัน:

```powershell
cd C:\xampp\htdocs\tawanverse-v2
npm.cmd ci
Copy-Item .env.example .env.local
# เปิด .env.local ด้วยโปรแกรมแก้ไขข้อความ แล้วใส่ค่าตามข้อ 2
npm.cmd run dev
```

เปิด **http://localhost:3000** ไม่ใช่ `http://localhost/tawanverse-v2` เพราะ Apache ไม่สามารถรัน Next.js API ได้ ไฟล์ `.htaccess` ป้องกัน Apache เสิร์ฟซอร์ส, SQL และ `.env.local` ออกไปโดยตรง หากได้ 403 จาก Apache ให้ใช้พอร์ต 3000

มี `START-DEV.cmd` และ `START-PRODUCTION.cmd` ให้ดับเบิลคลิกเปิดได้ หลังตั้งค่าตัวแปรแล้ว การเปลี่ยน `.env.local` ต้องปิดเซิร์ฟเวอร์แล้วเปิดใหม่ หากพอร์ต 3000 ถูกใช้ ให้รัน `npm.cmd run dev -- --port 3001`

## 2. ตัวแปรที่ต้องสร้าง และหาค่าจากไหน

| ชื่อ | จำเป็นไหม | ใส่ค่าอะไร / หาอย่างไร |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | จำเป็น | เข้า [Supabase Dashboard](https://supabase.com/dashboard) → เลือก Project → Connect หรือ Project Settings → API/Data API → คัดลอก Project URL รูปแบบ `https://PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | จำเป็น | Project Settings → API Keys → คัดลอก **Publishable key** ที่ขึ้นต้น `sb_publishable_...` ถ้ามีเฉพาะ Legacy keys ใช้ `anon` key ได้ |
| `DEEPSEEK_API_KEY` | จำเป็นสำหรับ AI ออนไลน์ | เข้า [DeepSeek Platform](https://platform.deepseek.com/) → API keys → Create API key → คัดลอกค่าครั้งที่สร้าง ตรวจยอดเครดิตในบัญชีให้พร้อมใช้งาน |
| `DEEPSEEK_MODEL` | ไม่บังคับ | ใช้ `deepseek-flash` เป็นค่าเริ่มต้น ปรับเป็นรุ่นอื่นเฉพาะชื่อที่บัญชี/เอกสาร API รองรับ |

ตัวอย่าง `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
DEEPSEEK_API_KEY=REPLACE_WITH_YOUR_KEY
DEEPSEEK_MODEL=deepseek-flash
```

**ไม่ต้องสร้าง** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_SECRET`, `DATABASE_URL` หรือรหัสผ่าน admin ใน environment สำหรับเวอร์ชันนี้ ระบบใช้ JWT ของผู้ใช้และ RLS แทน service-role key อย่านำ secret/service-role key มาใส่แทน publishable key

เวลาใช้ `Asia/Bangkok` ที่ส่วนกลางในโค้ด ไม่ต้องสร้าง `APP_TIMEZONE` บัญชีแอดมินใช้ Supabase Auth ไม่ใช่รหัสผ่านที่ฝังในเว็บ

ค่า `NEXT_PUBLIC_*` ทั้งสองตั้งใจให้เบราว์เซอร์ใช้ได้ ความปลอดภัยของข้อมูลขึ้นกับ RLS และสมาชิกที่กำหนด ส่วน `DEEPSEEK_API_KEY` ใช้เฉพาะฝั่งเซิร์ฟเวอร์ ห้ามเติม `NEXT_PUBLIC_` นำหน้าชื่อนี้ และห้ามอัปโหลด `.env.local` เข้า GitHub

## 3. สร้างฐานข้อมูลด้วย SQL

เลือก Supabase Project ให้ถูก แนะนำ Project ใหม่สำหรับ V2 หรือสำรองข้อมูลเดิมก่อน หากใช้ Project เดิม ตารางใหม่ขึ้นต้น `tv_` และไม่แตะ `site_state` / `push_subscriptions`

เปิด SQL Editor → New query แล้ววางเนื้อหาไฟล์ตามลำดับ:

1. **`sql/01_install.sql`** — รันครั้งเดียว สร้างตาราง, RLS, functions, history และ bucket ส่วนตัว หากชื่อ `tv_*` มีอยู่แล้ว อย่าลบทิ้งเพื่อแก้ error ให้ตรวจว่าเคยติดตั้งแล้วหรือไม่
2. **`sql/02_seed.sql`** — ข้อมูลจริงที่คุณให้มา: ชื่อ วันเกิด วันเริ่มคบ วันบอกรัก หน้าเว็บ 6 หน้า และความชอบสีฟ้าของตะวัน รันซ้ำได้โดยไม่ทับข้อมูลที่แก้เอง
3. **`sql/03_optional_examples.sql`** — ไม่บังคับ เพิ่มโน้ต จดหมาย Wishlist และแคปซูลทดสอบ ทุกชิ้นติด `[ตัวอย่าง]` และไม่ใช่ความทรงจำจริง แคปซูลทดสอบเปิดปี 2099 จึงจะไม่แสดงในรายการ
4. สร้างบัญชีตามข้อ 4 แล้วจึงแก้และรัน **`sql/04_add_members.sql`**

`supabase/migrations/*_foundation.sql` คือ SQL โครงสร้างเดียวกับ `01_install.sql` สำหรับ workflow CLI **เลือกใช้ SQL Editor หรือ migration workflow อย่างใดอย่างหนึ่ง อย่ารัน installation ซ้ำทั้งสองทาง**

สคริปต์ใช้ transaction: หากติดตั้งล้มเหลว transaction จะ rollback ตรวจข้อความ error แล้วแก้สาเหตุก่อนรันใหม่

## 4. สร้างแอดมินและบัญชีตะวัน

1. Supabase → Authentication → Users → Add user / Create new user
2. สร้างบัญชีของคุณด้วยอีเมลและรหัสผ่านที่คุณเลือก ใช้ Auto Confirm หากสร้างบัญชีส่วนตัวเอง
3. สร้างอีกบัญชีสำหรับตะวัน
4. เปิด `sql/04_add_members.sql` แทน `REPLACE_WITH_ADMIN_EMAIL` ด้วยอีเมลคุณ และ `REPLACE_WITH_TAWAN_EMAIL` ด้วยอีเมลตะวัน แล้วรัน SQL
5. เข้าสู่เว็บด้วยอีเมล/รหัสผ่านจริงของบัญชีที่สร้าง

บัญชีคุณมี role `admin` จัดการ Studio และสั่ง LUMI แก้เว็บได้ บัญชีตะวันเป็น `viewer` อ่าน/คุยกับ LUMI ได้ แต่แก้ข้อมูลไม่ได้ หากต้องการให้ตะวันแก้ได้ด้วย ค่อยเปลี่ยน role เป็น `admin` อย่างชัดเจนใน SQL

ผู้ใช้ที่แค่สมัคร Auth แต่ไม่มีแถวใน `tv_members` จะเข้าเนื้อหาส่วนตัวไม่ได้ เว็บไซต์ไม่มีหน้าสมัครเอง สำหรับเว็บคู่รักควรปิดการสมัครผู้ใช้ทั่วไปใน Auth settings ตามการใช้งานของคุณ

Supabase Authentication → URL Configuration ตั้ง Site URL เป็น URL จริงของเว็บ และเพิ่ม `http://localhost:3000` สำหรับทดสอบ หากใช้ password sign-in ตามชุดนี้ ไม่ต้องสร้าง OAuth callback เพิ่ม

## 5. ใช้ Studio และสั่ง LUMI ออกแบบเว็บ

- **Studio → สั่ง LUMI ออกแบบเว็บ** เลือก `EDIT SITE` แล้วบอกว่าต้องการหน้าแบบไหน เช่น “ปรับหน้าแรกให้หวานขึ้น สีฟ้าอ่อน ตัวอักษรใหญ่ และเคลื่อนไหวน้อยลง”
- LUMI อ่าน config ปัจจุบันก่อนเสนอร่าง แก้ได้ทั้ง Home, Journey, Memories, Time, Letters และ LUMI
- ไป **ข้อเสนอ / Drafts → Preview → Apply** เมื่อพอใจ หากต้องการย้อนกลับ ไป **ประวัติ / Undo → เปรียบเทียบ → Undo**
- คำสั่งหนึ่งอาจสร้างหลายร่าง ตรวจและ Apply ทีละร่าง ถ้าข้อมูลเปลี่ยนหลังสร้างร่าง ระบบปฏิเสธด้วยข้อความให้โหลดใหม่ เพื่อไม่ทับงานล่าสุด
- ปรับได้: หัวเรื่อง คำโปรย สี แสง ขนาดตัวอักษร การจัดข้อความ ระยะห่าง การเคลื่อนไหว และลำดับ/การซ่อนส่วนหน้า Home รวมถึงเนื้อหาในตารางที่รองรับ
- ไม่สร้างโค้ดใหม่ ไม่รัน JavaScript/CSS ตามข้อความ AI และไม่สามารถสร้างฟีเจอร์ใหม่ที่ไม่มีในโปรแกรม คำสั่งลักษณะนั้นต้องแก้ซอร์สเพิ่ม
- วันสำคัญ/ชื่อใน Facts ห้าม AI แก้เอง แอดมินแก้เองได้ใน **ข้อมูลสำคัญ**

## 6. ให้ LUMI รู้ข้อมูลเกี่ยวกับตะวัน

ไป **Studio → ข้อมูลของตะวัน → เพิ่ม** ใส่หัวข้อ รายละเอียด หมวด ที่มา และคำค้น เช่น:

- หัวข้อ: อาหารที่ตะวันชอบ
- รายละเอียด: ใส่ข้อมูลจริงที่ตะวันบอก ไม่ใส่ตัวอย่างนี้เป็นข้อเท็จจริง
- ที่มา: ตะวันบอกเอง
- คำค้น: อาหาร, ชอบ, ตะวัน

ข้อมูลบันทึกใน `tv_knowledge` และค้นผ่านเครื่องมือ `searchKnowledge` ของ LUMI ไม่ได้เป็นการฝึกโมเดลใหม่ ข้อมูลที่เกี่ยวข้องจะถูกส่งให้ DeepSeek เมื่อสนทนา ผู้ดูแลควรเลือกข้อมูลที่เหมาะกับการใช้ผ่านผู้ให้บริการ AI

ระบบค้นด้วยคำสำคัญ ยังไม่ใช่ embeddings/semantic search หากหาไม่เจอ ลองคำสั้น เช่น “อาหาร” หรือ “สี” LUMI ต้องแจ้งเมื่อไม่มีข้อมูล ไม่รับประกันว่าจะรู้ทุกเรื่องของตะวันที่ไม่เคยบันทึก

## 7. ภาพ เพลง และแคปซูล

Studio → คลังสื่อ อัปโหลดไฟล์ได้สูงสุด 20 MB ตามชนิดที่รองรับ ไฟล์ส่งเข้า Supabase Storage โดยตรงด้วยสิทธิ์ผู้ใช้ ไม่ผ่านข้อจำกัดขนาด body ของ Vercel Functions

หลังอัปโหลด จะมี path เช่น `storage://USER_ID/FILE_ID.jpg` นำค่านี้ไปใส่ URL ภาพปกในความทรงจำ/อัลบั้ม หรือ URL เพลงได้ ระบบสร้าง signed URL อายุ 10 นาทีเมื่อเปิดใช้ ลิงก์ HTTPS ภายนอกก็ใช้ได้ แต่ผู้ให้บริการภายนอกอาจลบไฟล์หรือปฏิเสธการเล่น

เพลงต้องกดปุ่มเสียงก่อนจึงเล่นได้ ไม่เริ่มเองโดยไม่มีการแตะ Volume และ Reduce Motion เก็บเป็นค่าของอุปกรณ์

แคปซูลในชุดนี้เป็นข้อความ ไม่รองรับไฟล์แนบลับ แคปซูลที่ยังล็อกไม่ถูกส่งไปเว็บ/AI แม้บัญชีแอดมินจะสร้างได้ ก็อ่านย้อนหลังผ่านหน้าปกติไม่ได้จนถึงเวลาเปิด **อย่าเก็บไฟล์แนบแคปซูลลับใน bucket สื่อทั่วไป** เพราะสมาชิกทั้งคู่มีสิทธิ์อ่าน bucket นั้น

## 8. นำขึ้น GitHub และ Vercel

1. สร้าง repository ใหม่แบบ **Private** หรือ branch `tawanverse-v2` ใน repo เดิม อย่าแทนที่ branch production เก่าทันที
2. อัปโหลด **เนื้อหาภายในโฟลเดอร์** ให้ `package.json` อยู่ root ของ repo พร้อม `package-lock.json`, `src`, `public`, `sql` และ `supabase`
3. ไม่อัปโหลด `node_modules`, `.next`, `.env.local`, logs, backups หรือ test artifacts ไฟล์ ZIP ที่ให้มาจัดแยกสิ่งเหล่านี้แล้ว
4. เข้า [Vercel](https://vercel.com/new) → Import Git Repository → เลือก repo
5. Framework Preset: **Next.js**; Node.js: **24.x**; Build Command: `npm run build`; Output Directory: ใช้ค่าเริ่มต้นของ Next.js ไม่เลือก static export
6. Root Directory ต้องเป็นโฟลเดอร์ที่มี `package.json` หากอัปโหลดซ้อน `tawanverse-v2` ให้เลือกโฟลเดอร์นั้น
7. ไป Project → Settings → Environment Variables เพิ่ม 2 ค่าของ Supabase และ 2 ค่าของ DeepSeek ตามข้อ 2 เลือก environment ที่ต้องใช้ (Preview / Production)
8. Deploy ใหม่หลังตั้งหรือเปลี่ยนตัวแปร `NEXT_PUBLIC_*` เพราะค่าเหล่านี้ถูกใส่ใน browser bundle ตอน build
9. ทดลอง Preview URL: login, สร้าง/แก้/ลบ event, เปิด Time/Journey อีกแท็บ, refresh, สั่ง LUMI, Preview/Apply/Undo และแคปซูล
10. จึงค่อยย้ายโดเมน/production เก็บ deployment เก่าและ backup ไว้สำหรับ rollback

การสมัคร/เติมเงิน/เชื่อม GitHub ของ Vercel และการนำ production ขึ้นจริงยังเป็นขั้นตอนของคุณตามที่ขอไว้ ชุดไฟล์นี้ไม่ได้ deploy แทนคุณ

## 9. เครดิต DeepSeek

เปิดหน้าเว็บ ปฏิทิน ฟังเพลง และแก้ข้อมูลด้วยมือไม่เรียก AI จะเรียกเฉพาะเมื่อกดส่งข้อความถึง LUMI

ใช้ `deepseek-flash`, จำกัด 5 รอบ provider ต่อคำสั่ง, 2,000 output tokens ต่อรอบ, history ล่าสุด 8 ข้อความ, เครื่องมือคืนข้อมูลจำกัด และ 6 คำสั่งต่อนาทีต่อสมาชิก คำสั่งหลายหน้าอาจมีหลายรอบ จึงไม่เท่ากับ 1 API call เสมอ ขีดจำกัดนี้ไม่ใช่วงเงินรายเดือน

ตรวจยอดเงินจริงที่ DeepSeek Platform → Usage/Billing และตรวจ [ราคาอย่างเป็นทางการ](https://api-docs.deepseek.com/quick_start/pricing/) ก่อนเติมเงิน ราคาและรุ่นอาจเปลี่ยนได้ หากไม่มี key หรือ provider ใช้งานไม่ได้ LUMI แสดง Offline Assist อย่างชัดเจน ไม่แอบอ้างว่าเป็น AI เต็มรูปแบบ

## 10. ตรวจสอบและแก้ปัญหา

```powershell
npm.cmd run check
```

คำสั่งนี้ตรวจ TypeScript, unit tests, SQL บน PostgreSQL จำลองแยก และ production build ไม่แก้ Supabase จริง ดูข้อจำกัดและผลล่าสุดใน `TEST_REPORT.md`

| อาการ | ตรวจอะไร |
|---|---|
| เปิด `/localhost/tawanverse-v2` แล้ว 403 | ใช้ `http://localhost:3000` หลังเปิด Node server |
| ยังไม่ได้ตั้งค่า Supabase | ตรวจ `.env.local` และ restart server |
| เข้าสู่ระบบไม่สำเร็จ | บัญชี Auth, password และการยืนยันอีเมล |
| บัญชียังไม่มีสิทธิ์ | รัน `04_add_members.sql` ให้ตรงอีเมลจริง |
| โหลดข้อมูลไม่สำเร็จ | รัน installation/seed ครบไหม ใช้ URL/key ของ project เดียวกันไหม |
| API table/permission error | ตรวจตาราง `tv_*`, RLS และ grants จาก `01_install.sql` ไม่แก้ด้วยการเปิด public access ทั้งหมด |
| AI Offline | ตรวจ server-side `DEEPSEEK_API_KEY`, ชื่อ model, เครดิต และ redeploy/restart |
| รูปอัปโหลดไม่ได้ | ตรวจ bucket `tawanverse`, Storage policies และ role admin |
| ข้อมูลเปลี่ยนไปแล้ว | มีอีกหน้าจอแก้ก่อน ให้ refresh แล้วสร้างร่างใหม่ |
| แคปซูลไม่ปรากฏ | เป็นพฤติกรรมตั้งใจจนถึง `unlock_at` |

อ้างอิง: [Supabase API keys](https://supabase.com/docs/guides/api/api-keys), [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Private Storage](https://supabase.com/docs/guides/storage/buckets/fundamentals), [DeepSeek API](https://api-docs.deepseek.com/api/create-chat-completion/), [Vercel variables](https://vercel.com/docs/environment-variables)
