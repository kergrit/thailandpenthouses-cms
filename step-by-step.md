# บันทึกขั้นตอนการสร้างโปรเจกต์ Thailand Penthouses CMS

เอกสารนี้สรุปขั้นตอนการทำงานทั้งหมดในการตั้งค่าและพัฒนาระบบ Content Management System (CMS) สำหรับ Thailand Penthouses โดยใช้ Next.js, Docker, และ Google Cloud Platform (GCP)

## ข้อมูลสำคัญและ Naming Convention

| Resource                  | Name / ID                                                              | Notes                                  |
| ------------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| **Project ID**            | `sc-thailandpenthouses-uat`                                            | โปรเจกต์หลักบน GCP                     |
| **Region**                | `asia-southeast1`                                                      | Region หลักที่ใช้ deploy service        |
| **Cloud Run Service**     | `thailandpenthouses-poc`                                               | Service สำหรับ Proof of Concept       |
| **Cloud SQL Instance**    | `psql17-thailandpenthouses-uat`                                        | (Connection Name: `sc-thailandpenthouses-uat:asia-southeast1:psql17-thailandpenthouses-uat`) |
| **Cloud Storage Bucket**  | `thailandpenthouses-cms-media`                                         | สำหรับเก็บไฟล์ media                  |
| **Service Account**       | `788797734746-compute@developer.gserviceaccount.com`                   | Service Account หลักของ Cloud Run       |
| **Load Balancer IP**      | `thailandpenthouses-cms-ip`                                            | (IP: `34.8.214.124`)                   |
| **Load Balancer Backend** | `thailandpenthouses-cms-backend`                                       | สำหรับ Cloud Run                       |
| **Load Balancer Bucket**  | `thailandpenthouses-cms-bucket-backend`                                | สำหรับ Cloud Storage                   |
| **NEG (Cloud Run)**       | `thailandpenthouses-poc-neg`                                           | Network Endpoint Group for POC         |
| **SSL Certificates**      | `thailandpenthouses-web-digi-team-work`, `thailandpenthouses-api-digi-team-work`, `thailandpenthouses-cms-digi-team-work`, `thailandpenthouses-cdn-digi-team-work` | Certificates ที่ใช้งานจริง |
| **URL Map**               | `thailandpenthouses-cms-lb`                                            |                                        |
| **Target HTTPS Proxy**    | `thailandpenthouses-cms-lb-target-proxy`                               |                                        |
| **Forwarding Rule**       | `thailandpenthouses-cms-lb-forwarding-rule`                           |                                        |


## 1. การตั้งค่าโปรเจกต์เริ่มต้น
- **สร้างโปรเจกต์ Next.js:** เริ่มต้นโปรเจกต์ด้วยคำสั่ง `npx create-next-app` พร้อมตั้งค่าสำหรับ TypeScript, Tailwind CSS, ESLint, และ App Router.
  ```bash
  npx --yes create-next-app@latest . --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"
  ```
- **ตรวจสอบเวอร์ชัน Node.js:** ใช้ Node.js v20.18.3 เป็นเวอร์ชันหลักสำหรับโปรเจกต์.
  ```bash
  node -v
  ```

## 2. Dockerization
- **สร้าง `Dockerfile`:** สร้าง Dockerfile แบบ multi-stage build เพื่อให้ production image มีขนาดเล็กและปลอดภัย.
- **เปิดใช้งาน Standalone Output:** แก้ไขไฟล์ `next.config.ts` โดยเพิ่ม `output: 'standalone'`.
- **สร้าง `.dockerignore`:** เพิ่มไฟล์ `.dockerignore` เพื่อป้องกันไม่ให้ไฟล์ที่ไม่จำเป็นถูก copy เข้าไปใน Docker image.
- **Build และ Run:** ทดสอบ build Docker image และ run container บนเครื่อง local.
  ```bash
  # Build the image
  docker build -t kergrit/thailandpenthouses-cms .

  # Run the container
  docker run -p 3001:3000 kergrit/thailandpenthouses-cms
  ```

## 3. การตั้งค่า Git และ Branching Strategy
- **Initialize Git และเชื่อมต่อ Remote:**
  ```bash
  git init
  git remote add origin https://github.com/kergrit/thailandpenthouses-cms.git
  ```
- **สร้าง Branch และ Commit เริ่มต้น:**
  ```bash
  git checkout -b develop
  git add .
  git commit -m "Initial commit with Next.js project and Docker setup"
  git branch staging
  git branch main
  ```
- **Push Branch เริ่มต้น:**
  ```bash
  git push -u origin --all
  ```

## 4. Proof of Concept (POC) - CI/CD และ Environment Variables
- **ดึงค่า Secret `APP_VERSION`:**
    - แก้ไข `src/app/page.tsx` เพื่ออ่าน `process.env.APP_VERSION`.
    - **แก้ไขปัญหา Static Rendering:** เพิ่ม `export const dynamic = 'force-dynamic';` ใน `src/app/page.tsx` เพื่อบังคับให้ render ใหม่ทุกครั้ง.
