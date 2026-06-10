require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Logger fallback ────────────────────────────────────────────────────────────
let logger;
try { logger = require('./config/logger'); }
catch { logger = { info: console.log, error: console.error }; }

// ── DB connect ─────────────────────────────────────────────────────────────────
let connectDB;
try { connectDB = require('./config/database'); }
catch {
  connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb+srv://amitlms:%21%40%23%24%25@lms.6wc6rbx.mongodb.net/jobportal?retryWrites=true&w=majority&appName=lms';
    console.log('MONGO_URI =', process.env.MONGO_URI);
    await mongoose.connect(uri);
    logger.info('MongoDB connected (fallback)');
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
const seed = async () => {
  await connectDB();
  logger.info('🌱 Starting full seed...');

  // ── Model imports ─────────────────────────────────────────────────────────────
  const User         = require('./models/User.model');
  const RefreshToken = require('./models/RefreshToken.model');
  const Job          = require('./models/Job.model');
  const Resume       = require('./models/Resume.model');
  const Company      = require('./models/Company.model');
  const Application  = require('./models/Application.model');
  const Package      = require('./models/Package.model');
  const { UserPackage, Invoice, TransactionLog, Subscription } = require('./models/Payment.model');
  const { Conversation, Message } = require('./models/Message.model');
  const Notification = require('./models/Notification.model');
  const {
    Category, JobType, CareerLevel, Education,
    SalaryRangeType, Currency, Country, State, City,
    Department, CoverLetter, JobAlert, JobShortlist,
    ActivityLog, Tag, Follower, Report,
    EmployerViewResume, SavedSearch,
    Folder, FolderResume, SystemError,
  } = require('./models/Misc.model');

  // ── Wipe helper ───────────────────────────────────────────────────────────────
  const wipe = async (...models) => {
    for (const m of models) {
      try { await m.deleteMany({}); } catch { /* skip */ }
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // 1 · CURRENCIES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Currency);
  const currencies = await Currency.insertMany([
    { title: 'Indian Rupee',     symbol: '₹',   code: 'INR', status: true, isDefault: true,  ordering: 1 },
    { title: 'US Dollar',        symbol: '$',   code: 'USD', status: true, isDefault: false, ordering: 2 },
    { title: 'Euro',             symbol: '€',   code: 'EUR', status: true, isDefault: false, ordering: 3 },
    { title: 'British Pound',    symbol: '£',   code: 'GBP', status: true, isDefault: false, ordering: 4 },
    { title: 'UAE Dirham',       symbol: 'AED', code: 'AED', status: true, isDefault: false, ordering: 5 },
    { title: 'Singapore Dollar', symbol: 'S$',  code: 'SGD', status: true, isDefault: false, ordering: 6 },
  ]);
  logger.info(`✅ ${currencies.length} currencies`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 2 · CATEGORIES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Category);
  const parentCats = await Category.insertMany([
    { catTitle: 'Information Technology', alias: 'it',               isActive: true, ordering: 1,  parentId: null },
    { catTitle: 'Marketing & Sales',      alias: 'marketing',        isActive: true, ordering: 2,  parentId: null },
    { catTitle: 'Finance & Accounting',   alias: 'finance',          isActive: true, ordering: 3,  parentId: null },
    { catTitle: 'Human Resources',        alias: 'hr',               isActive: true, ordering: 4,  parentId: null },
    { catTitle: 'Engineering',            alias: 'engineering',      isActive: true, ordering: 5,  parentId: null },
    { catTitle: 'Healthcare',             alias: 'healthcare',       isActive: true, ordering: 6,  parentId: null },
    { catTitle: 'Education & Training',   alias: 'education',        isActive: true, ordering: 7,  parentId: null },
    { catTitle: 'Design & Creative',      alias: 'design',           isActive: true, ordering: 8,  parentId: null },
    { catTitle: 'Operations & Logistics', alias: 'operations',       isActive: true, ordering: 9,  parentId: null },
    { catTitle: 'Customer Service',       alias: 'customer-service', isActive: true, ordering: 10, parentId: null },
  ]);
  await Category.insertMany([
    { catTitle: 'Software Development', alias: 'software-dev',     isActive: true, ordering: 1, parentId: parentCats[0]._id },
    { catTitle: 'Data Science & AI',    alias: 'data-science',     isActive: true, ordering: 2, parentId: parentCats[0]._id },
    { catTitle: 'DevOps & Cloud',       alias: 'devops',           isActive: true, ordering: 3, parentId: parentCats[0]._id },
    { catTitle: 'Mobile Development',   alias: 'mobile-dev',       isActive: true, ordering: 4, parentId: parentCats[0]._id },
    { catTitle: 'UI/UX Design',         alias: 'ui-ux',            isActive: true, ordering: 1, parentId: parentCats[7]._id },
    { catTitle: 'Graphic Design',       alias: 'graphic-design',   isActive: true, ordering: 2, parentId: parentCats[7]._id },
    { catTitle: 'Performance Marketing',alias: 'perf-marketing',   isActive: true, ordering: 1, parentId: parentCats[1]._id },
  ]);
  logger.info(`✅ ${parentCats.length} parent categories + sub-categories`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 3 · JOB TYPES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(JobType);
  const jobTypes = await JobType.insertMany([
    { title: 'Full Time',  alias: 'full-time',  color: '#059669', isActive: true, status: true, ordering: 1 },
    { title: 'Part Time',  alias: 'part-time',  color: '#2563eb', isActive: true, status: true, ordering: 2 },
    { title: 'Contract',   alias: 'contract',   color: '#d97706', isActive: true, status: true, ordering: 3 },
    { title: 'Internship', alias: 'internship', color: '#7c3aed', isActive: true, status: true, ordering: 4 },
    { title: 'Freelance',  alias: 'freelance',  color: '#db2777', isActive: true, status: true, ordering: 5 },
    { title: 'Remote',     alias: 'remote',     color: '#0891b2', isActive: true, status: true, ordering: 6 },
    { title: 'Temporary',  alias: 'temporary',  color: '#ea580c', isActive: true, status: true, ordering: 7 },
  ]);
  logger.info(`✅ ${jobTypes.length} job types`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 4 · CAREER LEVELS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(CareerLevel);
  const careerLevels = await CareerLevel.insertMany([
    { title: 'Entry Level',      status: true, ordering: 1 },
    { title: 'Mid Level',        status: true, ordering: 2 },
    { title: 'Senior Level',     status: true, ordering: 3 },
    { title: 'Team Lead',        status: true, ordering: 4 },
    { title: 'Manager',          status: true, ordering: 5 },
    { title: 'Senior Manager',   status: true, ordering: 6 },
    { title: 'Director',         status: true, ordering: 7 },
    { title: 'VP / C-Level',     status: true, ordering: 8 },
    { title: 'Executive',        status: true, ordering: 9 },
    { title: 'Student / Intern', status: true, ordering: 10 },
  ]);
  logger.info(`✅ ${careerLevels.length} career levels`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 5 · EDUCATION
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Education);
  const educations = await Education.insertMany([
    { title: 'High School',                isActive: true, ordering: 1 },
    { title: 'Diploma',                    isActive: true, ordering: 2 },
    { title: "Bachelor's Degree",          isActive: true, ordering: 3, isDefault: true },
    { title: "Master's Degree",            isActive: true, ordering: 4 },
    { title: 'PhD / Doctorate',            isActive: true, ordering: 5 },
    { title: 'Professional Certification', isActive: true, ordering: 6 },
    { title: 'Any',                        isActive: true, ordering: 7 },
  ]);
  logger.info(`✅ ${educations.length} education levels`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 6 · SALARY RANGE TYPES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(SalaryRangeType);
  const salaryTypes = await SalaryRangeType.insertMany([
    { title: 'Per Month', status: true, ordering: 1, isDefault: true },
    { title: 'Per Year',  status: true, ordering: 2 },
    { title: 'Per Hour',  status: true, ordering: 3 },
    { title: 'Per Day',   status: true, ordering: 4 },
    { title: 'Fixed',     status: true, ordering: 5 },
  ]);
  logger.info(`✅ ${salaryTypes.length} salary range types`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 7 · COUNTRIES → STATES → CITIES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Country, State, City);
  const [india, usa, uk, uae] = await Country.insertMany([
    { name: 'India',                nameCode: 'IN', shortCountry: 'IND', dialCode: 91,  enabled: true },
    { name: 'United States',        nameCode: 'US', shortCountry: 'USA', dialCode: 1,   enabled: true },
    { name: 'United Kingdom',       nameCode: 'GB', shortCountry: 'GBR', dialCode: 44,  enabled: true },
    { name: 'United Arab Emirates', nameCode: 'AE', shortCountry: 'ARE', dialCode: 971, enabled: true },
    { name: 'Singapore',            nameCode: 'SG', shortCountry: 'SGP', dialCode: 65,  enabled: true },
  ]);
  const [mh, ka, dl, tn, ca, ny] = await State.insertMany([
    { name: 'Maharashtra', shortRegion: 'MH', countryId: india._id, enabled: true },
    { name: 'Karnataka',   shortRegion: 'KA', countryId: india._id, enabled: true },
    { name: 'Delhi',       shortRegion: 'DL', countryId: india._id, enabled: true },
    { name: 'Tamil Nadu',  shortRegion: 'TN', countryId: india._id, enabled: true },
    { name: 'California',  shortRegion: 'CA', countryId: usa._id,   enabled: true },
    { name: 'New York',    shortRegion: 'NY', countryId: usa._id,   enabled: true },
  ]);
  const cities = await City.insertMany([
    { name: 'Mumbai',        cityName: 'Mumbai',        stateId: mh._id, countryId: india._id, enabled: true, latitude: '19.0760', longitude: '72.8777' },
    { name: 'Pune',          cityName: 'Pune',          stateId: mh._id, countryId: india._id, enabled: true, latitude: '18.5204', longitude: '73.8567' },
    { name: 'Bangalore',     cityName: 'Bangalore',     stateId: ka._id, countryId: india._id, enabled: true, latitude: '12.9716', longitude: '77.5946' },
    { name: 'New Delhi',     cityName: 'New Delhi',     stateId: dl._id, countryId: india._id, enabled: true, latitude: '28.6139', longitude: '77.2090' },
    { name: 'Hyderabad',     cityName: 'Hyderabad',     stateId: ka._id, countryId: india._id, enabled: true, latitude: '17.3850', longitude: '78.4867' },
    { name: 'Chennai',       cityName: 'Chennai',       stateId: tn._id, countryId: india._id, enabled: true, latitude: '13.0827', longitude: '80.2707' },
    { name: 'San Francisco', cityName: 'San Francisco', stateId: ca._id, countryId: usa._id,   enabled: true, latitude: '37.7749', longitude: '-122.4194' },
    { name: 'New York City', cityName: 'New York City', stateId: ny._id, countryId: usa._id,   enabled: true, latitude: '40.7128', longitude: '-74.0060' },
    { name: 'London',        cityName: 'London',        stateId: null,   countryId: uk._id,    enabled: true, latitude: '51.5074', longitude: '-0.1278' },
    { name: 'Dubai',         cityName: 'Dubai',         stateId: null,   countryId: uae._id,   enabled: true, latitude: '25.2048', longitude: '55.2708' },
  ]);
  logger.info(`✅ ${cities.length} cities across 4 countries`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 8 · TAGS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Tag);
  await Tag.insertMany([
    { tag: 'JavaScript',       alias: 'javascript',       tagFor: 1, status: true },
    { tag: 'Python',           alias: 'python',           tagFor: 1, status: true },
    { tag: 'React',            alias: 'react',            tagFor: 1, status: true },
    { tag: 'Node.js',          alias: 'nodejs',           tagFor: 1, status: true },
    { tag: 'MongoDB',          alias: 'mongodb',          tagFor: 1, status: true },
    { tag: 'AWS',              alias: 'aws',              tagFor: 1, status: true },
    { tag: 'Docker',           alias: 'docker',           tagFor: 1, status: true },
    { tag: 'Kubernetes',       alias: 'kubernetes',       tagFor: 1, status: true },
    { tag: 'TypeScript',       alias: 'typescript',       tagFor: 1, status: true },
    { tag: 'React Native',     alias: 'react-native',     tagFor: 1, status: true },
    { tag: 'Machine Learning', alias: 'machine-learning', tagFor: 2, status: true },
    { tag: 'Data Analysis',    alias: 'data-analysis',    tagFor: 2, status: true },
    { tag: 'SQL',              alias: 'sql',              tagFor: 2, status: true },
    { tag: 'Figma',            alias: 'figma',            tagFor: 2, status: true },
    { tag: 'Leadership',       alias: 'leadership',       tagFor: 2, status: true },
    { tag: 'Agile',            alias: 'agile',            tagFor: 2, status: true },
    { tag: 'Communication',    alias: 'communication',    tagFor: 2, status: true },
    { tag: 'GraphQL',          alias: 'graphql',          tagFor: 1, status: true },
  ]);
  logger.info('✅ Tags seeded');

  // ═════════════════════════════════════════════════════════════════════════════
  // 9 · PACKAGES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Package);
  const packages = await Package.insertMany([
    {
      title: 'Jobseeker Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      resume: 1, jobApply: 5, jobAlert: 1, coverletter: 1,
      packageFor: 'jobseeker', status: true,
    },
    {
      title: 'Jobseeker Basic', price: 299,
      packageTime: 30, packageTimeUnit: 'days',
      resume: 5, featuredResume: 1, jobApply: 50, jobAlert: 5, coverletter: 5,
      featuredResumeTime: 7, featuredResumeTimeUnit: 'days',
      packageFor: 'jobseeker', status: true,
    },
    {
      title: 'Jobseeker Premium', price: 799,
      packageTime: 90, packageTimeUnit: 'days',
      resume: 20, featuredResume: 3, jobApply: 999, jobAlert: 20, coverletter: 20,
      featuredResumeTime: 14, featuredResumeTimeUnit: 'days',
      discount: 10, discountType: 'percent',
      packageFor: 'jobseeker', status: true,
    },
    {
      title: 'Employer Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      job: 1, companies: 1, resumeSearch: 5,
      jobTime: 15, jobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Basic', price: 999,
      packageTime: 30, packageTimeUnit: 'days',
      job: 10, featuredJob: 1, companies: 1, department: 3,
      resumeSearch: 50, jobTime: 30, jobTimeUnit: 'days',
      featuredJobTime: 7, featuredJobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Pro', price: 2999,
      packageTime: 30, packageTimeUnit: 'days',
      job: 50, featuredJob: 5, companies: 1, department: 10,
      resumeSearch: 999, featuredCompany: 1,
      jobTime: 60, jobTimeUnit: 'days',
      featuredJobTime: 14, featuredJobTimeUnit: 'days',
      featuredCompanyTime: 30, featuredCompanyTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Enterprise', price: 7999,
      packageTime: 90, packageTimeUnit: 'days',
      job: -1, featuredJob: 20, companies: 3, department: 50,
      resumeSearch: -1, featuredCompany: 3,
      jobTime: 90, jobTimeUnit: 'days',
      stripeSubscription: true,
      discount: 15, discountType: 'percent',
      renewDiscount: 10, renewDiscountType: 'percent',
      packageFor: 'employer', status: true,
    },
  ]);
  logger.info(`✅ ${packages.length} packages`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 10 · USERS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(User, RefreshToken);
  const hashedPw = await bcrypt.hash('Pass@123456', 12);

  const [admin, emp1, js1, emp2, js2] = await User.insertMany([
    {
      firstName: 'Arjun', lastName: 'Sharma',
      email: 'admin@hirehub.io', password: hashedPw,
      phone: '+91-9800000001', role: 'admin',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 100,
      avatar: { publicId: 'avatars/admin', secureUrl: 'https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(), lastActive: new Date(), loginCount: 45,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    {
      firstName: 'Priya', lastName: 'Mehta',
      email: 'employer@hirehub.io', password: hashedPw,
      phone: '+91-9800000002', role: 'employer',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 92,
      avatar: { publicId: 'avatars/emp1', secureUrl: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=10b981&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 7200000), lastActive: new Date(), loginCount: 22,
      socialLinks: { linkedin: 'https://linkedin.com/in/priyamehta', website: 'https://techcorp.io', github: '', twitter: '', facebook: '' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    {
      firstName: 'Rahul', lastName: 'Verma',
      email: 'jobseeker@hirehub.io', password: hashedPw,
      phone: '+91-9800000003', role: 'jobseeker',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 88,
      avatar: { publicId: 'avatars/js1', secureUrl: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 3600000), lastActive: new Date(), loginCount: 18,
      socialLinks: { linkedin: 'https://linkedin.com/in/rahulverma', github: 'https://github.com/rahulverma', twitter: '', facebook: '', website: '' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: true, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    {
      firstName: 'Vikram', lastName: 'Singh',
      email: 'vikram.employer@hirehub.io', password: hashedPw,
      phone: '+91-9800000004', role: 'employer',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 78,
      avatar: { publicId: 'avatars/emp2', secureUrl: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=3b82f6&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 86400000), lastActive: new Date(), loginCount: 10,
      socialLinks: { linkedin: '', github: '', twitter: '', facebook: '', website: '' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    {
      firstName: 'Sneha', lastName: 'Kapoor',
      email: 'sneha.jobseeker@hirehub.io', password: hashedPw,
      phone: '+91-9800000005', role: 'jobseeker',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 72,
      avatar: { publicId: 'avatars/js2', secureUrl: 'https://ui-avatars.com/api/?name=Sneha+Kapoor&background=ec4899&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 10800000), lastActive: new Date(), loginCount: 7,
      socialLinks: { linkedin: 'https://linkedin.com/in/snehakapoor', github: '', twitter: '', facebook: '', website: '' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: true, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
  ], { ordered: true });
  logger.info('✅ 5 users (admin · 2 employers · 2 jobseekers) | password: Pass@123456');

  // ═════════════════════════════════════════════════════════════════════════════
  // 11 · USER PACKAGES + INVOICES + TRANSACTION LOGS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(UserPackage, Invoice, TransactionLog, Subscription);
  const n = Date.now();

  const pkgPro      = packages.find(p => p.title === 'Employer Pro');
  const pkgBasicEmp = packages.find(p => p.title === 'Employer Basic');
  const pkgPremJs   = packages.find(p => p.title === 'Jobseeker Premium');
  const pkgFreeJs   = packages.find(p => p.title === 'Jobseeker Free');

  const [up1, up2, up3, up4] = await UserPackage.insertMany([
    {
      uid: emp1._id, packageId: pkgPro._id,
      endDate: new Date(n + 60 * 86400000), status: true, isActive: true,
      remainingJobs: 47, remainingFeaturedJobs: 4, remainingCompanies: 1,
      remainingResumeSearch: 976,
    },
    {
      uid: js1._id, packageId: pkgPremJs._id,
      endDate: new Date(n + 90 * 86400000), status: true, isActive: true,
      remainingResumes: 18, remainingFeaturedResumes: 2,
      remainingJobApply: 964, remainingJobAlerts: 18,
    },
    {
      uid: emp2._id, packageId: pkgBasicEmp._id,
      endDate: new Date(n + 15 * 86400000), status: true, isActive: true,
      remainingJobs: 7, remainingFeaturedJobs: 1, remainingCompanies: 1,
      remainingResumeSearch: 43,
    },
    {
      uid: js2._id, packageId: pkgFreeJs._id,
      endDate: new Date(n + 9999 * 86400000), status: true, isActive: true,
      remainingResumes: 1, remainingJobApply: 3, remainingJobAlerts: 1,
    },
  ]);

  const [inv1, inv2, inv3] = await Invoice.insertMany([
    {
      uid: emp1._id, recordId: up1._id,
      description: 'Employer Pro – 30 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 2999,
      payMethod: 'stripe', paymentStatus: 'paid',
      transactionId: 'ch_3EmpPro' + n,
      paidAt: new Date(n - 5 * 86400000),
      payerName: 'Priya Mehta', payerEmail: 'employer@hirehub.io',
      status: true,
    },
    {
      uid: js1._id, recordId: up2._id,
      description: 'Jobseeker Premium – 90 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 799,
      payMethod: 'stripe', paymentStatus: 'paid',
      transactionId: 'ch_3JsPrem' + n,
      paidAt: new Date(n - 3 * 86400000),
      payerName: 'Rahul Verma', payerEmail: 'jobseeker@hirehub.io',
      status: true,
    },
    {
      uid: emp2._id, recordId: up3._id,
      description: 'Employer Basic – 30 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 999,
      payMethod: 'bank', paymentStatus: 'paid',
      transactionId: 'BANK' + n,
      paidAt: new Date(n - 15 * 86400000),
      payerName: 'Vikram Singh', payerEmail: 'vikram.employer@hirehub.io',
      payerTransactionNumber: 'NEFT20241101001',
      status: true,
    },
  ]);

  await TransactionLog.insertMany([
    { uid: emp1._id, userPackageId: up1._id, recordId: inv1._id, type: 'package_purchase', status: true },
    { uid: js1._id,  userPackageId: up2._id, recordId: inv2._id, type: 'package_purchase', status: true },
    { uid: emp2._id, userPackageId: up3._id, recordId: inv3._id, type: 'package_purchase', status: true },
  ]);
  logger.info('✅ User packages · invoices · transaction logs');

  // ═════════════════════════════════════════════════════════════════════════════
  // 12 · COMPANIES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Company);
  const [co1, co2] = await Company.insertMany([
    {
      uid: emp1._id, name: 'TechCorp Solutions Pvt Ltd',
      slug: 'techcorp-solutions',
      url: 'https://techcorp.io', contactEmail: 'hr@techcorp.io',
      tagline: 'Building the Future, One Line at a Time',
      description: '<p>TechCorp Solutions is a leading software product company headquartered in Bangalore. Founded in 2015, we specialise in cloud-native SaaS, enterprise integrations, and AI-driven analytics. Our 500+ engineers serve Fortune 500 clients globally.</p>',
      phone: '+91-80-40001234',
      city: 'Bangalore', address1: '4th Floor, Tower B, Embassy Tech Village',
      address2: 'Outer Ring Road, Devarabisanahalli', cities: [cities[2]._id],
      logo: { publicId: 'companies/tc/logo', secureUrl: 'https://ui-avatars.com/api/?name=TC&background=6366f1&color=fff&size=200&bold=true', resourceType: 'image', fileSize: 45000 },
      smallLogo: { publicId: 'companies/tc/small', secureUrl: 'https://ui-avatars.com/api/?name=TC&background=6366f1&color=fff&size=80&bold=true' },
      isVerified: true, verificationStatus: 'approved',
      status: 1, isGoldCompany: true,
      startGoldDate: new Date(n - 30 * 86400000), endGoldDate: new Date(n + 60 * 86400000),
      isFeaturedCompany: true,
      startFeaturedDate: new Date(n - 10 * 86400000), endFeaturedDate: new Date(n + 20 * 86400000),
      socialLinks: { linkedin: 'https://linkedin.com/company/techcorp-solutions', twitter: 'https://twitter.com/techcorpio', website: 'https://techcorp.io', facebook: 'https://facebook.com/techcorpio', youtube: '', instagram: '' },
      gallery: [
        { publicId: 'co/tc/g1', secureUrl: 'https://picsum.photos/seed/tc1/800/400', caption: 'Bangalore HQ', uploadedAt: new Date() },
        { publicId: 'co/tc/g2', secureUrl: 'https://picsum.photos/seed/tc2/800/400', caption: 'Team Offsite 2024', uploadedAt: new Date() },
        { publicId: 'co/tc/g3', secureUrl: 'https://picsum.photos/seed/tc3/800/400', caption: 'Hackathon Champions', uploadedAt: new Date() },
      ],
      metaDescription: 'TechCorp Solutions – Leading software company hiring top engineers in Bangalore.',
      metaKeywords: 'software jobs, bangalore, react, nodejs, aws, typescript',
      hits: 1840, followersCount: 347, jobsCount: 7,
      userpackageId: up1._id, serverid: 0,
    },
    {
      uid: emp2._id, name: 'InnovateMind Digital',
      slug: 'innovatemind-digital',
      url: 'https://innovatemind.in', contactEmail: 'careers@innovatemind.in',
      tagline: 'Digital Transformation. Reimagined.',
      description: '<p>InnovateMind Digital is a full-service digital agency based in Mumbai specialising in e-commerce platforms, performance marketing, and mobile apps. 200+ successful projects delivered.</p>',
      phone: '+91-22-40005678',
      city: 'Mumbai', address1: 'Unit 301, Sunshine Business Park',
      address2: 'Andheri East, Mumbai', cities: [cities[0]._id],
      logo: { publicId: 'companies/im/logo', secureUrl: 'https://ui-avatars.com/api/?name=IM&background=10b981&color=fff&size=200&bold=true', resourceType: 'image', fileSize: 38000 },
      smallLogo: { publicId: 'companies/im/small', secureUrl: 'https://ui-avatars.com/api/?name=IM&background=10b981&color=fff&size=80&bold=true' },
      isVerified: true, verificationStatus: 'approved',
      status: 1, isGoldCompany: false, isFeaturedCompany: false,
      socialLinks: { linkedin: 'https://linkedin.com/company/innovatemind', website: 'https://innovatemind.in', twitter: '', facebook: '', youtube: '', instagram: '' },
      gallery: [
        { publicId: 'co/im/g1', secureUrl: 'https://picsum.photos/seed/im1/800/400', caption: 'Mumbai Office', uploadedAt: new Date() },
      ],
      metaDescription: 'InnovateMind Digital – Hiring designers & developers in Mumbai.',
      hits: 480, followersCount: 92, jobsCount: 3,
      userpackageId: up3._id, serverid: 0,
    },
  ]);
  logger.info('✅ 2 companies');

  // ═════════════════════════════════════════════════════════════════════════════
  // 13 · DEPARTMENTS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Department);
  const depts = await Department.insertMany([
    { uid: emp1._id, companyId: co1._id, name: 'Engineering',     alias: 'engineering', description: 'Product & platform engineering', status: true },
    { uid: emp1._id, companyId: co1._id, name: 'Product',         alias: 'product',     description: 'Product management & strategy',  status: true },
    { uid: emp1._id, companyId: co1._id, name: 'Design',          alias: 'design',      description: 'UI/UX & brand design',            status: true },
    { uid: emp1._id, companyId: co1._id, name: 'Marketing',       alias: 'marketing',   description: 'Growth & content marketing',      status: true },
    { uid: emp1._id, companyId: co1._id, name: 'Human Resources', alias: 'hr',          description: 'Talent & people ops',             status: true },
    { uid: emp1._id, companyId: co1._id, name: 'Finance',         alias: 'finance',     description: 'Finance, accounts & legal',       status: true },
    { uid: emp2._id, companyId: co2._id, name: 'Development',     alias: 'dev',         description: 'Web & mobile development',        status: true },
    { uid: emp2._id, companyId: co2._id, name: 'Creative',        alias: 'creative',    description: 'Design & creative team',          status: true },
  ]);
  logger.info(`✅ ${depts.length} departments`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 14 · JOBS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Job);
  const itCat     = parentCats[0]._id;
  const mktCat    = parentCats[1]._id;
  const hrCat     = parentCats[3]._id;
  const designCat = parentCats[7]._id;
  const ftType    = jobTypes[0]._id;
  const ptType    = jobTypes[1]._id;

  const jobs = await Job.insertMany([
    // ── TechCorp ─────────────────────────────────────────────────
    {
      uid: emp1._id, companyId: co1._id,
      title: 'Senior Full Stack Developer (React + Node.js)',
      slug: 'senior-full-stack-developer-react-nodejs-tc',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
      status: 'approved',
      description: '<h3>About the Role</h3><p>Join our core product team as a Senior Full Stack Developer. Own features end-to-end on a platform used by 1M+ users.</p><h3>Responsibilities</h3><ul><li>Ship new product features in React + Node.js</li><li>Review code and mentor junior engineers</li><li>Architect scalable backend services on AWS</li><li>Drive CI/CD and test coverage improvements</li></ul><h3>Stack</h3><p>React 18, TypeScript, Node.js 20, MongoDB Atlas, Redis, Docker, AWS (ECS · S3 · Lambda)</p>',
      qualifications: 'B.Tech in Computer Science or related. 4+ years full-stack experience.',
      prefferdSkills: 'React, TypeScript, Node.js, MongoDB, AWS, Docker, GraphQL, Jest',
      city: 'Bangalore', address1: 'Embassy Tech Village', latitude: '12.9716', longitude: '77.5946',
      cities: [cities[2]._id], workplaceType: 'hybrid',
      contactEmail: 'jobs@techcorp.io', showContact: false,
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 180000, salaryMax: 280000, currency: 'INR',
      experience: 4, noOfJobs: 2,
      expiresAt: new Date(n + 30 * 86400000),
      isGoldJob: true, startGoldDate: new Date(), endGoldDate: new Date(n + 30 * 86400000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(n + 14 * 86400000),
      isUrgent: true, urgentUntil: new Date(n + 7 * 86400000),
      viewsCount: 412, applicationsCount: 14,
      userpackageId: up1._id,
      aiJobSearchText: 'senior full stack developer react nodejs typescript mongodb aws docker bangalore hybrid',
      metaDescription: 'TechCorp hiring Senior Full Stack Developer – React, Node.js, hybrid Bangalore.',
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'DevOps Engineer – AWS & Kubernetes',
      slug: 'devops-engineer-aws-kubernetes-tc',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      status: 'approved',
      description: '<p>Own and scale our cloud infrastructure. Manage EKS clusters, Terraform modules, and GitHub Actions pipelines ensuring 99.99% uptime for core services.</p><ul><li>EKS cluster management</li><li>Infrastructure-as-code (Terraform + Ansible)</li><li>CI/CD with GitHub Actions</li><li>Observability with Datadog & PagerDuty</li></ul>',
      qualifications: 'B.Tech or equivalent. 3+ years DevOps/Cloud experience.',
      prefferdSkills: 'AWS (EKS · RDS · S3), Kubernetes, Terraform, Docker, GitHub Actions, Python, Linux',
      city: 'Bangalore', cities: [cities[2]._id], workplaceType: 'remote',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 200000, salaryMax: 320000, currency: 'INR',
      experience: 3, noOfJobs: 1,
      expiresAt: new Date(n + 25 * 86400000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(n + 14 * 86400000),
      viewsCount: 240, applicationsCount: 8, userpackageId: up1._id,
      aiJobSearchText: 'devops engineer aws kubernetes terraform docker github actions remote bangalore cloud',
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'Product Designer (UI/UX)',
      slug: 'product-designer-ui-ux-tc',
      categoryId: designCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: depts[2]._id,
      tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Research'],
      status: 'approved',
      description: '<p>Own the design process across our core product suite — from user research to high-fidelity Figma prototypes and design-system components.</p><ul><li>Lead UX research and usability testing</li><li>Create wireframes and interactive prototypes in Figma</li><li>Maintain TechCorp design system (100+ components)</li></ul>',
      prefferdSkills: 'Figma, User Research, Prototyping, Design Systems, Accessibility, HTML/CSS basics',
      city: 'Bangalore', cities: [cities[2]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 120000, salaryMax: 200000, currency: 'INR',
      experience: 2, noOfJobs: 1,
      expiresAt: new Date(n + 28 * 86400000),
      viewsCount: 165, applicationsCount: 6, userpackageId: up1._id,
      aiJobSearchText: 'product designer ui ux figma design system user research bangalore onsite',
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'Data Scientist – NLP & LLMs',
      slug: 'data-scientist-nlp-llms-tc',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[3]._id,
      departmentId: depts[0]._id,
      tags: ['Python', 'Machine Learning', 'NLP', 'LLM', 'PyTorch', 'LangChain'],
      status: 'approved',
      description: '<p>Build production NLP and LLM-powered features. Fine-tune large language models, build RAG pipelines, and ship AI features reaching millions daily.</p><p><strong>Stack:</strong> Python 3.11, PyTorch, HuggingFace, LangChain, OpenAI API, Pinecone, MLflow, AWS SageMaker.</p>',
      prefferdSkills: 'Python, PyTorch, Transformers, RAG, OpenAI API, LangChain, SQL, MLflow, Vector Databases',
      city: 'Bangalore', cities: [cities[2]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 2400000, salaryMax: 4000000, currency: 'INR',
      experience: 3, noOfJobs: 2,
      expiresAt: new Date(n + 30 * 86400000),
      isUrgent: true, urgentUntil: new Date(n + 10 * 86400000),
      viewsCount: 540, applicationsCount: 19, userpackageId: up1._id,
      aiJobSearchText: 'data scientist nlp llm python pytorch transformers langchain rag openai bangalore hybrid',
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'Engineering Manager – Platform',
      slug: 'engineering-manager-platform-tc',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[4]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['Leadership', 'Node.js', 'AWS', 'Agile', 'System Design'],
      status: 'approved',
      description: '<p>Lead a team of 10–12 engineers on TechCorps Platform squad. Own roadmap, architecture decisions, and engineering quality.</p>',
      prefferdSkills: 'Technical Leadership, System Design, Node.js, AWS, Agile, Hiring & Mentoring',
      city: 'Bangalore', cities: [cities[2]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 4000000, salaryMax: 7000000, currency: 'INR',
      experience: 8, noOfJobs: 1,
      expiresAt: new Date(n + 30 * 86400000),
      viewsCount: 310, applicationsCount: 7, userpackageId: up1._id,
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'HR Business Partner',
      slug: 'hr-business-partner-tc',
      categoryId: hrCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: depts[4]._id,
      tags: ['HR', 'Talent Acquisition', 'HRBP', 'Employee Engagement'],
      status: 'pending',
      description: '<p>Drive strategic HR initiatives as HRBP for Engineering and Product divisions at TechCorp.</p>',
      prefferdSkills: 'HR Business Partnering, Talent Acquisition, Performance Management, HRMS',
      city: 'Bangalore', cities: [cities[2]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 100000, salaryMax: 150000, currency: 'INR',
      experience: 3, noOfJobs: 1,
      expiresAt: new Date(n + 30 * 86400000),
      viewsCount: 0, applicationsCount: 0, userpackageId: up1._id,
    },
    {
      uid: emp1._id, companyId: co1._id,
      title: 'Senior Backend Engineer – Go',
      slug: 'senior-backend-engineer-go-tc',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['Go', 'gRPC', 'Kubernetes', 'PostgreSQL'],
      status: 'draft',
      description: '<p>Build next-gen microservices in Go. Own core payment and notification services.</p>',
      prefferdSkills: 'Go, gRPC, PostgreSQL, Redis, Kubernetes, Docker, Kafka',
      city: 'Bangalore', workplaceType: 'remote',
      hideSalaryRange: true, experience: 5, noOfJobs: 1,
      userpackageId: up1._id,
    },
    // ── InnovateMind ─────────────────────────────────────────────
    {
      uid: emp2._id, companyId: co2._id,
      title: 'React Native Developer',
      slug: 'react-native-developer-im',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: depts[6]._id,
      tags: ['React Native', 'JavaScript', 'iOS', 'Android', 'REST API'],
      status: 'approved',
      description: '<p>Build cross-platform mobile apps for e-commerce clients. Deliver polished iOS and Android apps from API integration to app store deployment.</p>',
      prefferdSkills: 'React Native, JavaScript, Redux Toolkit, REST APIs, Firebase, Push Notifications',
      city: 'Mumbai', cities: [cities[0]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 80000, salaryMax: 140000, currency: 'INR',
      experience: 2, noOfJobs: 2,
      expiresAt: new Date(n + 20 * 86400000),
      viewsCount: 195, applicationsCount: 10, userpackageId: up3._id,
      aiJobSearchText: 'react native developer javascript ios android mobile app mumbai onsite ecommerce',
    },
    {
      uid: emp2._id, companyId: co2._id,
      title: 'Digital Marketing Specialist',
      slug: 'digital-marketing-specialist-im',
      categoryId: mktCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: depts[6]._id,
      tags: ['SEO', 'Google Ads', 'Meta Ads', 'Analytics', 'Content Marketing'],
      status: 'approved',
      description: '<p>Drive growth for clients through data-driven digital marketing across SEO, PPC, social, and email. Manage ₹50L+ monthly ad spends and own ROAS targets.</p>',
      prefferdSkills: 'Google Ads, Meta Ads Manager, SEO, GA4, Google Tag Manager, Email Marketing, Copywriting',
      city: 'Mumbai', cities: [cities[0]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 60000, salaryMax: 100000, currency: 'INR',
      experience: 2, noOfJobs: 1,
      expiresAt: new Date(n + 18 * 86400000),
      viewsCount: 110, applicationsCount: 5, userpackageId: up3._id,
    },
    {
      uid: emp2._id, companyId: co2._id,
      title: 'UI/UX Designer – E-Commerce',
      slug: 'ui-ux-designer-ecommerce-im',
      categoryId: designCat, jobType: ptType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: depts[7]._id,
      tags: ['Figma', 'E-Commerce', 'Wireframing', 'User Research'],
      status: 'approved',
      description: '<p>Design exceptional shopping experiences for Indias top e-commerce brands across mobile and desktop for 5+ active client brands.</p>',
      prefferdSkills: 'Figma, Adobe XD, Wireframing, Prototyping, User Testing, Shopify, Responsive Design',
      city: 'Mumbai', cities: [cities[0]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 50000, salaryMax: 90000, currency: 'INR',
      experience: 1, noOfJobs: 1,
      expiresAt: new Date(n + 22 * 86400000),
      viewsCount: 78, applicationsCount: 4, userpackageId: up3._id,
      aiJobSearchText: 'ui ux designer figma ecommerce prototyping mumbai hybrid part time',
    },
  ]);
  logger.info(`✅ ${jobs.length} jobs (approved / pending / draft)`);

  const approvedJobs = jobs.filter(j => j.status === 'approved');

  // ═════════════════════════════════════════════════════════════════════════════
  // 15 · RESUMES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Resume);
  const [res1, res2] = await Resume.insertMany([
    {
      uid: js1._id,
      applicationTitle: 'Senior Full Stack Developer',
      firstName: 'Rahul', lastName: 'Verma',
      gender: 'male', emailAddress: 'jobseeker@hirehub.io', cell: '+91-9800000003',
      nationality: 'Indian',
      photo: { publicId: 'resumes/rahul/photo', secureUrl: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff&size=200' },
      jobCategory: itCat, jobType: ftType,
      keywords: 'Full Stack Developer, React, Node.js, MongoDB, AWS, TypeScript, Docker',
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript', 'Docker'],
      published: true, searchable: true, visibility: 'public', quickApply: true,
      resume: '<p>Results-driven Full Stack Developer with 5+ years building scalable web applications. Expert in React + Node.js. Led multiple product launches from 0 → 100K+ users.</p>',
      skills: 'React.js, Next.js, TypeScript, Node.js, Express.js, MongoDB, PostgreSQL, Redis, AWS (EC2 · S3 · Lambda · ECS), Docker, Kubernetes, GraphQL, REST APIs, Jest, Cypress, CI/CD',
      institutes: [{ institute: 'Indian Institute of Technology, Delhi', instituteCertificateName: 'Bachelor of Technology', instituteStudyArea: 'Computer Science & Engineering', fromDate: '2015', toDate: '2019' }],
      employers: [
        { employer: 'TechStartup Pvt Ltd', employerCity: 'Bangalore', employerPosition: 'Senior Software Engineer', employerFromDate: '2022-06', employerToDate: '', employerCurrentStatus: 1 },
        { employer: 'Infosys Ltd', employerCity: 'Bangalore', employerPosition: 'Software Engineer', employerFromDate: '2019-07', employerToDate: '2022-05', employerCurrentStatus: 0 },
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Hindi',   proficiency: 'native' },
        { language: 'Kannada', proficiency: 'beginner' },
      ],
      addresses: [{ address: 'Flat 302, Green Residency, Koramangala', addressCity: 'Bangalore', latitude: '12.9279', longitude: '77.6271' }],
      files: [{ publicId: 'resumes/rahul/cv', secureUrl: 'https://example.com/resumes/rahul-verma.pdf', filename: 'Rahul_Verma_CV_2024.pdf', filetype: 'application/pdf', filesize: 420000, uploadedAt: new Date(n - 5 * 86400000) }],
      isFeaturedResume: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(n + 14 * 86400000),
      atsScore: 84, completionPercentage: 92,
      hits: 258, viewsCount: 41, downloadCount: 6,
      aiResumeSearchText: 'senior full stack developer react nodejs typescript mongodb aws bangalore 5 years iit delhi',
      userpackageId: up2._id,
    },
    {
      uid: js2._id,
      applicationTitle: 'UI/UX Designer',
      firstName: 'Sneha', lastName: 'Kapoor',
      gender: 'female', emailAddress: 'sneha.jobseeker@hirehub.io', cell: '+91-9800000005',
      nationality: 'Indian',
      photo: { publicId: 'resumes/sneha/photo', secureUrl: 'https://ui-avatars.com/api/?name=Sneha+Kapoor&background=ec4899&color=fff&size=200' },
      jobCategory: designCat, jobType: ftType,
      keywords: 'UI UX Designer, Figma, Design Systems, User Research, Prototyping, Product Design',
      tags: ['Figma', 'UI/UX', 'Prototyping', 'Design System', 'Adobe XD', 'User Research'],
      published: true, searchable: true, visibility: 'public', quickApply: false,
      resume: '<p>Creative UI/UX Designer with 3 years crafting delightful digital experiences for mobile and web. Strong in user research, IA, and interaction design.</p>',
      skills: 'Figma, Adobe XD, Sketch, Prototyping, Wireframing, User Research, Usability Testing, Design Systems, HTML/CSS, Zeplin, Principle, Miro',
      institutes: [
        { institute: 'National Institute of Design, Ahmedabad', instituteCertificateName: 'Post Graduate Diploma', instituteStudyArea: 'Interaction Design', fromDate: '2019', toDate: '2021' },
        { institute: 'University of Mumbai', instituteCertificateName: 'Bachelor of Fine Arts', instituteStudyArea: 'Visual Communication', fromDate: '2016', toDate: '2019' },
      ],
      employers: [
        { employer: 'DesignStudio Co', employerCity: 'Mumbai', employerPosition: 'UI/UX Designer', employerFromDate: '2021-09', employerToDate: '', employerCurrentStatus: 1 },
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Hindi',   proficiency: 'native' },
        { language: 'Marathi', proficiency: 'native' },
      ],
      addresses: [{ address: 'A-14, Shiv Nagar Society, Andheri', addressCity: 'Mumbai', latitude: '19.1197', longitude: '72.8464' }],
      files: [{ publicId: 'resumes/sneha/cv', secureUrl: 'https://example.com/resumes/sneha-kapoor.pdf', filename: 'Sneha_Kapoor_Portfolio_2024.pdf', filetype: 'application/pdf', filesize: 650000, uploadedAt: new Date(n - 7 * 86400000) }],
      atsScore: 71, completionPercentage: 77,
      hits: 98, viewsCount: 17, downloadCount: 2,
      aiResumeSearchText: 'ui ux designer figma design systems user research mumbai 3 years nid ahmedabad',
      userpackageId: up4._id,
    },
  ]);
  logger.info('✅ 2 resumes');

  // ═════════════════════════════════════════════════════════════════════════════
  // 16 · COVER LETTERS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(CoverLetter);
  const [cl1, cl2, cl3] = await CoverLetter.insertMany([
    {
      uid: js1._id,
      title: 'General Cover Letter – Full Stack Developer', alias: 'general-fs-cover-letter',
      description: '<p>Dear Hiring Manager,</p><p>I am excited to apply for this Full Stack Developer role. With 5+ years in React and Node.js, I have built and scaled production systems serving hundreds of thousands of users. At my current company I led an API rewrite that cut latency by 40% and infrastructure costs by 25%.</p><p>Warm regards,<br/>Rahul Verma</p>',
      published: true, searchable: true, status: true, hits: 4,
    },
    {
      uid: js1._id,
      title: 'Startup Cover Letter – Engineering', alias: 'startup-eng-cover-letter',
      description: '<p>Dear Team,</p><p>I love building from scratch. I bring full-stack expertise, a bias for action, and the ability to wear multiple hats. Let\'s build something great together.</p><p>Rahul Verma</p>',
      published: true, searchable: false, status: true, hits: 1,
    },
    {
      uid: js2._id,
      title: 'Designer Cover Letter', alias: 'designer-cover-letter',
      description: '<p>Dear Hiring Manager,</p><p>As a UI/UX Designer with a background in visual communication, I bring both aesthetic sensibility and user-centred thinking. I am excited to contribute to your product design team.</p><p>Warm regards,<br/>Sneha Kapoor</p>',
      published: true, searchable: true, status: true, hits: 0,
    },
  ]);
  logger.info('✅ 3 cover letters');

  // ═════════════════════════════════════════════════════════════════════════════
  // 17 · APPLICATIONS  (flat interview fields per new Application model)
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Application);
  const ivDate1 = new Date(n + 3 * 86400000);
  const ivDate2 = new Date(n + 2 * 86400000);

  const [app1, app2, app3, app4, app5] = await Application.insertMany([
    {
      // Rahul → Senior Full Stack @ TechCorp — interview_scheduled
      jobId: approvedJobs[0]._id, uid: js1._id, cvId: res1._id, companyId: co1._id,
      applyMessage: 'I have been following TechCorp for years — perfect match for my React + Node.js background.',
      coverLetterId: cl1._id, quickApply: false,
      status: 'interview_scheduled', actionStatus: 3,
      statusHistory: [
        { status: 'applied',             note: 'Application submitted',             changedBy: js1._id,  changedAt: new Date(n - 5 * 86400000) },
        { status: 'reviewed',            note: 'Resume reviewed by HR',              changedBy: emp1._id, changedAt: new Date(n - 3 * 86400000) },
        { status: 'shortlisted',         note: 'Strong profile – shortlisted',       changedBy: emp1._id, changedAt: new Date(n - 86400000) },
        { status: 'interview_scheduled', note: 'Video interview Thu 3 PM',           changedBy: emp1._id, changedAt: new Date(n - 43200000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 3 * 86400000),
      rating: 4,
      employerNotes: 'IIT Delhi grad, strong React & Node portfolio. Must-call.',
      candidateNotes: 'First choice company. Very interested.',
      interviewDate: ivDate1,
      interviewType: 'video',
      interviewLink: 'https://meet.google.com/abc-defg-hij',
      interviewNotes: 'Round 1 – Technical with Platform TL (60 min). System design + coding.',
      interviewScheduledAt: new Date(n - 43200000),
      activityLog: [
        { action: 'apply',         description: 'Submitted application',  performedBy: js1._id,  ipAddress: '106.51.0.1',   createdAt: new Date(n - 5 * 86400000) },
        { action: 'resume_viewed', description: 'Employer viewed resume', performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 3 * 86400000) },
        { action: 'status_change', description: 'Shortlisted',            performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 86400000) },
        { action: 'status_change', description: 'Interview scheduled',    performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 43200000) },
      ],
      userpackageId: up2._id,
    },
    {
      // Rahul → Data Scientist @ TechCorp — applied
      jobId: approvedJobs[3]._id, uid: js1._id, cvId: res1._id, companyId: co1._id,
      applyMessage: '2+ years NLP work, hands-on with Transformers, LangChain, and RAG pipelines.',
      quickApply: true, status: 'applied', actionStatus: 1,
      statusHistory: [{ status: 'applied', note: 'Quick apply', changedBy: js1._id, changedAt: new Date(n - 2 * 86400000) }],
      resumeView: false, rating: 0,
      activityLog: [{ action: 'apply', description: 'Quick apply submitted', performedBy: js1._id, ipAddress: '106.51.0.1', createdAt: new Date(n - 2 * 86400000) }],
      userpackageId: up2._id,
    },
    {
      // Rahul → React Native @ InnovateMind — reviewed
      jobId: approvedJobs[7]._id, uid: js1._id, cvId: res1._id, companyId: co2._id,
      applyMessage: '3 React Native apps in production with 50K+ downloads each.',
      coverLetterId: cl2._id, quickApply: false,
      status: 'reviewed', actionStatus: 2,
      statusHistory: [
        { status: 'applied',  note: 'Application submitted', changedBy: js1._id,  changedAt: new Date(n - 8 * 86400000) },
        { status: 'reviewed', note: 'Under review',          changedBy: emp2._id, changedAt: new Date(n - 5 * 86400000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 5 * 86400000), rating: 3,
      activityLog: [
        { action: 'apply',         description: 'Application submitted', performedBy: js1._id,  ipAddress: '106.51.0.1',  createdAt: new Date(n - 8 * 86400000) },
        { action: 'resume_viewed', description: 'Resume viewed',         performedBy: emp2._id, ipAddress: '122.160.0.1', createdAt: new Date(n - 5 * 86400000) },
      ],
      userpackageId: up2._id,
    },
    {
      // Sneha → Product Designer @ TechCorp — interview_scheduled
      jobId: approvedJobs[2]._id, uid: js2._id, cvId: res2._id, companyId: co1._id,
      applyMessage: 'Product design is my passion. TechCorps design culture deeply resonates with me.',
      coverLetterId: cl3._id, quickApply: false,
      status: 'interview_scheduled', actionStatus: 3,
      statusHistory: [
        { status: 'applied',             note: 'Applied',                     changedBy: js2._id,  changedAt: new Date(n - 10 * 86400000) },
        { status: 'reviewed',            note: 'Reviewed',                    changedBy: emp1._id, changedAt: new Date(n - 7 * 86400000) },
        { status: 'shortlisted',         note: 'Excellent Figma portfolio',   changedBy: emp1._id, changedAt: new Date(n - 5 * 86400000) },
        { status: 'interview_scheduled', note: 'Design challenge + HR round', changedBy: emp1._id, changedAt: new Date(n - 86400000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 7 * 86400000), rating: 4,
      employerNotes: 'NID grad. Excellent Figma portfolio. Strong candidate.',
      interviewDate: ivDate2,
      interviewType: 'video',
      interviewLink: 'https://zoom.us/j/1234567890',
      interviewNotes: 'Design challenge (1 hr) + HR conversation (30 min).',
      interviewScheduledAt: new Date(n - 86400000),
      activityLog: [
        { action: 'apply',         description: 'Applied',            performedBy: js2._id,  ipAddress: '115.240.0.1', createdAt: new Date(n - 10 * 86400000) },
        { action: 'resume_viewed', description: 'Resume viewed',      performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 7 * 86400000) },
        { action: 'status_change', description: 'Shortlisted',        performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 5 * 86400000) },
        { action: 'status_change', description: 'Interview scheduled',performedBy: emp1._id, ipAddress: '49.205.1.100', createdAt: new Date(n - 86400000) },
      ],
      userpackageId: up4._id,
    },
    {
      // Sneha → UI/UX Designer @ InnovateMind — applied
      jobId: approvedJobs[approvedJobs.length - 1]._id, uid: js2._id, cvId: res2._id, companyId: co2._id,
      applyMessage: 'I love e-commerce design challenges and would be thrilled to join InnovateMind.',
      quickApply: true, status: 'applied', actionStatus: 1,
      statusHistory: [{ status: 'applied', note: 'Quick apply', changedBy: js2._id, changedAt: new Date(n - 86400000) }],
      resumeView: false, rating: 0,
      activityLog: [{ action: 'apply', description: 'Quick apply', performedBy: js2._id, ipAddress: '115.240.0.1', createdAt: new Date(n - 86400000) }],
      userpackageId: up4._id,
    },
  ]);
  logger.info('✅ 5 applications');

  // ═════════════════════════════════════════════════════════════════════════════
  // 18 · JOB SHORTLIST
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(JobShortlist);
  await JobShortlist.insertMany([
    { uid: js1._id, jobId: approvedJobs[1]._id, comments: 'DevOps role – looks perfect!',          rate: '5', status: true },
    { uid: js1._id, jobId: approvedJobs[4]._id, comments: 'Engineering Manager – stretch goal',    rate: '4', status: true },
    { uid: js1._id, jobId: approvedJobs[3]._id, comments: 'Data Science – interesting stretch',    rate: '4', status: true },
    { uid: js2._id, jobId: approvedJobs[2]._id, comments: 'Already applied, tracking progress',    rate: '5', status: true },
    { uid: js2._id, jobId: approvedJobs[approvedJobs.length - 1]._id, comments: 'Part-time option',                       rate: '3', status: true },
  ]);
  logger.info('✅ Job shortlists');

  // ═════════════════════════════════════════════════════════════════════════════
  // 19 · JOB ALERTS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(JobAlert);
  await JobAlert.insertMany([
    { uid: js1._id, categoryId: itCat, name: 'Full Stack Jobs – Bangalore', contactEmail: 'jobseeker@hirehub.io', city: 'Bangalore', keywords: 'full stack react nodejs typescript', alertType: 1, status: 1, sendTime: new Date(n + 86400000), userpackageId: up2._id },
    { uid: js1._id, categoryId: itCat, name: 'Remote DevOps Roles', contactEmail: 'jobseeker@hirehub.io', keywords: 'devops aws kubernetes remote', alertType: 2, status: 1, sendTime: new Date(n + 7 * 86400000), userpackageId: up2._id },
    { uid: js2._id, categoryId: designCat, name: 'UI/UX Designer – Mumbai', contactEmail: 'sneha.jobseeker@hirehub.io', city: 'Mumbai', keywords: 'ui ux designer figma product design', alertType: 1, status: 1, sendTime: new Date(n + 86400000), userpackageId: up4._id },
  ]);
  logger.info('✅ Job alerts');

  // ═════════════════════════════════════════════════════════════════════════════
  // 20 · FOLLOWERS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Follower);
  await Follower.insertMany([
    { followerId: js1._id, companyId: co1._id },
    { followerId: js1._id, companyId: co2._id },
    { followerId: js2._id, companyId: co1._id },
  ]);
  logger.info('✅ Followers');

  // ═════════════════════════════════════════════════════════════════════════════
  // 21 · EMPLOYER VIEW RESUME
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(EmployerViewResume);
  await EmployerViewResume.insertMany([
    { uid: emp1._id, resumeId: res1._id, profileId: js1._id, status: true, userpackageId: up1._id },
    { uid: emp1._id, resumeId: res2._id, profileId: js2._id, status: true, userpackageId: up1._id },
    { uid: emp2._id, resumeId: res1._id, profileId: js1._id, status: true, userpackageId: up3._id },
  ]);
  logger.info('✅ Employer resume views');

  // ═════════════════════════════════════════════════════════════════════════════
  // 22 · SAVED SEARCHES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(SavedSearch);
  await SavedSearch.insertMany([
    { uid: js1._id,  searchName: 'React Jobs Bangalore',    status: true, searchParams: { keyword: 'react', city: 'Bangalore' },               userpackageId: up2._id },
    { uid: js1._id,  searchName: 'Remote Senior Roles',     status: true, searchParams: { workplaceType: 'remote', experience: 4 },             userpackageId: up2._id },
    { uid: emp1._id, searchName: 'Senior Developers India', status: true, searchParams: { keyword: 'senior developer', experience: 4 },         userpackageId: up1._id },
    { uid: emp1._id, searchName: 'UI/UX Designers Mumbai',  status: true, searchParams: { keyword: 'ui ux designer', city: 'Mumbai' },          userpackageId: up1._id },
  ]);
  logger.info('✅ Saved searches');

  // ═════════════════════════════════════════════════════════════════════════════
  // 23 · FOLDERS + FOLDER RESUMES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Folder, FolderResume);
  const [fol1, fol2] = await Folder.insertMany([
    { uid: emp1._id, jobId: approvedJobs[0]._id, name: 'Senior Full Stack – Shortlisted', alias: 'sfs-shortlisted', description: 'Shortlisted for Senior Full Stack role', status: true },
    { uid: emp1._id, global: true, name: 'Top Candidates 2025', alias: 'top-candidates-2025', description: 'Global pool of top candidates', status: true },
  ]);
  await FolderResume.insertMany([
    { uid: emp1._id, jobId: approvedJobs[0]._id, resumeId: res1._id, folderId: fol1._id },
    { uid: emp1._id, resumeId: res1._id, folderId: fol2._id },
    { uid: emp1._id, resumeId: res2._id, folderId: fol2._id },
  ]);
  logger.info('✅ Folders + folder resumes');

  // ═════════════════════════════════════════════════════════════════════════════
  // 24 · CONVERSATIONS + MESSAGES
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Conversation, Message);

  const conv1 = await new Conversation({
    participants: [emp1._id, js1._id],
    jobId: approvedJobs[0]._id,
    employerId: emp1._id, jobseekerId: js1._id,
    lastMessageText: 'Here is the video call link. Good luck!',
    lastMessageAt: new Date(n - 1800000),
    unreadCount: new Map([[js1._id.toString(), 1]]),
  }).save();

  const msgs1 = await Message.insertMany([
    {
      conversationId: conv1._id, sendBy: emp1._id, employerId: emp1._id, jobseekerId: js1._id, jobId: approvedJobs[0]._id,
      subject: 'Re: Application – Senior Full Stack Developer',
      message: 'Hi Rahul! We reviewed your profile and are very impressed. We would love to schedule a 60-minute technical interview. Are you available this Thursday at 3 PM IST?',
      isRead: true, readBy: [js1._id], readAt: new Date(n - 7200000),
      status: true, createdAt: new Date(n - 10800000),
    },
    {
      conversationId: conv1._id, sendBy: js1._id, employerId: emp1._id, jobseekerId: js1._id, jobId: approvedJobs[0]._id,
      message: 'Hi Priya! Thank you so much — really excited! Thursday 3 PM works perfectly. Looking forward to it!',
      isRead: true, readBy: [emp1._id], readAt: new Date(n - 3600000),
      status: true, createdAt: new Date(n - 7200000),
    },
    {
      conversationId: conv1._id, sendBy: emp1._id, employerId: emp1._id, jobseekerId: js1._id, jobId: approvedJobs[0]._id,
      message: 'Here is the video call link. Good luck! https://meet.google.com/abc-defg-hij — Interview is with our Platform Team Lead.',
      isRead: false, status: true, createdAt: new Date(n - 1800000),
    },
  ]);
  await Conversation.findByIdAndUpdate(conv1._id, { lastMessage: msgs1[2]._id });

  const conv2 = await new Conversation({
    participants: [emp2._id, js2._id],
    jobId: approvedJobs[approvedJobs.length - 1]._id,
    employerId: emp2._id, jobseekerId: js2._id,
    lastMessageText: 'Please share your Figma portfolio link.',
    lastMessageAt: new Date(n - 14400000),
    unreadCount: new Map([[js2._id.toString(), 1]]),
  }).save();

  const msg2 = await Message.create({
    conversationId: conv2._id, sendBy: emp2._id, employerId: emp2._id, jobseekerId: js2._id, jobId: approvedJobs[approvedJobs.length - 1]._id,
    subject: 'Re: UI/UX Designer Application',
    message: 'Hi Sneha! Great profile. Before we proceed, could you please share your Figma portfolio link? We would love to review some of your recent work.',
    isRead: false, status: true, createdAt: new Date(n - 14400000),
  });
  await Conversation.findByIdAndUpdate(conv2._id, { lastMessage: msg2._id });

  logger.info('✅ 2 conversations + 4 messages');

  // ═════════════════════════════════════════════════════════════════════════════
  // 25 · NOTIFICATIONS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Notification);
  await Notification.insertMany([
    // Employer 1
    { recipientId: emp1._id, senderId: js1._id,  type: 'application_received', title: 'New Application – Senior Full Stack',   message: 'Rahul Verma applied for Senior Full Stack Developer.',             refModel: 'Application', refId: app1._id, isRead: false, channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/employer/applications/${app1._id}`, actionText: 'View Application' },
    { recipientId: emp1._id, senderId: js1._id,  type: 'application_received', title: 'New Application – Data Scientist',       message: 'Rahul Verma applied for Data Scientist – NLP & LLMs.',            refModel: 'Application', refId: app2._id, isRead: true, readAt: new Date(n - 3600000), channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/employer/applications/${app2._id}`, actionText: 'View Application' },
    { recipientId: emp1._id, senderId: js2._id,  type: 'application_received', title: 'New Application – Product Designer',     message: 'Sneha Kapoor applied for Product Designer (UI/UX).',              refModel: 'Application', refId: app4._id, isRead: true, readAt: new Date(n - 7200000), channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/employer/applications/${app4._id}`, actionText: 'View Application' },
    { recipientId: emp1._id,                     type: 'package_expiry',        title: 'Package Expires Soon',                   message: 'Your Employer Pro package expires in 7 days. Renew to keep posting.', refModel: 'Package', isRead: false, channels: { inApp: true, email: true }, emailSent: true, actionUrl: '/employer/packages', actionText: 'Renew Package' },
    // Jobseeker 1
    { recipientId: js1._id,  senderId: emp1._id, type: 'shortlisted',          title: 'You\'ve been Shortlisted! 🎉',            message: 'TechCorp Solutions shortlisted you for Senior Full Stack Developer.', refModel: 'Application', refId: app1._id, isRead: false, channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/jobseeker/applications/${app1._id}`, actionText: 'View Details' },
    { recipientId: js1._id,  senderId: emp1._id, type: 'interview_scheduled',  title: 'Interview Scheduled',                    message: `Your interview for Senior Full Stack at TechCorp is on ${ivDate1.toDateString()}.`, refModel: 'Application', refId: app1._id, isRead: false, channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/jobseeker/applications/${app1._id}`, actionText: 'View Interview' },
    { recipientId: js1._id,                      type: 'job_alert',             title: 'New Jobs Matching Your Alert',           message: '4 new jobs match "Full Stack Jobs – Bangalore". Check them out!',  isRead: true, readAt: new Date(n - 7200000), channels: { inApp: true, email: true }, emailSent: true, actionUrl: '/jobs?keyword=full+stack&city=Bangalore', actionText: 'View Jobs' },
    { recipientId: js1._id,  senderId: emp1._id, type: 'message_received',     title: 'New Message from TechCorp',              message: 'Priya Mehta sent you a message about your application.',           refModel: 'Message', refId: msgs1[0]._id, isRead: true, readAt: new Date(n - 3600000), channels: { inApp: true }, actionUrl: `/jobseeker/messages/${conv1._id}`, actionText: 'Read Message' },
    // Jobseeker 2
    { recipientId: js2._id,  senderId: emp1._id, type: 'interview_scheduled',  title: 'Interview Scheduled! 🎉',                message: 'TechCorp scheduled your interview for Product Designer.',          refModel: 'Application', refId: app4._id, isRead: false, channels: { inApp: true, email: true }, emailSent: true, actionUrl: `/jobseeker/applications/${app4._id}`, actionText: 'View Details' },
    { recipientId: js2._id,  senderId: emp2._id, type: 'message_received',     title: 'New Message from InnovateMind',          message: 'Vikram Singh sent you a message about your UI/UX application.',   refModel: 'Message', refId: msg2._id, isRead: false, channels: { inApp: true }, actionUrl: `/jobseeker/messages/${conv2._id}`, actionText: 'Read Message' },
    // Admin
    { recipientId: admin._id,                    type: 'system',                title: 'New Employer Registration',              message: 'InnovateMind Digital registered and is pending review.',           refModel: 'Company', refId: co2._id, isRead: false, channels: { inApp: true }, actionUrl: `/admin/companies/${co2._id}`, actionText: 'Review Company' },
    { recipientId: admin._id,                    type: 'payment_success',       title: 'Package Purchased – ₹2,999',             message: 'Priya Mehta purchased Employer Pro.',                             refModel: 'Invoice', refId: inv1._id, isRead: true, readAt: new Date(n - 5 * 86400000), channels: { inApp: true }, actionUrl: `/admin/invoices/${inv1._id}`, actionText: 'View Invoice' },
  ]);
  logger.info('✅ 12 notifications');

  // ═════════════════════════════════════════════════════════════════════════════
  // 26 · ACTIVITY LOG
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(ActivityLog);
  await ActivityLog.insertMany([
    { uid: admin._id,  performedBy: admin._id,  description: 'Admin logged in',                          action: 'login',          ipAddress: '127.0.0.1',    browser: 'Chrome',  os: 'Windows' },
    { uid: admin._id,  performedBy: admin._id,  description: 'TechCorp verified',                         action: 'company_verify', ipAddress: '127.0.0.1',    referenceFor: 'Company',      referenceId: co1._id },
    { uid: admin._id,  performedBy: admin._id,  description: 'InnovateMind verified',                     action: 'company_verify', ipAddress: '127.0.0.1',    referenceFor: 'Company',      referenceId: co2._id },
    { uid: emp1._id,   performedBy: emp1._id,   description: 'Employer logged in',                        action: 'login',          ipAddress: '49.205.1.100', browser: 'Chrome',  os: 'macOS' },
    { uid: emp1._id,   performedBy: emp1._id,   description: 'Posted: Senior Full Stack Developer',        action: 'job_post',       ipAddress: '49.205.1.100', referenceFor: 'Job', referenceId: jobs[0]._id },
    { uid: emp1._id,   performedBy: emp1._id,   description: 'Posted: DevOps Engineer',                   action: 'job_post',       ipAddress: '49.205.1.100', referenceFor: 'Job', referenceId: jobs[1]._id },
    { uid: emp1._id,   performedBy: emp1._id,   description: 'Purchased Employer Pro package',             action: 'package_buy',    ipAddress: '49.205.1.100', referenceFor: 'Invoice', referenceId: inv1._id },
    { uid: js1._id,    performedBy: js1._id,    description: 'Jobseeker logged in',                       action: 'login',          ipAddress: '106.51.0.1',   browser: 'Chrome',  os: 'Android' },
    { uid: js1._id,    performedBy: js1._id,    description: 'Applied: Senior Full Stack Developer',       action: 'job_apply',      ipAddress: '106.51.0.1',   referenceFor: 'Application', referenceId: app1._id },
    { uid: js1._id,    performedBy: js1._id,    description: 'Applied: Data Scientist – NLP & LLMs',      action: 'job_apply',      ipAddress: '106.51.0.1',   referenceFor: 'Application', referenceId: app2._id },
    { uid: js1._id,    performedBy: js1._id,    description: 'Saved job: DevOps Engineer',                 action: 'job_save',       ipAddress: '106.51.0.1',   referenceFor: 'Job', referenceId: jobs[1]._id },
    { uid: js1._id,    performedBy: js1._id,    description: 'Purchased Jobseeker Premium',                action: 'package_buy',    ipAddress: '106.51.0.1',   referenceFor: 'Invoice', referenceId: inv2._id },
    { uid: js2._id,    performedBy: js2._id,    description: 'Jobseeker Sneha logged in',                  action: 'login',          ipAddress: '115.240.0.1',  browser: 'Safari',  os: 'iOS' },
    { uid: js2._id,    performedBy: js2._id,    description: 'Applied: Product Designer (UI/UX)',          action: 'job_apply',      ipAddress: '115.240.0.1',  referenceFor: 'Application', referenceId: app4._id },
    { uid: emp2._id,   performedBy: emp2._id,   description: 'Employer Vikram logged in',                  action: 'login',          ipAddress: '122.160.0.1',  browser: 'Firefox', os: 'Windows' },
  ]);
  logger.info('✅ Activity logs');

  // ═════════════════════════════════════════════════════════════════════════════
  // 27 · REPORTS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(Report);
  await Report.insertMany([
    { reportedBy: js1._id, refModel: 'Job', refId: approvedJobs[7]._id, reason: 'Misleading salary range', description: 'Salary in listing differs from what was communicated during phone screen.', status: 'pending' },
    { reportedBy: js2._id, refModel: 'Company', refId: co2._id, reason: 'No response to applications', description: 'Applied 3 weeks ago with follow-ups — zero response.', status: 'reviewed', reviewedBy: admin._id, reviewNote: 'Contacted company. Informed to respond within 48 hours.' },
  ]);
  logger.info('✅ Reports');

  // ═════════════════════════════════════════════════════════════════════════════
  // 28 · SYSTEM ERRORS
  // ═════════════════════════════════════════════════════════════════════════════
  await wipe(SystemError);
  await SystemError.insertMany([
    { error: 'MongoServerError: E11000 duplicate key – hirehub.applications index: jobId_1_uid_1', isView: true },
    { uid: emp1._id, error: 'CloudinaryError: File size exceeds maximum allowed (10MB)', isView: false },
  ]);
  logger.info('✅ System errors');

  // ═════════════════════════════════════════════════════════════════════════════
  logger.info('');
  logger.info('🎉 ══════════════════════════════════════');
  logger.info('🎉  FULL SEED COMPLETE');
  logger.info('🎉 ══════════════════════════════════════');
  logger.info('');
  logger.info('📋  Login credentials  (password: Pass@123456)');
  logger.info('    👑 Admin       → admin@hirehub.io');
  logger.info('    🏢 Employer 1  → employer@hirehub.io         (TechCorp Solutions, Pro pkg)');
  logger.info('    🏢 Employer 2  → vikram.employer@hirehub.io  (InnovateMind Digital, Basic pkg)');
  logger.info('    👤 Jobseeker 1 → jobseeker@hirehub.io         (Rahul Verma – Full Stack Dev, Premium pkg)');
  logger.info('    👤 Jobseeker 2 → sneha.jobseeker@hirehub.io   (Sneha Kapoor – UI/UX Designer, Free pkg)');
  logger.info('');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});