// File: src/lib/seedData.ts
import { db } from "@/db";
import { appSettings, users, auditChecklists, weeklyReports, auditReports } from "@/db/schema";
import { hashPassword, getRequiredEnv } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function ensureInitialData() {
  try {
    // 1. Always ensure the single user account exists if the users table is empty.
    // This is a single-user app — no multi-account / role system needed.
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      // No hardcoded default: the account password must be set explicitly via
      // APP_PASSWORD so it can never silently match a publicly known value
      // from source control or documentation.
      const defaultPassword = getRequiredEnv("APP_PASSWORD");
      const passwordHash = await hashPassword(defaultPassword);

      await db.insert(users).values([
        {
          name: "Auditor Gandul",
          email: "admin@factory.com",
          password: passwordHash,
        },
      ]);
      console.log("Seeded default user account.");
    }

    // 2. Check if initial checklist seeding flag is already present
    const seededFlag = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "checklists_seeded"));

    if (seededFlag.length > 0 && seededFlag[0].value === "true") {
      return;
    }

    console.log("Seeding initial checklist, cadence, and report records...");

    // Seed Checklists
    await db.insert(auditChecklists).values([
      // Agustus
      {
        month: "Agustus",
        domain: "MQAA",
        title: "Audit Kualitas Material Cutting & Stamping Sole",
        description: "Inspeksi toleransi dimensi potong komponen upper & sole, kelayakan pusingan die, serta bebas cacat tekstur kulit/sintetis.",
        area: "Cutting",
        auditDate: "2026-08-05",
        completed: true,
        orderIndex: 1,
        isCustom: false,
      },
      {
        month: "Agustus",
        domain: "6S",
        title: "Implementasi 6S Area Cutting & Prep Line",
        description: "Verifikasi pemilahan tool clicker, kerapihan rak material sintetis, kebersihan lantai kerja, serta penetapan standar tempat sampah.",
        area: "Prep",
        auditDate: "2026-08-10",
        completed: true,
        orderIndex: 2,
        isCustom: false,
      },
      {
        month: "Agustus",
        domain: "Visual Management",
        title: "Standardisasi Papan Visual & Kanban Output Harian",
        description: "Pemasangan papan status produksi jam-jaman (Hourly Tracking Board) dan penanda visual reject rate di line Prep/Cutting.",
        area: "Cutting",
        auditDate: "2026-08-15",
        completed: false,
        orderIndex: 3,
        isCustom: false,
      },

      // September
      {
        month: "September",
        domain: "MQAA",
        title: "Audit Konsistensi Aplikasi Lem Cementing & Primer (CSC)",
        description: "Verifikasi suhu oven aktivasi lem (65-75°C), ketebalan olesan primer pada sole outsole TPU/Phylon, dan tack-free time.",
        area: "CSC",
        auditDate: "2026-09-02",
        completed: false,
        orderIndex: 1,
        isCustom: false,
      },
      {
        month: "September",
        domain: "6S",
        title: "Penataan Zonasasi & Housekeeping Line Prep Skiving",
        description: "Pengaturan kode warna lantai untuk jalur trolley material, area penumpukan box upper, dan kebersihan serbuk mesin skiving.",
        area: "Prep",
        auditDate: "2026-09-12",
        completed: false,
        orderIndex: 2,
        isCustom: false,
      },
      {
        month: "September",
        domain: "Visual Management",
        title: "Papan Indikator Defect & Matrix Skill Operator",
        description: "Pembaruan matrix kompetensi operator stitching/skiving serta grafik pareto cacat jahitan mingguan di papan area Prep.",
        area: "Prep",
        auditDate: "2026-09-20",
        completed: false,
        orderIndex: 3,
        isCustom: false,
      },

      // Oktober
      {
        month: "Oktober",
        domain: "MQAA",
        title: "MQAA Full Scope Audit - Bonding Strength & Lasting Quality",
        description: "Uji tarik bonding strength sole (minimal 3.5 kg/cm), kelurusan seam upper, ketepatan toe margin, dan kerapihan finishing.",
        area: "CSC",
        auditDate: "2026-10-05",
        completed: false,
        orderIndex: 1,
        isCustom: false,
      },
      {
        month: "Oktober",
        domain: "6S",
        title: "Audit Sertifikasi 6S Mandiri All Audit Areas",
        description: "Evaluasi menyeluruh 6 kriteria (Sort, Set, Shine, Standardize, Sustain, Safety) di seluruh sektor Cutting, Prep, dan CSC.",
        area: "All",
        auditDate: "2026-10-12",
        completed: false,
        orderIndex: 2,
        isCustom: false,
      },
      {
        month: "Oktober",
        domain: "Visual Management",
        title: "Audit Papan Eskalasi Problem & Live Metrics Display",
        description: "Evaluasi respon manajemen terhadap red-flag pada papan andon dan kelengkapan visual instruksi kerja (WI) di tiap workstation.",
        area: "CSC",
        auditDate: "2026-10-18",
        completed: false,
        orderIndex: 3,
        isCustom: false,
      },
      {
        month: "Oktober",
        domain: "HSE",
        title: "Audit HSE - Safety Guarding, Exhauster Vent & APD Kimia",
        description: "Pemeriksaan fungsi sensor keselamatan mesin press sole, ketersediaan exhauster di meja lem, dan kedisiplinan respirator operator.",
        area: "CSC",
        auditDate: "2026-10-22",
        completed: false,
        orderIndex: 4,
        isCustom: false,
      },
      {
        month: "Oktober",
        domain: "PS",
        title: "Process Standardization Audit - Cycle Time & Work Instructions",
        description: "Auditing Kepatuhan Operator terhadap Standard Operation Sheet (SOS), takt time line assembly, dan metode balancing jalur.",
        area: "Prep",
        auditDate: "2026-10-28",
        completed: false,
        orderIndex: 5,
        isCustom: false,
      },
    ]);

    // Seed Weekly Cadence / Reports
    await db.insert(weeklyReports).values([
      {
        weekNumber: 1,
        title: "Minggu 1: Focus Area Cutting & Prep (MQAA, 6S, VM)",
        area: "Cutting",
        mondayTasks: "MQAA: Audit Presisi Die Cutting & Ketebalan Leather",
        tuesdayTasks: "Review Hasil Audit Cutting & Briefing Supervisor",
        wednesdayTasks: "6S & VM: Penataan Rak Material & Labeling Box Upper",
        thursdayTasks: "Review Kepatuhan 6S & Kalibrasi Timbangan",
        fridayTasks: "Audit Evaluasi Gabungan MQAA, 6S & VM Area Cutting",
        mondayStatus: "completed",
        tuesdayStatus: "completed",
        wednesdayStatus: "completed",
        thursdayStatus: "completed",
        fridayStatus: "completed",
        notes: "Audit minggu pertama berjalan lancar, minor finding pada pemilahan limbah pemotongan.",
      },
      {
        weekNumber: 2,
        title: "Minggu 2: Focus Area CSC & Full Scope Domain Integration",
        area: "CSC",
        mondayTasks: "MQAA, 6S, VM: Pengecekan Suhu Oven & Viskositas Lem Sole",
        tuesdayTasks: "HSE & PS: Verifikasi Sensor Mesin Press & Exhaust Fan Soling",
        wednesdayTasks: "MQAA, 6S, VM: Re-check Bonding Strength Sample Sole",
        thursdayTasks: "HSE & PS: Evaluasi APD Respirator & Standard Work Sheet",
        fridayTasks: "Audit Report Preparation & Feedback Session bersama Expert Auditor",
        mondayStatus: "in_progress",
        tuesdayStatus: "pending",
        wednesdayStatus: "pending",
        thursdayStatus: "pending",
        fridayStatus: "pending",
        notes: "Fokus minggu kedua pada konsistensi suhu oven aktivasi lem dan kelengkapan APD.",
      },
    ]);

    // Seed Audit Reports
    await db.insert(auditReports).values([
      {
        title: "Fluktuasi Suhu Oven Aktivasi Lem pada Line CSC #2",
        area: "CSC",
        domain: "MQAA",
        findingDescription: "Ditemukan perbedaan suhu sebesar 12°C antara thermometer internal oven dengan pengukur digital external saat proses bonding sole rubber-phylon.",
        rootCause: "Elemen pemanas (heating element) bagian tengah kotor terlapisi residu uap lem dan thermo-sensor belum dikalibrasi selama 4 bulan.",
        actionPlan: "1. Lakukan pembersihan menyeluruh elemen pemanas oven.\n2. Kalibrasi ulang thermo-sensor dengan standar sertifikasi instrumen.\n3. Tambahkan checklist pembersihan mingguan dalam jadwal preventive maintenance.",
        lessonLearned: "Akurasi instrumen thermal sangat kritis dalam proses perekat sole sepatu; penyimpangan suhu kecil berdampak langsung pada kegagalan bonding strength jangka panjang.",
        auditorName: "Budi Santoso (Expert Auditor CEM)",
        severity: "High",
        status: "In Progress",
        auditDate: "2026-08-12",
      },
      {
        title: "Penumpukan Material Sisa Cutting Tanpa Label Kategori Limbah",
        area: "Cutting",
        domain: "6S",
        findingDescription: "Terdapat 3 kontainer potongan sisa bahan sintetis yang menumpuk di dekat mesin clicker tanpa penandaan status recycle / scrap.",
        rootCause: "Operator clicker tidak memiliki tempat penampungan terpisah untuk sisa potongan dan tidak ada jadwal pengosongan ruang kerja dari tim logistics.",
        actionPlan: "1. Sediakan 2 bin khusus berlabel 'Recyclable' dan 'Scrap Waste'.\n2. Tetapkan SOP pengosongan bin setiap pergantian shift jam 14:00 dan 22:00.",
        lessonLearned: "Implementasi 6S yang efektif membutuhkan infrastruktur pendukung yang memadai (bin berlabel jelas) serta komitmen alur kerja inter-departemen.",
        auditorName: "Siti Rahmawati (Auditor Utama)",
        severity: "Medium",
        status: "Resolved",
        auditDate: "2026-08-05",
      },
      {
        title: "Saluran Exhaust Lem Cementing Tersumbat Debu & Residu",
        area: "Prep",
        domain: "HSE",
        findingDescription: "Daya hisap exhaust hood di station pencelupan primer Prep Line mengalami penurunan flow rate hingga 40%.",
        rootCause: "Filter exhaust tidak diganti sesuai jadwal bulanan (terlambat 2 minggu) akibat keterlambatan persediaan sparepart filter di gudang.",
        actionPlan: "1. Ganti filter ducting exhaust dengan unit baru.\n2. Buat safety stock buffer filter di gudang minimum 2 unit suku cadang.",
        lessonLearned: "Keselamatan kerja dan kesehatan pernapasan operator bergantung pada kelancaran rantai pasok alat pemeliharaan HSE.",
        auditorName: "Budi Santoso (Expert Auditor CEM)",
        severity: "High",
        status: "Open",
        auditDate: "2026-08-18",
      },
    ]);

    // Store seed flag
    await db.insert(appSettings).values({
      key: "checklists_seeded",
      value: "true",
    });

    console.log("Seeding initial data complete.");
  } catch (error) {
    console.error("Error in ensureInitialData:", error);
  }
}