- **ทดสอบบน Local:**
  ```bash
  # Build the new image
  docker build -t kergrit/thailandpenthouses-cms .

  # Run the container with an environment variable
  docker run -p 3001:3000 -e APP_VERSION="1.0.0-local-docker" kergrit/thailandpenthouses-cms
  ```
- **Push เพื่อทดสอบ CI/CD:**
  ```bash
  git add .
  git commit -m "feat: display app version from env and force dynamic rendering"
  git push origin main
  ```

## 5. การจัดการสิทธิ์ (IAM) และการเชื่อมต่อฐานข้อมูล

### 5.1. การตั้งค่าและรัน Cloud SQL Proxy (สำหรับ Local Development)
- **วัตถุประสงค์:** เพื่อให้สามารถเชื่อมต่อกับฐานข้อมูล Cloud SQL จากเครื่อง local ได้อย่างปลอดภัย
- **คำสั่งสำหรับรัน Proxy:** เปิด Terminal ใหม่และรันคำสั่งนี้ (ต้องติดตั้ง `gcloud` และ `cloud-sql-proxy` ไว้ก่อนแล้ว)
  ```bash
  cloud-sql-proxy sc-thailandpenthouses-uat:asia-southeast1:psql17-thailandpenthouses-uat --port 5432
  ```
  - Proxy จะทำงานอยู่เบื้องหน้าและแสดง log การเชื่อมต่อ
  - ต้องเปิด Terminal นี้ทิ้งไว้ตลอดเวลาที่ต้องการเชื่อมต่อกับฐานข้อมูลจาก local
  - **ตัวอย่าง Output ที่สำเร็จ:**
    ```
    2025/08/06 14:14:01 Authorizing with Application Default Credentials
    2025/08/06 14:14:01 [sc-thailandpenthouses-uat:asia-southeast1:psql17-thailandpenthouses-uat] Listening on 127.0.0.1:5432
    2025/08/06 14:14:01 The proxy has started successfully and is ready for new connections!
    ```

### 5.2. การจัดการสิทธิ์ Secret Manager
- **ปัญหา:** `Permission 'secretmanager.secrets.getIamPolicy' denied`
- **สาเหตุ:** บัญชีที่ใช้ `gcloud` ไม่มีสิทธิ์จัดการ Secret
- **แก้ไข:**
    1. ใน Google Cloud Console, ไปที่หน้า IAM และเพิ่ม Role `Secret Manager Admin` ให้กับบัญชีผู้ใช้
    2. ล็อคอิน gcloud ด้วยบัญชีที่ถูกต้อง:
       ```bash
       gcloud auth login kergrit@gmail.com
       ```
- **ผูกสิทธิ์ (Bind Policy):** รันคำสั่ง gcloud เพื่อให้ Service Account ของ Cloud Run เข้าถึง Secret ได้
  ```bash
  gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:788797734746-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project="sc-thailandpenthouses-uat"
  ```

### 5.3. POC การเชื่อมต่อฐานข้อมูล (PostgreSQL)
- **ติดตั้ง Library:**
  ```bash
  npm install pg
  npm install --save-dev @types/pg
  ```
- **ตั้งค่า Local Environment:** สร้างไฟล์ `.env.local` และใส่ข้อมูลการเชื่อมต่อสำหรับ Cloud SQL Proxy
  ```
  # .env.local
  DB_USER=cms_user
  DB_PASSWORD=YOUR_LOCAL_DB_PASSWORD
  DB_NAME=cms_db
  DB_HOST=127.0.0.1
  DB_PORT=5432
  APP_VERSION=1.1.0-local-db-test
  ```
- **Source Code: Database Connection (`src/lib/db.ts`)**
  - โค้ดนี้จะตรวจสอบ `NODE_ENV` เพื่อเลือกว่าจะเชื่อมต่อผ่าน TCP (สำหรับ Local) หรือ Unix Socket (สำหรับ Production บน Cloud Run)
- **Source Code: Query และแสดงผล (`src/app/page.tsx`)**
  - Component ถูกเปลี่ยนเป็น `async function` เพื่อ `await` ผลลัพธ์จากฐานข้อมูล

### 5.4. การให้สิทธิ์ Cloud Run เขียนไฟล์ลง Cloud Storage
- **ปัญหา:** Cloud Run service ไม่สามารถอัปโหลดไฟล์ไปยัง Cloud Storage ได้
- **สาเหตุ:** Service Account ที่ผูกกับ Cloud Run ไม่มีสิทธิ์ `storage.objects.create` หรือ `storage.objects.delete`
- **วิธีแก้ปัญหา:** เพิ่ม Role `Storage Object Admin` (`roles/storage.objectAdmin`) ให้กับ Service Account ของ Cloud Run บน Bucket ที่ต้องการ
  ```bash
  gcloud storage buckets add-iam-policy-binding gs://thailandpenthouses-cms-media \
    --member="serviceAccount:788797734746-compute@developer.gserviceaccount.com" \
    --role="roles/storage.objectAdmin" \
    --project="sc-thailandpenthouses-uat"
  ```

