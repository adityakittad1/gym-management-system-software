const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_FILE || 'gym.db');

let db = null;

async function getDb() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return db;
}

async function initDb() {
  const database = await getDb();

  // Create tables
  // 1. users
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT
    )
  `);

  // 2. members
  await database.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      plan TEXT,
      joinDate TEXT,
      expiryDate TEXT,
      daysRemaining INTEGER,
      status TEXT
    )
  `);

  // 3. payments
  await database.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberName TEXT,
      memberId INTEGER,
      amount REAL,
      plan TEXT,
      date TEXT,
      method TEXT,
      status TEXT,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE SET NULL
    )
  `);

  // 4. trainers
  await database.exec(`
    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      specialty TEXT,
      phone TEXT,
      email TEXT,
      assignedMembers INTEGER,
      experience TEXT,
      availability TEXT
    )
  `);

  // 5. attendance
  await database.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberName TEXT,
      memberId INTEGER,
      checkInTime TEXT,
      status TEXT,
      date TEXT,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // 6. settings
  await database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // 7. notifications
  await database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      time TEXT,
      isRead INTEGER DEFAULT 0
    )
  `);

  // 8. activities
  await database.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      name TEXT,
      action TEXT,
      time TEXT
    )
  `);

  // 9. whatsapp_config
  await database.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apiKey TEXT,
      phoneNumber TEXT,
      provider TEXT,
      isConnected INTEGER DEFAULT 0,
      reminderEnabled INTEGER DEFAULT 1,
      expiryReminderDays INTEGER DEFAULT 7,
      lowAttendanceDays INTEGER DEFAULT 5,
      customMessage TEXT,
      sendMethod TEXT DEFAULT 'whatsapp',
      autoSend INTEGER DEFAULT 0
    )
  `);

  // 10. reminder_logs
  await database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberName TEXT,
      phone TEXT,
      type TEXT,
      message TEXT,
      method TEXT,
      status TEXT,
      sentAt TEXT
    )
  `);

  // 11. whatsapp_logs (Real WhatsApp delivery logs)
  await database.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberName TEXT,
      phone TEXT,
      type TEXT,
      message TEXT,
      status TEXT,
      errorReason TEXT,
      sentAt TEXT
    )
  `);

  // Alter members table to add trainer and progress tracking fields if they do not exist
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN trainerId INTEGER`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN beforeImage TEXT`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN afterImage TEXT`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN weight REAL`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN targetWeight REAL`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN height REAL`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN bodyFat REAL`);
  } catch(e) {}

  // Phase 2: Add email, lastVisit, notes to members
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN email TEXT`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN lastVisit TEXT`);
  } catch(e) {}
  try {
    await database.exec(`ALTER TABLE members ADD COLUMN notes TEXT`);
  } catch(e) {}

  // Phase 2: member_measurements table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS member_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER,
      date TEXT,
      weight REAL,
      bodyFat REAL,
      chest REAL,
      waist REAL,
      hips REAL,
      arms REAL,
      thighs REAL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Phase 3: expenses table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      amount REAL,
      month INTEGER,
      year INTEGER,
      notes TEXT,
      createdAt TEXT
    )
  `);

  // Phase 4: leads table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      source TEXT,
      stage TEXT DEFAULT 'new',
      assignedStaff TEXT,
      followUpDate TEXT,
      notes TEXT,
      interestedPlan TEXT,
      createdAt TEXT
    )
  `);

  // Phase 4: visitors table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      purpose TEXT,
      trialDate TEXT,
      interestedMembership TEXT,
      followUpDate TEXT,
      assignedStaff TEXT,
      createdAt TEXT
    )
  `);

  // Phase 4: backups table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      size INTEGER,
      createdAt TEXT
    )
  `);

  // Phase 4: Add category to notifications
  try {
    await database.exec(`ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'system'`);
  } catch(e) {}

  // 11. workouts
  await database.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER,
      title TEXT,
      schedule TEXT, -- JSON stringified schedule
      created_at TEXT,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // 12. diet_plans
  await database.exec(`
    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER,
      title TEXT,
      schedule TEXT, -- JSON stringified diet schedule
      created_at TEXT,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Seed Admin user
  const userCount = await database.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await database.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@ttz.com', 'admin123', 'Admin User', 'Super Admin']
    );
  }

  // Seed Members
  const memberCount = await database.get('SELECT COUNT(*) as count FROM members');
  if (memberCount.count === 0) {
    const seedMembers = [
      { id: 1, name: 'Rahul Sharma', phone: '+91 9876543210', plan: 'Annual', joinDate: '2025-07-15', expiryDate: '2026-07-15', daysRemaining: 48, status: 'active' },
      { id: 2, name: 'Priya Patel', phone: '+91 9876543211', plan: 'Quarterly', joinDate: '2026-03-10', expiryDate: '2026-06-10', daysRemaining: 13, status: 'expiring' },
      { id: 3, name: 'Amit Kumar', phone: '+91 9876543212', plan: 'Monthly', joinDate: '2026-05-01', expiryDate: '2026-06-01', daysRemaining: 4, status: 'expiring' },
      { id: 4, name: 'Sneha Desai', phone: '+91 9876543213', plan: 'Annual', joinDate: '2025-06-20', expiryDate: '2026-06-20', daysRemaining: 23, status: 'active' },
      { id: 5, name: 'Vikram Singh', phone: '+91 9876543214', plan: 'Monthly', joinDate: '2026-04-25', expiryDate: '2026-05-25', daysRemaining: -3, status: 'expired' },
      { id: 6, name: 'Anjali Reddy', phone: '+91 9876543215', plan: 'Quarterly', joinDate: '2025-12-01', expiryDate: '2026-09-01', daysRemaining: 96, status: 'active' },
      { id: 7, name: 'Arjun Mehta', phone: '+91 9876543216', plan: 'Monthly', joinDate: '2026-05-10', expiryDate: '2026-06-10', daysRemaining: 13, status: 'expiring' },
      { id: 8, name: 'Kavya Iyer', phone: '+91 9876543217', plan: 'Annual', joinDate: '2025-08-01', expiryDate: '2026-08-01', daysRemaining: 65, status: 'active' }
    ];

    for (const m of seedMembers) {
      await database.run(
        'INSERT INTO members (id, name, phone, plan, joinDate, expiryDate, daysRemaining, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.name, m.phone, m.plan, m.joinDate, m.expiryDate, m.daysRemaining, m.status]
      );
    }
  }

  // Seed Trainers
  const trainerCount = await database.get('SELECT COUNT(*) as count FROM trainers');
  if (trainerCount.count === 0) {
    const seedTrainers = [
      { id: 1, name: 'Coach Rajesh Patil', specialty: 'Strength Training', phone: '+91 9876543220', email: 'rajesh@ttz.com', assignedMembers: 25, experience: '8 Years', availability: 'Mon-Sat, 6 AM - 2 PM' },
      { id: 2, name: 'Coach Priyanka Shah', specialty: 'Cardio & Weight Loss', phone: '+91 9876543221', email: 'priyanka@ttz.com', assignedMembers: 32, experience: '6 Years', availability: 'Mon-Sat, 7 AM - 3 PM' },
      { id: 3, name: 'Coach Vikram Joshi', specialty: 'CrossFit & HIIT', phone: '+91 9876543222', email: 'vikram@ttz.com', assignedMembers: 18, experience: '5 Years', availability: 'Mon-Fri, 5 AM - 1 PM' },
      { id: 4, name: 'Coach Neha Kulkarni', specialty: 'Yoga & Flexibility', phone: '+91 9876543223', email: 'neha@ttz.com', assignedMembers: 28, experience: '7 Years', availability: 'Mon-Sat, 8 AM - 4 PM' }
    ];

    for (const t of seedTrainers) {
      await database.run(
        'INSERT INTO trainers (id, name, specialty, phone, email, assignedMembers, experience, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.name, t.specialty, t.phone, t.email, t.assignedMembers, t.experience, t.availability]
      );
    }
  }

  // Seed Payments
  const paymentCount = await database.get('SELECT COUNT(*) as count FROM payments');
  if (paymentCount.count === 0) {
    const seedPayments = [
      { id: 1, memberName: 'Rahul Sharma', memberId: 1, amount: 12000, plan: 'Annual', date: '2026-05-25', method: 'UPI', status: 'paid' },
      { id: 2, memberName: 'Priya Patel', memberId: 2, amount: 3000, plan: 'Quarterly', date: '2026-05-26', method: 'Cash', status: 'paid' },
      { id: 3, memberName: 'Amit Kumar', memberId: 3, amount: 1200, plan: 'Monthly', date: '2026-05-27', method: 'Card', status: 'pending' },
      { id: 4, memberName: 'Sneha Desai', memberId: 4, amount: 12000, plan: 'Annual', date: '2026-05-22', method: 'UPI', status: 'paid' },
      { id: 5, memberName: 'Kavya Iyer', memberId: 8, amount: 1200, plan: 'Monthly', date: '2026-05-28', method: 'UPI', status: 'paid' },
      { id: 6, memberName: 'Arjun Mehta', memberId: 7, amount: 1200, plan: 'Monthly', date: '2026-05-20', method: 'Cash', status: 'pending' },
      { id: 7, memberName: 'Anjali Reddy', memberId: 6, amount: 3000, plan: 'Quarterly', date: '2026-05-15', method: 'Card', status: 'paid' }
    ];

    for (const p of seedPayments) {
      await database.run(
        'INSERT INTO payments (id, memberName, memberId, amount, plan, date, method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.memberName, p.memberId, p.amount, p.plan, p.date, p.method, p.status]
      );
    }
  }

  // Seed Attendance (Today's Sheet)
  const attendanceCount = await database.get('SELECT COUNT(*) as count FROM attendance');
  if (attendanceCount.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    const seedAttendance = [
      { id: 1, memberName: 'Rahul Sharma', memberId: 1, checkInTime: '06:15 AM', status: 'present', date: today },
      { id: 2, memberName: 'Priya Patel', memberId: 2, checkInTime: '07:30 AM', status: 'present', date: today },
      { id: 3, memberName: 'Sneha Desai', memberId: 4, checkInTime: '08:45 AM', status: 'present', date: today },
      { id: 4, memberName: 'Kavya Iyer', memberId: 8, checkInTime: '09:20 AM', status: 'present', date: today },
      { id: 5, memberName: 'Arjun Mehta', memberId: 7, checkInTime: '10:00 AM', status: 'present', date: today },
      { id: 6, memberName: 'Anjali Reddy', memberId: 6, checkInTime: '11:15 AM', status: 'present', date: today },
      { id: 7, memberName: 'Vikram Singh', memberId: 5, checkInTime: 'N/A', status: 'absent', date: today },
      { id: 8, memberName: 'Amit Kumar', memberId: 3, checkInTime: 'N/A', status: 'absent', date: today }
    ];

    for (const a of seedAttendance) {
      await database.run(
        'INSERT INTO attendance (id, memberName, memberId, checkInTime, status, date) VALUES (?, ?, ?, ?, ?, ?)',
        [a.id, a.memberName, a.memberId, a.checkInTime, a.status, a.date]
      );
    }
  }

  // Seed WhatsApp Config
  const waCount = await database.get('SELECT COUNT(*) as count FROM whatsapp_config');
  if (waCount.count === 0) {
    await database.run(
      `INSERT INTO whatsapp_config (apiKey, phoneNumber, provider, isConnected, reminderEnabled, expiryReminderDays, lowAttendanceDays, customMessage, sendMethod, autoSend)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['', '', 'twilio', 0, 1, 7, 5, 'Dear {name}, your TTZ Fitness membership expires on {date}. Renew now to continue your fitness journey! Contact: 8668891406', 'whatsapp', 0]
    );
  }

  // Seed Settings
  const settingsCount = await database.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultSettings = {
      gymName: 'The Transformation Zone (TTZ)',
      tagline: 'Fitness | Focus | Future',
      gymType: 'Unisex Gym & Nutrition Club',
      primaryPhone: '8668891406',
      secondaryPhone: '9028468563',
      email: 'contact@ttz.fitness',
      instagram: '@ttz_fitness_24',
      address: 'Near Ayyappa Swami Temple, Plot No. 11, Gut No. 142, Hanuman Temple, Satara, Chhatrapati Sambhajinagar',
      openingTime: '05:00',
      closingTime: '23:00',
      expiryAlerts: 'true',
      paymentReminders: 'true',
      newMemberAlerts: 'true',
      theme: 'dark'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await database.run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    }
  }

  // Seed Notifications
  const notificationsCount = await database.get('SELECT COUNT(*) as count FROM notifications');
  if (notificationsCount.count === 0) {
    const seedNotifications = [
      { id: 1, title: 'Upcoming Expiry', message: 'Amit Kumar\'s membership expires in 4 days.', time: '10 mins ago', isRead: 0 },
      { id: 2, title: 'Pending Payment', message: 'Arjun Mehta\'s monthly payment of ₹1,200 is overdue.', time: '1 hour ago', isRead: 0 },
      { id: 3, title: 'New Registration', message: 'Rahul Sharma joined today on Annual Plan.', time: '3 hours ago', isRead: 1 }
    ];

    for (const n of seedNotifications) {
      await database.run(
        'INSERT INTO notifications (id, title, message, time, isRead) VALUES (?, ?, ?, ?, ?)',
        [n.id, n.title, n.message, n.time, n.isRead]
      );
    }
  }

  // Seed Recent Activities
  const activityCount = await database.get('SELECT COUNT(*) as count FROM activities');
  if (activityCount.count === 0) {
    const seedActivities = [
      { id: 1, type: 'new_member', name: 'Rahul Sharma', action: 'joined the gym', time: '10 mins ago' },
      { id: 2, type: 'payment', name: 'Priya Patel', action: 'paid ₹3,000', time: '25 mins ago' },
      { id: 3, type: 'renewal', name: 'Amit Kumar', action: 'renewed membership', time: '1 hour ago' },
      { id: 4, type: 'attendance', name: 'Sneha Desai', action: 'checked in', time: '2 hours ago' }
    ];

    for (const a of seedActivities) {
      await database.run(
        'INSERT INTO activities (id, type, name, action, time) VALUES (?, ?, ?, ?, ?)',
        [a.id, a.type, a.name, a.action, a.time]
      );
    }
  }

  // Set default body metrics and trainer assignment for seeded members if empty
  await database.run(`
    UPDATE members SET 
      trainerId = COALESCE(trainerId, 1),
      weight = COALESCE(weight, 78.5),
      targetWeight = COALESCE(targetWeight, 72.0),
      height = COALESCE(height, 175.0),
      bodyFat = COALESCE(bodyFat, 18.2)
    WHERE id = 1
  `);
  await database.run(`
    UPDATE members SET 
      trainerId = COALESCE(trainerId, 2),
      weight = COALESCE(weight, 64.2),
      targetWeight = COALESCE(targetWeight, 58.0),
      height = COALESCE(height, 162.0),
      bodyFat = COALESCE(bodyFat, 24.5)
    WHERE id = 2
  `);

  // Seed Workouts
  const workoutCount = await database.get('SELECT COUNT(*) as count FROM workouts');
  if (workoutCount.count === 0) {
    const defaultWorkouts = [
      {
        memberId: 1,
        title: 'Premium Lean Muscle Split',
        schedule: JSON.stringify({
          'Monday': [{ name: 'Bench Press', sets: 4, reps: '8-12', notes: 'Warm up thoroughly, target RPE 8' }, { name: 'Incline Dumbbell Press', sets: 3, reps: '10', notes: 'Focus on upper chest squeeze' }, { name: 'Tricep Pushdowns', sets: 4, reps: '12', notes: 'Slow negatives' }],
          'Wednesday': [{ name: 'Barbell Squats', sets: 4, reps: '8', notes: 'Keep back straight, below parallel' }, { name: 'Leg Press', sets: 3, reps: '12', notes: 'Control the weight' }, { name: 'Calf Raises', sets: 4, reps: '15', notes: 'Hold peak contraction' }],
          'Friday': [{ name: 'Deadlifts', sets: 4, reps: '5', notes: 'Focus on form, brace core' }, { name: 'Pull-Ups', sets: 3, reps: 'Max', notes: 'Controlled drop' }, { name: 'Barbell Curls', sets: 3, reps: '10', notes: 'No swinging' }]
        }),
        created_at: new Date().toISOString()
      },
      {
        memberId: 2,
        title: 'Fat Loss HIIT & Cardio',
        schedule: JSON.stringify({
          'Tuesday': [{ name: 'Treadmill Interval', sets: 1, reps: '20 mins', notes: '30s sprint / 30s walk' }, { name: 'Burpees', sets: 3, reps: '15', notes: 'High intensity' }],
          'Thursday': [{ name: 'Kettlebell Swings', sets: 4, reps: '20', notes: 'Hip hinge power' }, { name: 'Plank', sets: 3, reps: '60s', notes: 'Keep body aligned' }],
          'Saturday': [{ name: 'Rowing Machine', sets: 1, reps: '15 mins', notes: 'Moderate pace' }, { name: 'Jumping Jacks', sets: 3, reps: '50', notes: 'Active rest' }]
        }),
        created_at: new Date().toISOString()
      }
    ];

    for (const w of defaultWorkouts) {
      await database.run(
        'INSERT INTO workouts (memberId, title, schedule, created_at) VALUES (?, ?, ?, ?)',
        [w.memberId, w.title, w.schedule, w.created_at]
      );
    }
  }

  // Seed Diets
  const dietCount = await database.get('SELECT COUNT(*) as count FROM diet_plans');
  if (dietCount.count === 0) {
    const defaultDiets = [
      {
        memberId: 1,
        title: 'High Protein Hypertrophy Diet',
        schedule: JSON.stringify({
          'Breakfast': '4 Egg whites + 2 whole eggs, 50g Oats with almond milk, 1 Banana',
          'Lunch': '200g Grilled Chicken Breast, 150g Brown Rice, Broccoli & Spinach',
          'Snack': '1 Scoop Whey Protein, 30g Almonds, Apple',
          'Dinner': '150g Baked Salmon/Paneer, Sweet Potato, Mixed Salad'
        }),
        created_at: new Date().toISOString()
      },
      {
        memberId: 2,
        title: 'Lean Shred Calorie Deficit Plan',
        schedule: JSON.stringify({
          'Breakfast': 'Egg white omelet with vegetables, Green Tea',
          'Lunch': 'Mixed salad with Tuna/Tofu, 100g Quinoa',
          'Snack': 'Greek Yogurt with berries',
          'Dinner': 'Grilled Paneer/Fish, Stir-fried veggies, Asparagus'
        }),
        created_at: new Date().toISOString()
      }
    ];

    for (const d of defaultDiets) {
      await database.run(
        'INSERT INTO diet_plans (memberId, title, schedule, created_at) VALUES (?, ?, ?, ?)',
        [d.memberId, d.title, d.schedule, d.created_at]
      );
    }
  }
}

module.exports = {
  getDb,
  initDb
};
