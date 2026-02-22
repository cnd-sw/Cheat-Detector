Here's a comprehensive breakdown of anti-cheating features you can build into your SaaS test platform:

---

##  Screen & Display Detection
- **Dual/multiple monitor detection** – detect if additional screens are connected via browser APIs
- **Screen sharing detection** – detect if the user is broadcasting their screen (e.g., via Zoom, Teams, OBS)
- **Window focus loss tracking** – flag every time the student switches away from the test tab
- **Tab switching detection** – using `visibilitychange` and `blur/focus` events
- **Fullscreen enforcement** – force fullscreen mode and flag/pause the exam if they exit it

---

##  Copy/Paste & Keyboard Controls
- **Disable right-click** context menu
- **Block copy/paste shortcuts** (Ctrl+C, Ctrl+V, Ctrl+X)
- **Disable text selection** on question content
- **Keystroke logging** – detect unusual keyboard activity or shortcuts like Ctrl+A, PrtSc
- **Dev Tools detection** – detect if browser developer tools are opened (window size tricks, `debugger` detection)

---

##  Webcam & Biometric Proctoring
- **Live webcam feed** – continuous recording or snapshots during the exam
- **Face detection** – detect if no face is visible, multiple faces appear, or the student looks away frequently
- **Identity verification** – photo ID check before the exam starts, matched against webcam
- **Gaze tracking** – eye-tracking via webcam to detect if the student is looking off-screen
- **Lip movement detection** – flag if the student appears to be reading answers to someone

---

##  Network & Environment
- **IP address logging** – flag if the IP changes mid-exam (VPN switching)
- **Multiple session detection** – prevent the same account from logging in from two devices simultaneously
- **VPN/Proxy detection** – flag known VPN IP ranges
- **Browser fingerprinting** – ensure the same device is used throughout

---

##  AI & Behavioral Analysis
- **Time-per-question analysis** – abnormally fast answers can indicate pre-known answers or copy-paste from external tools
- **Answer pattern analysis** – detect statistically improbable similarity between students (collusion detection)
- **Paste detection** – detect if large amounts of text were pasted into open-ended answers
- **Typing behavior biometrics** – analyze typing rhythm/speed as a behavioral fingerprint
- **Idle time detection** – flag long pauses that could indicate the student stepped away

---

##  System-Level Lockdown (with a desktop app)
- **Browser lockdown app** – like a custom Electron app that locks the OS to only the test (similar to Respondus LockDown Browser)
- **Block application switching** – prevent Alt+Tab or Cmd+Tab
- **Disable screenshot tools** – block known screenshot utilities
- **USB device monitoring** – flag if external drives are connected
- **Clipboard monitoring** – clear clipboard on exam start and monitor changes

---

##  Question Integrity
- **Question randomization** – shuffle question order per student to prevent sharing answers
- **Answer choice shuffling** – randomize the order of MCQ options
- **Question bank pooling** – serve different questions from a large pool per student
- **Time limits per question** – prevent students from going back and looking things up
- **Watermarking** – embed invisible student ID into question pages to trace leaks

---

##  Reporting & Audit
- **Suspicion score dashboard** – aggregate all flags into a risk score per student
- **Event timeline replay** – let proctors review a timestamped log of all flagged events
- **Video recording review** – flag specific timestamps in webcam recordings for review
- **Automated alerts** – notify proctors in real time when a high-risk event occurs

---

##  Integration Ideas
- **LMS integration** (Canvas, Moodle, Google Classroom) for seamless deployment
- **Slack/email alerts** for proctors
- **GDPR/FERPA compliance** tools for handling student data legally

---

The most impactful combination for a web-based platform (no desktop app) is: **fullscreen enforcement + tab/focus tracking + webcam face detection + question randomization + copy-paste blocking + multi-session detection**. That covers the vast majority of cheating attempts without requiring students to install anything.



Here's a comprehensive tech stack and architecture for your anti-cheating test platform.

---

##  Recommended Tech Stack

### Frontend
- **Next.js 14** (React) – exam UI, SSR for security, app router
- **TypeScript** – type safety across the board
- **Tailwind CSS** – UI styling
- **face-api.js** – in-browser face detection via webcam (runs on client, no server needed)
- **Zustand** – lightweight state management for exam session state

### Backend
- **Node.js + Express** or **NestJS** (recommended for large SaaS – modular, scalable)
- **WebSockets (Socket.io)** – real-time proctoring events pushed to dashboard
- **Bull + Redis** – job queues for processing video snapshots, AI analysis, reports
- **JWT + refresh tokens** – secure session auth

### Database
- **PostgreSQL** (via Prisma ORM) – users, exams, questions, results, organizations
- **Redis** – session caching, rate limiting, real-time event buffering
- **S3-compatible storage** (AWS S3 or Cloudflare R2) – webcam snapshots, video recordings

### AI / ML
- **face-api.js** (client-side) – face presence, multiple face detection, gaze estimation
- **AWS Rekognition** or **Google Vision API** – server-side identity verification (ID matching)
- **OpenAI API** – analyze open-ended answers for paste patterns, AI-generated content detection

### Infrastructure
- **Docker + Docker Compose** – containerized services
- **AWS ECS / Railway / Render** – container hosting
- **Cloudflare** – DDoS protection, IP/VPN detection, CDN
- **GitHub Actions** – CI/CD pipeline