### 5.5. การให้สิทธิ์ Cloud Run สร้าง Signed URL (Sign Blob)
- **ปัญหา:** เกิดข้อผิดพลาด `Permission 'iam.serviceAccounts.signBlob' denied` เมื่อพยายามอัปโหลดไฟล์
- **สาเหตุ:** Service Account ของ Cloud Run ไม่มีสิทธิ์ในการใช้ Key ของตัวเองเพื่อสร้าง "ลายเซ็น" สำหรับ Signed URL
- **วิธีแก้ปัญหา:** เพิ่ม Role `Service Account Token Creator` (`roles/iam.serviceAccountTokenCreator`) ให้กับตัว Service Account เอง เพื่ออนุญาตให้มันสร้างลายเซ็นได้
  ```bash
  gcloud iam service-accounts add-iam-policy-binding 788797734746-compute@developer.gserviceaccount.com \
    --member="serviceAccount:788797734746-compute@developer.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project="sc-thailandpenthouses-uat"
  ```
### 5.6. การตั้งค่า CORS สำหรับ Google Cloud Storage
- **ปัญหา:** เกิดข้อผิดพลาด `... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present...` เมื่ออัปโหลดไฟล์จากเบราว์เซอร์
- **สาเหตุ:** Google Cloud Storage โดยค่าเริ่มต้นจะไม่อนุญาตให้เว็บแอปพลิเคชันจากโดเมนอื่น (เช่น `thailandpenthouses-poc.digi-team.work`) ส่งคำร้องขอมายัง `storage.googleapis.com` โดยตรง
- **วิธีแก้ปัญหา:** ต้องกำหนดค่า Cross-Origin Resource Sharing (CORS) บน Bucket เพื่ออนุญาตให้โดเมนของเราร้องขอได้
  1.  **สร้างไฟล์ `cors-config.json`:**
      ```json
      [
        {
          "origin": [
            "https://thailandpenthouses-poc.digi-team.work",
            "http://localhost:3000"
          ],
          "method": ["PUT", "GET", "HEAD"],
          "responseHeader": [
            "Content-Type",
            "Access-Control-Allow-Origin"
          ],
          "maxAgeSeconds": 3600
        }
      ]
      ```
  2.  **นำ Config ไปใช้กับ Bucket:**
      ```bash
      gcloud storage buckets update gs://thailandpenthouses-cms-media --cors-file=cors-config.json --project=sc-thailandpenthouses-uat
      ```
## 6. การตั้งค่า Load Balancer และ CDN
- **วัตถุประสงค์:** สร้าง Global External HTTPS Load Balancer เพื่อจัดการ traffic, SSL certificate, และ custom domain โดยมีการ routing traffic ตาม hostname ที่แตกต่างกัน.

### 6.1. สร้าง Backends
- **Backend สำหรับ Cloud Run (Serverless NEG):**
  - สร้าง Network Endpoint Group (NEG) เพื่อชี้ไปยัง Cloud Run service และสร้าง Backend Service สำหรับ NEG.
  ```bash
  # Create NEG for the POC service
  gcloud compute network-endpoint-groups create thailandpenthouses-poc-neg --region=asia-southeast1 --network-endpoint-type=serverless --cloud-run-service=thailandpenthouses-poc --project=sc-thailandpenthouses-uat
  # Create Backend Service
  gcloud compute backend-services create thailandpenthouses-poc-backend --global --project=sc-thailandpenthouses-uat
  # Add NEG to Backend Service
  gcloud compute backend-services add-backend thailandpenthouses-poc-backend --global --network-endpoint-group=thailandpenthouses-poc-neg --network-endpoint-group-region=asia-southeast1 --project=sc-thailandpenthouses-uat
  ```
- **Backend สำหรับ Cloud Storage (Backend Bucket):**
  - สร้าง Backend Bucket เพื่อชี้ไปยัง Cloud Storage Bucket ที่ต้องการใช้เป็น CDN.
  ```bash
  gcloud compute backend-buckets create thailandpenthouses-cms-bucket-backend --gcs-bucket-name=thailandpenthouses-cms-media --enable-cdn --project=sc-thailandpenthouses-uat
  ```

### 6.1.1. การให้สิทธิ์ CDN เข้าถึง Storage Bucket
- **ปัญหา:** Cloud CDN ไม่สามารถอ่านไฟล์จาก Cloud Storage Bucket เพื่อนำไป Cache ได้
- **สาเหตุ:** Bucket ไม่ได้ตั้งค่าเป็น Public Read ซึ่งจำเป็นสำหรับให้ CDN ดึงข้อมูลไปได้
- **วิธีแก้ปัญหา:** เพิ่ม Role `Storage Object Viewer` (`roles/storage.objectViewer`) ให้กับ `allUsers` ซึ่งจะทำให้ไฟล์ใน Bucket สามารถถูกอ่านได้โดยสาธารณะ (เหมาะสำหรับ CDN)
  ```bash
  gcloud storage buckets add-iam-policy-binding gs://thailandpenthouses-cms-media \
    --member="allUsers" \
    --role="roles/storage.objectViewer" \
    --project="sc-thailandpenthouses-uat"
  ```

### 6.2. ตั้งค่าการ Routing (URL Map)
- สร้าง URL Map และกำหนดกฎการ Routing ตาม Hostname เพื่อแยก traffic ระหว่าง Cloud Run (default) และ Cloud Storage (สำหรับ CDN).
  ```bash
  # 1. สร้าง URL Map ที่มี default service เป็น Cloud Run Backend
  gcloud compute url-maps create thailandpenthouses-cms-lb --default-service thailandpenthouses-cms-backend --project=sc-thailandpenthouses-uat

  # 2. สร้าง Path Matcher เพื่อ map path ทั้งหมด (/*) ไปยัง CDN Bucket
  gcloud compute url-maps add-path-matcher thailandpenthouses-cms-lb \
    --path-matcher-name=cdn-path-matcher \
    --default-service=thailandpenthouses-cms-bucket-backend \
    --path-rules=/* \
    --project=sc-thailandpenthouses-uat

  # 3. เพิ่ม Host Rule เพื่อให้ traffic ที่มายัง 'thailandpenthouses-cdn.digi-team.work' ใช้ Path Matcher ที่เพิ่งสร้าง
  gcloud compute url-maps add-host-rule thailandpenthouses-cms-lb \
    --hosts=thailandpenthouses-cdn.digi-team.work \
    --path-matcher-name=cdn-path-matcher \
    --project=sc-thailandpenthouses-uat
  ```

### 6.3. สร้าง SSL Certificate
- สร้าง Google-managed SSL certificate สำหรับโดเมนต่างๆ ที่ต้องการใช้กับ Load Balancer ผ่าน Google Cloud Console หรือใช้ `gcloud`.
  ```bash
  # ตัวอย่างการสร้าง Certificate (ต้องทำสำหรับแต่ละโดเมน)
  gcloud compute ssl-certificates create [CERTIFICATE_NAME] --domains=[DOMAIN_NAME] --global --project=sc-thailandpenthouses-uat
  ```

### 6.4. สร้าง Target HTTPS Proxy
- สร้าง Proxy เพื่อเชื่อม URL Map เข้ากับ SSL Certificates ทั้งหมดที่ต้องการใช้งาน
  ```bash
  gcloud compute target-https-proxies create thailandpenthouses-cms-lb-target-proxy \
    --url-map=thailandpenthouses-cms-lb \
    --ssl-certificates=[CERT_1],[CERT_2],[CERT_3],[CERT_4] \
    --global --project=sc-thailandpenthouses-uat
  ```

### 6.5. จอง IP Address และสร้าง Forwarding Rule
- **จอง Static IP:** เพื่อให้ Load Balancer มี IP Address แบบถาวร.
  ```bash
  gcloud compute addresses create thailandpenthouses-cms-ip --global --project=sc-thailandpenthouses-uat
  ```
- **สร้าง Forwarding Rule:** เชื่อมต่อ IP ที่จองไว้เข้ากับ Target Proxy เพื่อให้ Load Balancer ออนไลน์.
  ```bash
  gcloud compute forwarding-rules create thailandpenthouses-cms-lb-forwarding-rule --address=thailandpenthouses-cms-ip --target-https-proxy=thailandpenthouses-cms-lb-target-proxy --ports=443 --global --project=sc-thailandpenthouses-uat
  ```

### 6.6. ตั้งค่า DNS
- ขั้นตอนสุดท้ายคือการเข้าไปยังระบบ DNS ของ `digi-team.work` และสร้าง `A Record` สำหรับ `thailandpenthouses-cdn` ให้ชี้ไปยัง Static IP ที่ได้จองไว้ (`34.8.214.124`).

## 7. การตั้งค่า Autoscaling
- **วัตถุประสงค์:** กำหนดค่า Autoscaling ให้กับ Cloud Run Service เพื่อให้สามารถรองรับ traffic ที่เปลี่ยนแปลง และประหยัดค่าใช้จ่ายโดยการ scale down to zero.
- **เป้าหมาย:**
  - Minimum Instances: 0
  - Maximum Instances: 5
  - Scaling Metric: CPU Utilization
  - Target CPU: 60%