---

##  System Architecture

```

                        CLIENT LAYER                         
                                                             
     
                Next.js Exam Interface                     
                                                           
             
      Exam Engine     Proctoring      Auth         
      (Questions)     Module          Module       
             
                                                          
                               
                   Client-Side Guards                   
                  • Tab/focus tracking                  
                  • Copy/paste blocking                 
                  • Fullscreen enforce                  
                  • DevTools detection                  
                  • face-api.js                         
                  • Dual screen detect                  
                               
     

                            HTTPS + WSS

                        API GATEWAY                          
              (Nginx / Cloudflare reverse proxy)             
         Rate limiting  VPN detection  IP logging          

                                              
                  
   REST API                           WebSocket Server   
   (NestJS)                           (Socket.io)        
                                                         
  • Auth                             • Live proctoring   
  • Exam CRUD                          events stream     
  • Results                          • Proctor alerts    
  • Reports                          • Session heartbeat 
                  
                                              

                     SERVICE LAYER                          
                                                            
       
     Exam          Proctoring       AI Analysis     
     Service       Service          Service         
                                                    
   • Q bank       • Flag mgmt     • Face verify     
   • Randomize    • Score risk    • AI text detect  
   • Timer        • Snapshots     • Collusion check 
   • Scoring      • Event log     • Paste detect    
       
                                                            
       
     Auth          Notif.          Report           
     Service       Service         Service          
                                                    
   • JWT          • Email         • PDF export      
   • Sessions     • Slack         • Audit trail     
   • Multi-dev    • Webhooks      • Analytics       
     blocking                                       
       

                           

                      DATA LAYER                             
                                                             
        
    PostgreSQL         Redis          S3 / R2        
                                                     
    • Users          • Sessions      • Webcam        
    • Orgs           • Event buf       snapshots     
    • Exams          • Rate limit    • Video clips   
    • Questions      • Job queue     • ID photos     
    • Results          (Bull)        • Reports       
    • Flags                                          
        

                           

                   EXTERNAL SERVICES                         
                                                             
   AWS Rekognition       OpenAI API      Cloudflare       
   (ID verification)     (AI detect)     (VPN/IP check)   

```

---

##  Core Database Schema (PostgreSQL)

```sql
-- Multi-tenancy
Organizations (id, name, plan, settings)
Users (id, org_id, role, email, face_photo_url)

-- Exam structure
Exams (id, org_id, title, settings_json, time_limit, randomize)
QuestionBank (id, exam_id, type, content, options, answer)

-- Session tracking
ExamSessions (
  id, user_id, exam_id, 
  start_time, end_time, status,
  ip_address, device_fingerprint,
  suspicion_score
)

-- Event logging (append-only)
ProctorEvents (
  id, session_id, event_type,
  timestamp, severity, metadata_json
)
-- event_type: tab_switch, face_missing, multiple_faces,
--             fullscreen_exit, copy_attempt, devtools_open...

-- Results
Answers (id, session_id, question_id, response, time_taken_ms)
ExamResults (id, session_id, score, flags_count, report_url)
```

---

##  Exam Session Flow

```
1. Student logs in → JWT issued
        ↓
2. Identity check → webcam photo vs stored ID (Rekognition)
        ↓
3. System check → screen count, browser compat, camera/mic access
        ↓
4. Exam starts → fullscreen enforced, session created in DB
        ↓
5. During exam (continuous):
    Every 500ms  → face detection check (client-side)
    Every 30s    → webcam snapshot → S3 (async via Bull queue)
    On event     → flag emitted via WebSocket to proctor dashboard
    Heartbeat    → session alive check (detect multi-device)
        ↓
6. Exam ends → answers submitted, suspicion score calculated
        ↓
7. Report generated → PDF with event timeline, snapshots, score
```

---

##  Suspicion Scoring Logic

Each event carries a weight that adds to the student's suspicion score:

| Event | Weight |
|---|---|
| Tab switch | +10 |
| Fullscreen exit | +15 |
| Face missing (>5s) | +20 |
| Multiple faces detected | +30 |
| Copy/paste attempt | +15 |
| DevTools opened | +25 |
| Screen share detected | +35 |
| IP change mid-exam | +40 |
| Abnormally fast answers | +10 |

Thresholds: **0-30** = Clean, **31-70** = Review, **71+** = High Risk (auto-flag for proctor)

---

##  Folder Structure (NestJS Backend)

```
src/
 auth/
 exams/
 questions/
 sessions/
 proctoring/
    events/
    snapshots/
    scoring/
    websocket.gateway.ts
 ai/
    face-verify/
    content-analysis/
 reports/
 notifications/
 common/
     guards/
     interceptors/
     pipes/
```

---

##  Key Security Considerations

- All exam content served **encrypted**, never exposed in source
- Questions fetched **one at a time** (no bulk fetch = no scraping)
- WebSocket connections verified with JWT on handshake
- Webcam snapshots stored with **student ID watermark** embedded
- All proctor events are **append-only** (immutable audit trail)
- GDPR compliance: data retention policies, consent on exam start

---

Want me to start scaffolding the actual code for any specific module — like the proctoring WebSocket gateway, the face detection frontend module, or the NestJS exam session service?