### 7.1. การตั้งค่าผ่าน Google Cloud Console
- **ปัญหา:** การใช้ `gcloud` ในการตั้งค่า CPU utilization (ด้วย flag `--cpu-utilization` หรือ `--autoscaling-cpu-utilization`) ไม่สำเร็จเนื่องจากเวอร์ชันของ `gcloud` ที่ติดตั้งไว้อาจไม่รองรับ
- **วิธีแก้ปัญหา:** ทำการตั้งค่าโดยตรงผ่านหน้า Google Cloud Console
  1. ไปที่ Cloud Run service `thailandpenthouses-poc` ในโปรเจกต์ `sc-thailandpenthouses-uat`.
  2. เลือกแท็บ "Revisions" และคลิก "Edit & Deploy New Revision".
  3. ในส่วน "Autoscaling", กำหนดค่า "Minimum number of instances" เป็น 0, "Maximum number of instances" เป็น 5.
  4. เลือก "CPU utilization" เป็น metric และตั้งค่า "Target" เป็น 60%.
  5. กด "Deploy".

### 7.2. การตรวจสอบการตั้งค่า
- หลังจากทำการ deploy, สามารถตรวจสอบ configuration ที่ใช้งานอยู่ด้วยคำสั่ง:
  ```bash
  gcloud run services describe thailandpenthouses-poc --region=asia-southeast1 --project=sc-thailandpenthouses-uat --format=yaml
  ```
- ผลลัพธ์ที่สำคัญในส่วน `spec.template.metadata.annotations` ควรมีลักษณะดังนี้:
  ```yaml
  spec:
    template:
      metadata:
        annotations:
          autoscaling.knative.dev/maxScale: '5'
          autoscaling.knative.dev/metric: cpu
          autoscaling.knative.dev/minScale: '0'
          autoscaling.knative.dev/target: '60'
  ```

## 8. การแก้ไขปัญหาและปรับปรุง UI

### 8.1. การแก้ไขปัญหาการเชื่อมต่อ Google Cloud Storage จาก Local
- **ปัญหา:** แอปพลิเคชันบน local ไม่สามารถทำงานได้เนื่องจากพยายามหาไฟล์ `service-account-key.json` หรือเกิดข้อผิดพลาด `SigningError: Cannot sign data without 'client_email'`
- **สาเหตุ:**
    1. โค้ดมีการ hardcode ให้มองหา key file ใน local environment
    2. การสร้าง Signed URL **จำเป็นต้องใช้ credential** ในการเซ็นคำร้องขอเสมอ ถึงแม้ bucket จะเป็น public ก็ตาม
- **วิธีแก้ปัญหา:**
    1. **สำหรับแสดงผล (Read):** เปลี่ยนจากการใช้ Signed URL เป็นการใช้ Public URL ของ GCS โดยตรง (`https://storage.googleapis.com/[BUCKET_NAME]/[FILE_NAME]`) เนื่องจาก bucket ของเราเป็น public อยู่แล้ว วิธีนี้ทำให้ไม่ต้องใช้ credential ในการอ่าน
    2. **สำหรับการอัปโหลด (Write):** คงโค้ดการสร้าง Signed URL ไว้ ซึ่งจะทำงานได้อัตโนมัติบน Cloud Run (ที่ใช้ Service Account ของตัวเอง) และสำหรับการทดสอบบน local จะต้องให้สิทธิ์ผ่าน `gcloud auth application-default login` (ซึ่งผู้ใช้ปัจจุบันไม่มีสิทธิ์ทำได้) จึงตัดสินใจทดสอบการอัปโหลดบน Cloud Run โดยตรง

### 8.2. การปรับปรุง UI หน้า Media Gallery (`/media`)
- **วัตถุประสงค์:** ปรับปรุงหน้าแสดงรายการไฟล์ให้สวยงามและใช้งานง่ายขึ้น
- **การเปลี่ยนแปลง:**
    - ปรับ Layout ของรูปภาพให้แสดงผลสูงสุด **6 รูปต่อแถว** บนหน้าจอขนาดใหญ่ และปรับลดลงตามขนาดหน้าจอ (Responsive Grid)
    - เพิ่ม UI แบบ Card ให้กับรูปภาพแต่ละใบ โดยมีกรอบและเงาเล็กน้อย
    - เพิ่มการแสดง **ขนาดไฟล์ (File Size)** ใต้ชื่อไฟล์ พร้อมแปลงหน่วยให้อ่านง่าย (KB, MB)
    - ปรับปรุง Contrast ของข้อความชื่อไฟล์และขนาดไฟล์ให้อ่านได้ชัดเจนยิ่งขึ้น

## 9. การตั้งค่า Cloud Armor Security Policy
- **วัตถุประสงค์:** เพื่อป้องกัน Web Application จากการโจมตีทั่วไป เช่น SQL Injection และ Cross-Site Scripting (XSS) โดยการนำ Security Policy ไปใช้กับ Backend Service ของ Load Balancer

### 9.1. การให้สิทธิ์จัดการ Security Policy
- **ปัญหา:** บัญชีที่ใช้ `gcloud` ไม่มีสิทธิ์ในการสร้างหรือแก้ไข Security Policies (`compute.securityPolicies.create` permission denied)
- **วิธีแก้ปัญหา:** ใน Google Cloud Console, ไปที่หน้า IAM และเพิ่ม Role `Compute Security Admin` (`roles/compute.securityAdmin`) ให้กับบัญชีผู้ใช้ที่ต้องการ

### 9.2. สร้าง Security Policy
- สร้าง Policy หลักสำหรับเก็บกฎ (rules) ต่างๆ
  ```bash
  gcloud compute security-policies create thailandpenthouses-cms-policy \
    --description "Main security policy for thailandpenthouses cms" \
    --project "sc-thailandpenthouses-uat"
  ```
  - **หมายเหตุ:** Policy ที่สร้างใหม่จะมี default rule (priority: 2147483647, action: allow) มาให้อัตโนมัติ

### 9.3. นำ Policy ไปใช้กับ Backend Service
- นำ Security Policy ที่สร้างขึ้นไปผูกกับ Backend Service ของ Cloud Run เพื่อเริ่มการป้องกัน
  ```bash
  gcloud compute backend-services update thailandpenthouses-poc-backend \
    --security-policy=thailandpenthouses-cms-policy \
    --global \
    --project="sc-thailandpenthouses-uat"
  ```

### 9.4. เพิ่ม Pre-configured WAF Rules (เวอร์ชัน v3.3)
- เพิ่มกฎ WAF (Web Application Firewall) ที่ Google เตรียมไว้ให้ เพื่อป้องกันการโจมตีที่พบบ่อย โดยเลือกใช้ Ruleset เวอร์ชัน `v3.3` ซึ่งมีความยืดหยุ่นในการปรับระดับความไว (Sensitivity Level) เพื่อลด False Positives
- **ตั้งค่า Sensitivity Level เริ่มต้นที่ `1` (เข้มงวดน้อยที่สุด) เพื่อป้องกันการบล็อก traffic ปกติ**
- เอกสารอ้างอิง: [Cloud Armor WAF rules tuning](https://cloud.google.com/armor/docs/waf-rules-tuning)

- **อัปเดตกฎป้องกัน SQL Injection (Priority 1000):**
  ```bash
  gcloud compute security-policies rules update 1000 \
    --security-policy=thailandpenthouses-cms-policy \
    --expression="evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})" \
    --action=deny-403 \
    --description="Prevent SQL injection attacks (v3.3, sensitivity 1)" \
    --project="sc-thailandpenthouses-uat"
  ```
- **อัปเดตกฎป้องกัน Cross-Site Scripting (XSS) (Priority 1001):**
  ```bash
  gcloud compute security-policies rules update 1001 \
    --security-policy=thailandpenthouses-cms-policy \
    --expression="evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 1})" \
    --action=deny-403 \
    --description="Prevent Cross-site scripting attacks (v3.3, sensitivity 1)" \
    --project="sc-thailandpenthouses-uat"
  ```

### 9.5. เปิดใช้งาน Logging สำหรับ Security Policy
- เพื่อให้สามารถตรวจสอบได้ว่า traffic ใดถูก block หรือ allow โดย Cloud Armor เราต้องเปิดใช้งาน logging ที่ระดับของ Backend Service
  ```bash
  gcloud compute backend-services update thailandpenthouses-poc-backend \
    --enable-logging \
    --logging-sample-rate=1 \
    --global \
    --project="sc-thailandpenthouses-uat"
  ```
- **การตรวจสอบ Log:**
  1. ไปที่ **Cloud Logging > Logs Explorer**
  2. ใช้ Query Filter:
     ```
     resource.type="http_load_balancer"
     resource.labels.backend_service_name="thailandpenthouses-poc-backend"
     ```
  3. ตรวจสอบรายละเอียดใน `jsonPayload.enforcedSecurityPolicy` เพื่อดูผลการทำงานของ Cloud Armor

### 9.6. การจัดการ False Positives (การปรับจูน WAF Rules)
- **ปัญหา:** WAF rule ยังคงบล็อก traffic ปกติ (เช่น request `favicon.ico`) แม้จะตั้งค่า Sensitivity Level ต่ำสุดแล้ว
- **แนวทางการแก้ไข:**
  1.  **เพิ่ม Sensitivity Level:** หากต้องการความปลอดภัยที่สูงขึ้น สามารถทดลองปรับค่า `sensitivity` ในคำสั่ง `update` ด้านบนเป็น `2`, `3`, หรือ `4` ตามลำดับ แต่ต้องยอมรับความเสี่ยงที่จะเกิด False Positives มากขึ้น
  2.  **ปิดใช้งานกฎย่อย (Sub-rule):** หากพบว่ามีกฎย่อยตัวใดตัวหนึ่งสร้างปัญหาโดยเฉพาะ (ตรวจสอบจาก `preconfiguredExprIds` ใน log) เราสามารถปิดใช้งานเฉพาะกฎย่อยนั้นได้โดยใช้พารามิเตอร์ `opt_out_rule_ids`
      ```bash
      # ตัวอย่าง: ปรับจูนกฎ SQLi โดยยังใช้ sensitivity 1 แต่ปิดกฎย่อย 'id942260' เพิ่มเติม
      gcloud compute security-policies rules update 1000 \
          --security-policy=thailandpenthouses-cms-policy \
          --expression="evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1, 'opt_out_rule_ids': ['owasp-crs-v030001-id942260-sqli']})" \
          --action=deny-403 \
          --description="Prevent SQL injection attacks (v3.3, sensitivity 1, exclude id942260)" \
          --project="sc-thailandpenthouses-uat"
      ```

## 10. การตั้งค่า Custom Service Account
- **วัตถุประสงค์:** เพื่อสร้าง Service Account ที่มีสิทธิ์เฉพาะที่จำเป็นสำหรับการทำงานของระบบ โดยไม่ให้สิทธิ์เกินความจำเป็น (Principle of Least Privilege)

### 10.1. สร้าง Custom Service Account
- สร้าง Service Account ใหม่สำหรับใช้งานเฉพาะ
  ```bash
  gcloud iam service-accounts create thailandpenthouses-cms-sa \
    --display-name="Thailand Penthouses CMS Service Account" \
    --description="Custom service account for Thailand Penthouses CMS application" \
    --project="sc-thailandpenthouses-uat"
  ```

### 10.2. การให้สิทธิ์ Secret Manager Access
- ให้สิทธิ์อ่าน Secret สำหรับการเชื่อมต่อฐานข้อมูล
  ```bash
  gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project="sc-thailandpenthouses-uat"
  ```

### 10.3. การให้สิทธิ์ Cloud Storage Access
- ให้สิทธิ์เขียนไฟล์ลง Cloud Storage
  ```bash
  gcloud storage buckets add-iam-policy-binding gs://thailandpenthouses-cms-media \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin" \
    --project="sc-thailandpenthouses-uat"
  ```
- ให้สิทธิ์อ่านไฟล์จาก Cloud Storage (สำหรับ CDN)
  ```bash
  gcloud storage buckets add-iam-policy-binding gs://thailandpenthouses-cms-media \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer" \
    --project="sc-thailandpenthouses-uat"
  ```

### 10.4. การให้สิทธิ์ Service Account Token Creator
- ให้สิทธิ์สร้าง Signed URL สำหรับ Cloud Storage
  ```bash
  gcloud iam service-accounts add-iam-policy-binding thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project="sc-thailandpenthouses-uat"
  ```

### 10.5. การให้สิทธิ์ Cloud SQL Access (ถ้าจำเป็น)
- ให้สิทธิ์เชื่อมต่อ Cloud SQL
  ```bash
  gcloud projects add-iam-policy-binding sc-thailandpenthouses-uat \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
  ```

### 10.6. การให้สิทธิ์ Cloud Run Access (ถ้าจำเป็น)
- ให้สิทธิ์ deploy ไปยัง Cloud Run
  ```bash
  gcloud projects add-iam-policy-binding sc-thailandpenthouses-uat \
    --member="serviceAccount:thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com" \
    --role="roles/run.admin"
  ```

### 10.7. สรุป IAM Roles ที่จำเป็น
| Role | วัตถุประสงค์ | คำสั่ง |
|------|-------------|--------|
| `roles/secretmanager.secretAccessor` | อ่าน Secret สำหรับการเชื่อมต่อฐานข้อมูล | 10.2 |
| `roles/storage.objectAdmin` | เขียนไฟล์ลง Cloud Storage | 10.3 |
| `roles/storage.objectViewer` | อ่านไฟล์จาก Cloud Storage | 10.3 |
| `roles/iam.serviceAccountTokenCreator` | สร้าง Signed URL สำหรับ Cloud Storage | 10.4 |
| `roles/cloudsql.client` | เชื่อมต่อ Cloud SQL (ถ้าจำเป็น) | 10.5 |
| `roles/run.admin` | Deploy ไปยัง Cloud Run (ถ้าจำเป็น) | 10.6 |

### 10.8. การใช้งาน Custom Service Account
- **สำหรับ Cloud Run:** กำหนด Service Account ในการ deploy
  ```bash
  gcloud run deploy thailandpenthouses-poc \
    --image=gcr.io/sc-thailandpenthouses-uat/thailandpenthouses-cms \
    --service-account=thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com \
    --region=asia-southeast1 \
    --project="sc-thailandpenthouses-uat"
  ```
- **สำหรับ Local Development:** ดาวน์โหลด key file และตั้งค่า environment variable
  ```bash
  gcloud iam service-accounts keys create ~/thailandpenthouses-cms-sa-key.json \
    --iam-account=thailandpenthouses-cms-sa@sc-thailandpenthouses-uat.iam.gserviceaccount.com \
    --project="sc-thailandpenthouses-uat"
  ```
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS=~/thailandpenthouses-cms-sa-key.json
  ```

## 11. การจัดการ Application Default Credentials และสิทธิ์ serviceusage.services.use

### 11.1. ปัญหาที่เกิดขึ้น
- **ปัญหา:** เกิดข้อผิดพลาด `Cannot sign data without 'client_email'` เมื่ออัปโหลดไฟล์บน local
- **ปัญหาเพิ่มเติม:** เกิดข้อผิดพลาด `Permission 'serviceusage.services.use' denied` เมื่อใช้ Application Default Credentials
- **สาเหตุ:** บัญชีผู้ใช้ไม่มีสิทธิ์ `serviceusage.services.use` ในโปรเจกต์

### 11.2. การตั้งค่า Application Default Credentials (ADC)
- **วัตถุประสงค์:** เพื่อให้แอปพลิเคชันบน local สามารถเข้าถึง Google Cloud APIs ได้
- **ขั้นตอนการตั้งค่า:**
  ```bash
  # 1. ล็อคอินด้วย gcloud
  gcloud auth login kergrit@gmail.com
  
  # 2. ตั้งค่า Application Default Credentials
  gcloud auth application-default login
  
  # 3. ตั้งค่า project
  gcloud config set project sc-thailandpenthouses-uat
  ```
- **ตำแหน่งไฟล์ credentials:** `~/.config/gcloud/application_default_credentials.json`

### 11.3. การจัดการสิทธิ์ serviceusage.services.use
- **ปัญหา:** บัญชีผู้ใช้ไม่มีสิทธิ์ `serviceusage.services.use` ในโปรเจกต์
- **วิธีแก้ไข:** เพิ่มสิทธิ์ Service Usage Consumer ให้กับบัญชีผู้ใช้
  ```bash
  # ตรวจสอบสิทธิ์ปัจจุบัน
  gcloud projects get-iam-policy sc-thailandpenthouses-uat \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:kergrit@gmail.com"
  
  # เพิ่มสิทธิ์ Service Usage Consumer (ต้องมีสิทธิ์ IAM Admin)
  gcloud projects add-iam-policy-binding sc-thailandpenthouses-uat \
    --member="user:kergrit@gmail.com" \
    --role="roles/serviceusage.serviceUsageConsumer"
  ```

### 11.4. การตั้งค่า Quota Project
- **ปัญหา:** เกิด warning เรื่อง quota project
- **วิธีแก้ไข:** ตั้งค่า quota project สำหรับ ADC
  ```bash
  gcloud auth application-default set-quota-project sc-thailandpenthouses-uat
  ```

### 11.5. การลบ Application Default Credentials
- **เมื่อต้องการย้อนกลับ:** ลบไฟล์ credentials
  ```bash
  rm -f ~/.config/gcloud/application_default_credentials.json
  ```

### 11.6. การแก้ไขโค้ดสำหรับ Local Development
- **ปรับปรุงไฟล์ `src/app/api/upload/route.ts`:**
  ```typescript
  // Initialize storage client with proper credentials handling
  let storage: Storage;

  if (process.env.NODE_ENV === 'production') {
    // Production: Use default credentials (service account attached to Cloud Run)
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
    });
  } else {
    // Development: Try to use Application Default Credentials (ADC)
    try {
      storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
      });
    } catch (error) {
      console.warn('Failed to initialize Storage with ADC, using fallback');
      // Fallback: Use public bucket access for development
      storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
      });
    }
  }
  ```

### 11.7. การจัดการ Error Handling
- **เพิ่ม error handling สำหรับ signed URL:**
  ```typescript
  try {
    const [url] = await file.getSignedUrl(options);
    return NextResponse.json({ url }, { status: 200 });
  } catch (signError) {
    console.error('Error creating signed URL:', signError);
    
    // For local development, if signed URL fails, try direct upload
    if (process.env.NODE_ENV !== 'production') {
      console.log('Falling back to direct upload for local development');
      const uploadUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
      return NextResponse.json({ 
        url: uploadUrl, 
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'x-goog-meta-uploaded-by': 'local-development'
        }
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
  ```

### 11.8. สรุป IAM Roles ที่จำเป็นสำหรับ Local Development
| Role | วัตถุประสงค์ | คำสั่ง |
|------|-------------|--------|
| `roles/serviceusage.serviceUsageConsumer` | ใช้ Google Cloud APIs | 11.3 |
| `roles/storage.objectAdmin` | เขียนไฟล์ลง Cloud Storage | 10.3 |
| `roles/iam.serviceAccountTokenCreator` | สร้าง Signed URL | 10.4 |

### 11.9. ข้อควรระวัง
- **ไม่ควรใช้ ADC ใน production:** ใช้ Service Account ที่แนบกับ Cloud Run แทน
- **ลบ credentials เมื่อไม่ใช้:** เพื่อความปลอดภัย
- **ตรวจสอบสิทธิ์ก่อนใช้:** ใช้คำสั่ง `gcloud auth list` และ `gcloud projects get-iam-policy`
- **ใช้ fallback mode:** เมื่อไม่มีสิทธิ์เต็มในโปรเจกต์
