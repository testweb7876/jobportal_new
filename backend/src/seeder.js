require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Logger fallback ────────────────────────────────────────────────────────────
let logger;
try { logger = require('./config/logger'); }
catch { logger = { info: console.log, error: console.error, warn: console.warn }; }

// ── DB connect ─────────────────────────────────────────────────────────────────
let connectDB;
try { connectDB = require('./config/database'); }
catch {
  connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
const seed = async () => {
  await connectDB();
  logger.info('🌱 Starting full realistic seed...');

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
    Folder, FolderResume, SystemError, Setting,
  } = require('./models/Misc.model');

  // ── Wipe all collections ───────────────────────────────────────────────────────
  const wipe = async (...models) => {
    for (const m of models) {
      try { await m.deleteMany({}); } catch { /* skip */ }
    }
  };

  await wipe(
    User, RefreshToken, Job, Resume, Company, Application, Package,
    UserPackage, Invoice, TransactionLog, Subscription,
    Conversation, Message, Notification,
    Category, JobType, CareerLevel, Education, SalaryRangeType,
    Currency, Country, State, City, Department, CoverLetter,
    JobAlert, JobShortlist, ActivityLog, Tag, Follower, Report,
    EmployerViewResume, SavedSearch, Folder, FolderResume, SystemError, Setting
  );

  logger.info('🗑️  All collections wiped.');

  // ═════════════════════════════════════════════════════════════════════════════
  // 1 · CURRENCIES
  // ═════════════════════════════════════════════════════════════════════════════
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
  const parentCats = await Category.insertMany([
    { catTitle: 'Information Technology',  alias: 'information-technology', isActive: true, ordering: 1,  parentId: null },
    { catTitle: 'Marketing & Sales',       alias: 'marketing-sales',        isActive: true, ordering: 2,  parentId: null },
    { catTitle: 'Finance & Accounting',    alias: 'finance-accounting',     isActive: true, ordering: 3,  parentId: null },
    { catTitle: 'Human Resources',         alias: 'human-resources',        isActive: true, ordering: 4,  parentId: null },
    { catTitle: 'Engineering',             alias: 'engineering',            isActive: true, ordering: 5,  parentId: null },
    { catTitle: 'Healthcare & Pharma',     alias: 'healthcare-pharma',      isActive: true, ordering: 6,  parentId: null },
    { catTitle: 'Education & Training',    alias: 'education-training',     isActive: true, ordering: 7,  parentId: null },
    { catTitle: 'Design & Creative',       alias: 'design-creative',        isActive: true, ordering: 8,  parentId: null },
    { catTitle: 'Operations & Logistics',  alias: 'operations-logistics',   isActive: true, ordering: 9,  parentId: null },
    { catTitle: 'Customer Support',        alias: 'customer-support',       isActive: true, ordering: 10, parentId: null },
    { catTitle: 'Sales & Business Dev',    alias: 'sales-business',         isActive: true, ordering: 11, parentId: null },
    { catTitle: 'Legal & Compliance',      alias: 'legal-compliance',       isActive: true, ordering: 12, parentId: null },
  ]);

  await Category.insertMany([
    // IT sub-categories
    { catTitle: 'Software Development',    alias: 'software-development',   isActive: true, ordering: 1, parentId: parentCats[0]._id },
    { catTitle: 'Data Science & AI',       alias: 'data-science-ai',        isActive: true, ordering: 2, parentId: parentCats[0]._id },
    { catTitle: 'DevOps & Cloud',          alias: 'devops-cloud',           isActive: true, ordering: 3, parentId: parentCats[0]._id },
    { catTitle: 'Mobile Development',      alias: 'mobile-development',     isActive: true, ordering: 4, parentId: parentCats[0]._id },
    { catTitle: 'Cybersecurity',           alias: 'cybersecurity',          isActive: true, ordering: 5, parentId: parentCats[0]._id },
    { catTitle: 'QA & Testing',            alias: 'qa-testing',             isActive: true, ordering: 6, parentId: parentCats[0]._id },
    // Design sub-categories
    { catTitle: 'UI/UX Design',            alias: 'ui-ux-design',           isActive: true, ordering: 1, parentId: parentCats[7]._id },
    { catTitle: 'Graphic Design',          alias: 'graphic-design',         isActive: true, ordering: 2, parentId: parentCats[7]._id },
    { catTitle: 'Motion Graphics',         alias: 'motion-graphics',        isActive: true, ordering: 3, parentId: parentCats[7]._id },
    // Marketing sub-categories
    { catTitle: 'Performance Marketing',   alias: 'performance-marketing',  isActive: true, ordering: 1, parentId: parentCats[1]._id },
    { catTitle: 'Content & SEO',           alias: 'content-seo',            isActive: true, ordering: 2, parentId: parentCats[1]._id },
    { catTitle: 'Brand Marketing',         alias: 'brand-marketing',        isActive: true, ordering: 3, parentId: parentCats[1]._id },
  ]);
  logger.info(`✅ ${parentCats.length} parent categories + sub-categories`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 3 · JOB TYPES
  // ═════════════════════════════════════════════════════════════════════════════
  const jobTypes = await JobType.insertMany([
    { title: 'Full Time',  alias: 'full-time',  color: '#059669', isActive: true, status: true, ordering: 1 },
    { title: 'Part Time',  alias: 'part-time',  color: '#2563eb', isActive: true, status: true, ordering: 2 },
    { title: 'Contract',   alias: 'contract',   color: '#d97706', isActive: true, status: true, ordering: 3 },
    { title: 'Internship', alias: 'internship', color: '#7c3aed', isActive: true, status: true, ordering: 4 },
    { title: 'Freelance',  alias: 'freelance',  color: '#db2777', isActive: true, status: true, ordering: 5 },
    { title: 'Remote',     alias: 'remote',     color: '#0891b2', isActive: true, status: true, ordering: 6 },
  ]);
  logger.info(`✅ ${jobTypes.length} job types`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 4 · CAREER LEVELS
  // ═════════════════════════════════════════════════════════════════════════════
  const careerLevels = await CareerLevel.insertMany([
    { title: 'Student / Intern',  status: true, ordering: 1 },
    { title: 'Entry Level (0–2 yrs)', status: true, ordering: 2 },
    { title: 'Mid Level (2–5 yrs)',   status: true, ordering: 3 },
    { title: 'Senior Level (5+ yrs)', status: true, ordering: 4 },
    { title: 'Team Lead',         status: true, ordering: 5 },
    { title: 'Manager',           status: true, ordering: 6 },
    { title: 'Senior Manager',    status: true, ordering: 7 },
    { title: 'Director',          status: true, ordering: 8 },
    { title: 'VP / C-Level',      status: true, ordering: 9 },
    { title: 'Executive',         status: true, ordering: 10 },
  ]);
  logger.info(`✅ ${careerLevels.length} career levels`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 5 · EDUCATION
  // ═════════════════════════════════════════════════════════════════════════════
  const educations = await Education.insertMany([
    { title: 'High School / 12th',         isActive: true, ordering: 1 },
    { title: 'Diploma / ITI',              isActive: true, ordering: 2 },
    { title: "Bachelor's Degree (B.Tech / B.E / BCA / B.Sc)", isActive: true, ordering: 3, isDefault: true },
    { title: "Master's Degree (M.Tech / MCA / MBA / M.Sc)",   isActive: true, ordering: 4 },
    { title: 'PhD / Doctorate',            isActive: true, ordering: 5 },
    { title: 'Professional Certification', isActive: true, ordering: 6 },
    { title: 'Any Graduate',               isActive: true, ordering: 7 },
    { title: 'Any Postgraduate',           isActive: true, ordering: 8 },
  ]);
  logger.info(`✅ ${educations.length} education levels`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 6 · SALARY RANGE TYPES
  // ═════════════════════════════════════════════════════════════════════════════
  const salaryTypes = await SalaryRangeType.insertMany([
    { title: 'Per Month',  status: true, ordering: 1, isDefault: true },
    { title: 'Per Annum',  status: true, ordering: 2 },
    { title: 'Per Hour',   status: true, ordering: 3 },
    { title: 'Per Day',    status: true, ordering: 4 },
    { title: 'Fixed CTC',  status: true, ordering: 5 },
  ]);
  logger.info(`✅ ${salaryTypes.length} salary range types`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 7 · COUNTRIES → STATES → CITIES
  // ═════════════════════════════════════════════════════════════════════════════
  const [india, usa, uk, uae, singapore] = await Country.insertMany([
    { name: 'India',                nameCode: 'IN', shortCountry: 'IND', dialCode: 91,  enabled: true },
    { name: 'United States',        nameCode: 'US', shortCountry: 'USA', dialCode: 1,   enabled: true },
    { name: 'United Kingdom',       nameCode: 'GB', shortCountry: 'GBR', dialCode: 44,  enabled: true },
    { name: 'United Arab Emirates', nameCode: 'AE', shortCountry: 'ARE', dialCode: 971, enabled: true },
    { name: 'Singapore',            nameCode: 'SG', shortCountry: 'SGP', dialCode: 65,  enabled: true },
    { name: 'Germany',              nameCode: 'DE', shortCountry: 'DEU', dialCode: 49,  enabled: true },
    { name: 'Canada',               nameCode: 'CA', shortCountry: 'CAN', dialCode: 1,   enabled: true },
    { name: 'Australia',            nameCode: 'AU', shortCountry: 'AUS', dialCode: 61,  enabled: true },
  ]);

  const [mh, ka, dl, tn, tel, guj, wb, pb, ca, ny, tx] = await State.insertMany([
    { name: 'Maharashtra',      shortRegion: 'MH',  countryId: india._id, enabled: true },
    { name: 'Karnataka',        shortRegion: 'KA',  countryId: india._id, enabled: true },
    { name: 'Delhi',            shortRegion: 'DL',  countryId: india._id, enabled: true },
    { name: 'Tamil Nadu',       shortRegion: 'TN',  countryId: india._id, enabled: true },
    { name: 'Telangana',        shortRegion: 'TS',  countryId: india._id, enabled: true },
    { name: 'Gujarat',          shortRegion: 'GJ',  countryId: india._id, enabled: true },
    { name: 'West Bengal',      shortRegion: 'WB',  countryId: india._id, enabled: true },
    { name: 'Punjab',           shortRegion: 'PB',  countryId: india._id, enabled: true },
    { name: 'California',       shortRegion: 'CA',  countryId: usa._id,   enabled: true },
    { name: 'New York',         shortRegion: 'NY',  countryId: usa._id,   enabled: true },
    { name: 'Texas',            shortRegion: 'TX',  countryId: usa._id,   enabled: true },
  ]);

  const cities = await City.insertMany([
    { name: 'Mumbai',         cityName: 'Mumbai',         stateId: mh._id,  countryId: india._id, enabled: true, latitude: '19.0760', longitude: '72.8777' },
    { name: 'Pune',           cityName: 'Pune',           stateId: mh._id,  countryId: india._id, enabled: true, latitude: '18.5204', longitude: '73.8567' },
    { name: 'Bengaluru',      cityName: 'Bengaluru',      stateId: ka._id,  countryId: india._id, enabled: true, latitude: '12.9716', longitude: '77.5946' },
    { name: 'Mysuru',         cityName: 'Mysuru',         stateId: ka._id,  countryId: india._id, enabled: true, latitude: '12.2958', longitude: '76.6394' },
    { name: 'New Delhi',      cityName: 'New Delhi',      stateId: dl._id,  countryId: india._id, enabled: true, latitude: '28.6139', longitude: '77.2090' },
    { name: 'Noida',          cityName: 'Noida',          stateId: dl._id,  countryId: india._id, enabled: true, latitude: '28.5355', longitude: '77.3910' },
    { name: 'Chennai',        cityName: 'Chennai',        stateId: tn._id,  countryId: india._id, enabled: true, latitude: '13.0827', longitude: '80.2707' },
    { name: 'Coimbatore',     cityName: 'Coimbatore',     stateId: tn._id,  countryId: india._id, enabled: true, latitude: '11.0168', longitude: '76.9558' },
    { name: 'Hyderabad',      cityName: 'Hyderabad',      stateId: tel._id, countryId: india._id, enabled: true, latitude: '17.3850', longitude: '78.4867' },
    { name: 'Ahmedabad',      cityName: 'Ahmedabad',      stateId: guj._id, countryId: india._id, enabled: true, latitude: '23.0225', longitude: '72.5714' },
    { name: 'Kolkata',        cityName: 'Kolkata',        stateId: wb._id,  countryId: india._id, enabled: true, latitude: '22.5726', longitude: '88.3639' },
    { name: 'Chandigarh',     cityName: 'Chandigarh',     stateId: pb._id,  countryId: india._id, enabled: true, latitude: '30.7333', longitude: '76.7794' },
    { name: 'San Francisco',  cityName: 'San Francisco',  stateId: ca._id,  countryId: usa._id,   enabled: true, latitude: '37.7749', longitude: '-122.4194' },
    { name: 'New York City',  cityName: 'New York City',  stateId: ny._id,  countryId: usa._id,   enabled: true, latitude: '40.7128', longitude: '-74.0060' },
    { name: 'Austin',         cityName: 'Austin',         stateId: tx._id,  countryId: usa._id,   enabled: true, latitude: '30.2672', longitude: '-97.7431' },
    { name: 'London',         cityName: 'London',         stateId: null,    countryId: uk._id,    enabled: true, latitude: '51.5074', longitude: '-0.1278' },
    { name: 'Dubai',          cityName: 'Dubai',          stateId: null,    countryId: uae._id,   enabled: true, latitude: '25.2048', longitude: '55.2708' },
    { name: 'Singapore City', cityName: 'Singapore City', stateId: null,    countryId: singapore._id, enabled: true, latitude: '1.3521', longitude: '103.8198' },
  ]);
  logger.info(`✅ ${cities.length} cities across 8 countries`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 8 · TAGS
  // ═════════════════════════════════════════════════════════════════════════════
  await Tag.insertMany([
    // Tech skills (tagFor: 1 = job)
    { tag: 'JavaScript',       alias: 'javascript',       tagFor: 1, status: true },
    { tag: 'TypeScript',       alias: 'typescript',       tagFor: 1, status: true },
    { tag: 'Python',           alias: 'python',           tagFor: 1, status: true },
    { tag: 'Java',             alias: 'java',             tagFor: 1, status: true },
    { tag: 'Golang',           alias: 'golang',           tagFor: 1, status: true },
    { tag: 'React.js',         alias: 'reactjs',          tagFor: 1, status: true },
    { tag: 'Next.js',          alias: 'nextjs',           tagFor: 1, status: true },
    { tag: 'Vue.js',           alias: 'vuejs',            tagFor: 1, status: true },
    { tag: 'Node.js',          alias: 'nodejs',           tagFor: 1, status: true },
    { tag: 'Express.js',       alias: 'expressjs',        tagFor: 1, status: true },
    { tag: 'MongoDB',          alias: 'mongodb',          tagFor: 1, status: true },
    { tag: 'PostgreSQL',       alias: 'postgresql',       tagFor: 1, status: true },
    { tag: 'MySQL',            alias: 'mysql',            tagFor: 1, status: true },
    { tag: 'Redis',            alias: 'redis',            tagFor: 1, status: true },
    { tag: 'AWS',              alias: 'aws',              tagFor: 1, status: true },
    { tag: 'Google Cloud',     alias: 'google-cloud',     tagFor: 1, status: true },
    { tag: 'Azure',            alias: 'azure',            tagFor: 1, status: true },
    { tag: 'Docker',           alias: 'docker',           tagFor: 1, status: true },
    { tag: 'Kubernetes',       alias: 'kubernetes',       tagFor: 1, status: true },
    { tag: 'Terraform',        alias: 'terraform',        tagFor: 1, status: true },
    { tag: 'GraphQL',          alias: 'graphql',          tagFor: 1, status: true },
    { tag: 'REST API',         alias: 'rest-api',         tagFor: 1, status: true },
    { tag: 'React Native',     alias: 'react-native',     tagFor: 1, status: true },
    { tag: 'Flutter',          alias: 'flutter',          tagFor: 1, status: true },
    // Soft/misc skills (tagFor: 2 = resume)
    { tag: 'Machine Learning', alias: 'machine-learning', tagFor: 2, status: true },
    { tag: 'Deep Learning',    alias: 'deep-learning',    tagFor: 2, status: true },
    { tag: 'Data Analysis',    alias: 'data-analysis',    tagFor: 2, status: true },
    { tag: 'SQL',              alias: 'sql',              tagFor: 2, status: true },
    { tag: 'Figma',            alias: 'figma',            tagFor: 2, status: true },
    { tag: 'Adobe XD',         alias: 'adobe-xd',         tagFor: 2, status: true },
    { tag: 'Leadership',       alias: 'leadership',       tagFor: 2, status: true },
    { tag: 'Agile / Scrum',    alias: 'agile-scrum',      tagFor: 2, status: true },
    { tag: 'Communication',    alias: 'communication',    tagFor: 2, status: true },
    { tag: 'Problem Solving',  alias: 'problem-solving',  tagFor: 2, status: true },
    { tag: 'Google Ads',       alias: 'google-ads',       tagFor: 2, status: true },
    { tag: 'SEO',              alias: 'seo',              tagFor: 2, status: true },
  ]);
  logger.info('✅ Tags seeded');

  // ═════════════════════════════════════════════════════════════════════════════
  // 9 · PACKAGES
  // ═════════════════════════════════════════════════════════════════════════════
  const packages = await Package.insertMany([
    // Jobseeker packages
    {
      title: 'Jobseeker Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      resume: 1, jobApply: 10, jobAlert: 1, coverletter: 1,
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
    // Employer packages
    {
      title: 'Employer Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      job: 1, companies: 1, resumeSearch: 10,
      jobTime: 15, jobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Starter', price: 999,
      packageTime: 30, packageTimeUnit: 'days',
      job: 10, featuredJob: 1, companies: 1, department: 3,
      resumeSearch: 50, jobTime: 30, jobTimeUnit: 'days',
      featuredJobTime: 7, featuredJobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Growth', price: 2999,
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
  // 10 · SETTINGS (Bank Details)
  // ═════════════════════════════════════════════════════════════════════════════
  await Setting.create({
    key: 'bank_details',
    value: {
      bankName: 'HDFC Bank Ltd',
      accountName: 'HireHub Technologies Pvt Ltd',
      accountNumber: '50200099887766',
      ifsc: 'HDFC0001234',
      branch: 'Koramangala, Bengaluru',
      upiId: 'hirehub@hdfcbank',
    },
  });
  logger.info('✅ Bank details setting saved');

  // ═════════════════════════════════════════════════════════════════════════════
  // 11 · USERS  (1 superadmin + 1 admin + 1 employer + 1 jobseeker)
  // ═════════════════════════════════════════════════════════════════════════════
  const hashedPw = await bcrypt.hash('Pass@123456', 12);
  const n = Date.now();

  const [superAdmin, admin, employer, jobseeker] = await User.insertMany([
    // ── SUPERADMIN ────────────────────────────────────────────────────────────
    {
      firstName: 'Rohan', lastName: 'Kapoor',
      email: 'superadmin@hirehub.io', password: hashedPw,
      phone: '+91-9800000000', role: 'superadmin',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 100,
      avatar: {
        publicId: 'avatars/superadmin',
        secureUrl: 'https://ui-avatars.com/api/?name=Rohan+Kapoor&background=1e1b4b&color=fff&size=200&bold=true',
        resourceType: 'image',
      },
      headline: 'Platform Superadmin — HireHub Technologies',
      bio: 'Overseeing entire platform operations, infrastructure, and compliance for HireHub.',
      gender: 'male',
      currentCity: 'Bengaluru',
      lastLogin: new Date(), lastActive: new Date(), loginCount: 102,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    // ── ADMIN ─────────────────────────────────────────────────────────────────
    {
      firstName: 'Kavya', lastName: 'Sharma',
      email: 'admin@hirehub.io', password: hashedPw,
      phone: '+91-9800000001', role: 'admin',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 100,
      avatar: {
        publicId: 'avatars/admin',
        secureUrl: 'https://ui-avatars.com/api/?name=Kavya+Sharma&background=6366f1&color=fff&size=200&bold=true',
        resourceType: 'image',
      },
      headline: 'Platform Administrator — HireHub',
      bio: 'Managing job postings, employer verifications, and user moderation across HireHub.',
      gender: 'female',
      currentCity: 'New Delhi',
      lastLogin: new Date(n - 3600000), lastActive: new Date(), loginCount: 58,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    // ── EMPLOYER ─────────────────────────────────────────────────────────────
    {
      firstName: 'Arjun', lastName: 'Mehta',
      email: 'employer@hirehub.io', password: hashedPw,
      phone: '+91-9800000002', role: 'employer',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 96,
      avatar: {
        publicId: 'avatars/employer',
        secureUrl: 'https://ui-avatars.com/api/?name=Arjun+Mehta&background=0ea5e9&color=fff&size=200&bold=true',
        resourceType: 'image',
      },
      headline: 'Head of Talent Acquisition — NexaCloud India',
      bio: 'Passionate about building high-performing engineering teams. Hiring top tech talent across India for NexaCloud\'s product and platform divisions.',
      gender: 'male',
      currentCity: 'Bengaluru',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/arjunmehta-ta',
        website:  'https://nexacloud.in',
        github:   '',
        twitter:  'https://twitter.com/arjunmehta_hr',
        facebook: '',
      },
      lastLogin: new Date(n - 7200000), lastActive: new Date(), loginCount: 31,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
    // ── JOBSEEKER ────────────────────────────────────────────────────────────
    {
      firstName: 'Priya', lastName: 'Nair',
      email: 'jobseeker@hirehub.io', password: hashedPw,
      phone: '+91-9800000003', role: 'jobseeker',
      status: 'active', isVerified: true, isEmailVerified: true, profileCompleted: 91,
      avatar: {
        publicId: 'avatars/jobseeker',
        secureUrl: 'https://ui-avatars.com/api/?name=Priya+Nair&background=f59e0b&color=fff&size=200&bold=true',
        resourceType: 'image',
      },
      headline: 'Senior Full Stack Developer | React · Node.js · AWS',
      bio: '5+ years building scalable web apps. Passionate about clean architecture and great user experiences. Currently open to Senior SDE / Tech Lead roles in Bengaluru or remote.',
      gender: 'female',
      nationality: 'Indian',
      currentCity: 'Bengaluru',
      address: 'Flat 204, Prestige Lakeside Habitat, Varthur, Bengaluru – 560087',
      totalExperience: '5 years 3 months',
      expectedSalary: '₹30–40 LPA',
      noticePeriod: '30 days',
      skills: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'Redis', 'Next.js'],
      jobPreferences: {
        locations: ['Bengaluru', 'Remote', 'Hyderabad'],
        workplaceType: 'hybrid',
        salaryMin: 2500000,
        salaryMax: 4000000,
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/in/priyanair-dev',
        github:   'https://github.com/priya-nair-dev',
        twitter:  'https://twitter.com/priyanair_codes',
        facebook: '',
        website:  'https://priyanair.dev',
      },
      lastLogin: new Date(n - 1800000), lastActive: new Date(), loginCount: 24,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: true, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },
  ], { ordered: true });

  logger.info('✅ 4 users — superadmin · admin · employer · jobseeker | password: Pass@123456');

  // ═════════════════════════════════════════════════════════════════════════════
  // 12 · USER PACKAGES + INVOICES + TRANSACTION LOGS
  // ═════════════════════════════════════════════════════════════════════════════
  const pkgGrowth  = packages.find(p => p.title === 'Employer Growth');
  const pkgPremJs  = packages.find(p => p.title === 'Jobseeker Premium');

  const [upEmployer, upJobseeker] = await UserPackage.insertMany([
    {
      uid: employer._id, packageId: pkgGrowth._id,
      endDate: new Date(n + 55 * 86400000), status: true, isActive: true,
      remainingJobs: 43, remainingFeaturedJobs: 4, remainingCompanies: 1,
      remainingResumeSearch: 912,
    },
    {
      uid: jobseeker._id, packageId: pkgPremJs._id,
      endDate: new Date(n + 72 * 86400000), status: true, isActive: true,
      remainingResumes: 18, remainingFeaturedResumes: 2,
      remainingJobApply: 956, remainingJobAlerts: 17,
    },
  ]);

  const [inv1, inv2] = await Invoice.insertMany([
    {
      uid: employer._id, recordId: upEmployer._id,
      description: 'Employer Growth – 30 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 2999,
      payMethod: 'stripe', paymentStatus: 'paid',
      transactionId: 'ch_3EmpGrowth' + n,
      paidAt: new Date(n - 4 * 86400000),
      payerName: 'Arjun Mehta', payerEmail: 'employer@hirehub.io',
      status: true,
    },
    {
      uid: jobseeker._id, recordId: upJobseeker._id,
      description: 'Jobseeker Premium – 90 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 799,
      payMethod: 'stripe', paymentStatus: 'paid',
      transactionId: 'ch_3JsPrem' + n,
      paidAt: new Date(n - 2 * 86400000),
      payerName: 'Priya Nair', payerEmail: 'jobseeker@hirehub.io',
      status: true,
    },
  ]);

  await TransactionLog.insertMany([
    { uid: employer._id,   userPackageId: upEmployer._id,   recordId: inv1._id, type: 'package_purchase', status: true },
    { uid: jobseeker._id,  userPackageId: upJobseeker._id,  recordId: inv2._id, type: 'package_purchase', status: true },
  ]);
  logger.info('✅ User packages · invoices · transaction logs');

  // ═════════════════════════════════════════════════════════════════════════════
  // 13 · COMPANY
  // ═════════════════════════════════════════════════════════════════════════════
  const [company] = await Company.insertMany([
    {
      uid: employer._id,
      name: 'NexaCloud India Pvt Ltd',
      slug: 'nexacloud-india',
      url: 'https://nexacloud.in',
      contactEmail: 'careers@nexacloud.in',
      tagline: 'Cloud. Scale. Simplify.',
      description: `<p><strong>NexaCloud India</strong> is a fast-growing cloud infrastructure and SaaS company headquartered in Bengaluru's thriving tech corridor. Founded in 2018, we help enterprises modernise their IT stack with cloud-native solutions — from Kubernetes-based microservices platforms to AI-powered analytics dashboards.</p>
<p>We are backed by Sequoia India and are currently Series B with a team of 600+ across Bengaluru, Hyderabad, and Singapore. Our clients include 3 Fortune 500 companies, 50+ Indian unicorns, and 200+ mid-market enterprises across APAC.</p>
<h3>Why NexaCloud?</h3>
<ul>
  <li>💰 Top-quartile compensation + ESOPs</li>
  <li>🚀 Work on products used by 2 million+ end users</li>
  <li>🧠 Strong engineering culture — weekly tech talks, open-source contributions</li>
  <li>🏡 Flexible hybrid model (2 days WFH)</li>
  <li>📚 ₹50,000/year learning & certification budget</li>
  <li>🍱 Free catered lunches, gym membership, wellness allowance</li>
</ul>`,
      phone: '+91-80-46001234',
      city: 'Bengaluru',
      address1: '3rd Floor, Wing A, Prestige Tech Park',
      address2: 'Outer Ring Road, Marathahalli, Bengaluru – 560103',
      cities: [cities[2]._id, cities[8]._id],
      logo: {
        publicId: 'companies/nexacloud/logo',
        secureUrl: 'https://ui-avatars.com/api/?name=NC&background=0ea5e9&color=fff&size=200&bold=true',
        resourceType: 'image',
        fileSize: 52000,
      },
      smallLogo: {
        publicId: 'companies/nexacloud/small',
        secureUrl: 'https://ui-avatars.com/api/?name=NC&background=0ea5e9&color=fff&size=80&bold=true',
      },
      isVerified: true, verificationStatus: 'approved',
      status: 1, isGoldCompany: true,
      startGoldDate: new Date(n - 20 * 86400000), endGoldDate: new Date(n + 70 * 86400000),
      isFeaturedCompany: true,
      startFeaturedDate: new Date(n - 5 * 86400000), endFeaturedDate: new Date(n + 25 * 86400000),
      socialLinks: {
        linkedin:  'https://linkedin.com/company/nexacloud-india',
        twitter:   'https://twitter.com/nexacloud_in',
        website:   'https://nexacloud.in',
        facebook:  'https://facebook.com/nexacloudindia',
        youtube:   'https://youtube.com/@nexacloud',
        instagram: 'https://instagram.com/nexacloud_in',
      },
      gallery: [
        { publicId: 'co/nc/g1', secureUrl: 'https://picsum.photos/seed/nc_office/800/450',    caption: 'Bengaluru HQ – Open Office', uploadedAt: new Date() },
        { publicId: 'co/nc/g2', secureUrl: 'https://picsum.photos/seed/nc_team/800/450',      caption: 'Engineering All-Hands Q3 2024', uploadedAt: new Date() },
        { publicId: 'co/nc/g3', secureUrl: 'https://picsum.photos/seed/nc_hack/800/450',      caption: 'HackNova 2024 Winners', uploadedAt: new Date() },
        { publicId: 'co/nc/g4', secureUrl: 'https://picsum.photos/seed/nc_offsite/800/450',   caption: 'Annual Team Offsite — Coorg', uploadedAt: new Date() },
        { publicId: 'co/nc/g5', secureUrl: 'https://picsum.photos/seed/nc_awards/800/450',    caption: 'Deloitte Tech Fast 50 Award 2023', uploadedAt: new Date() },
      ],
      metaDescription: 'NexaCloud India – Cloud infrastructure & SaaS company hiring engineers in Bengaluru and Hyderabad.',
      metaKeywords: 'cloud jobs bangalore, devops engineer, full stack developer, react nodejs, aws kubernetes',
      hits: 2840, followersCount: 512, jobsCount: 8,
      userpackageId: upEmployer._id, serverid: 0,
    },
  ]);
  logger.info('✅ 1 company (NexaCloud India)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 14 · DEPARTMENTS
  // ═════════════════════════════════════════════════════════════════════════════
  const depts = await Department.insertMany([
    { uid: employer._id, companyId: company._id, name: 'Platform Engineering',   alias: 'platform-engineering',  description: 'Core infrastructure, backend services, and platform reliability', status: true },
    { uid: employer._id, companyId: company._id, name: 'Product Engineering',    alias: 'product-engineering',   description: 'Customer-facing product features and mobile apps', status: true },
    { uid: employer._id, companyId: company._id, name: 'Data & AI',              alias: 'data-ai',               description: 'ML, AI, analytics, and data platform', status: true },
    { uid: employer._id, companyId: company._id, name: 'DevOps & SRE',           alias: 'devops-sre',            description: 'Cloud infrastructure, CI/CD, observability', status: true },
    { uid: employer._id, companyId: company._id, name: 'Design & Research',      alias: 'design-research',       description: 'Product design, UX research, design systems', status: true },
    { uid: employer._id, companyId: company._id, name: 'Product Management',     alias: 'product-management',    description: 'Product strategy, roadmaps, OKRs', status: true },
    { uid: employer._id, companyId: company._id, name: 'Marketing & Growth',     alias: 'marketing-growth',      description: 'Performance, brand, content, and growth marketing', status: true },
    { uid: employer._id, companyId: company._id, name: 'Human Resources',        alias: 'human-resources',       description: 'Talent acquisition, people ops, employee experience', status: true },
    { uid: employer._id, companyId: company._id, name: 'Finance & Legal',        alias: 'finance-legal',         description: 'Finance, accounts, compliance, and legal', status: true },
    { uid: employer._id, companyId: company._id, name: 'Customer Success',       alias: 'customer-success',      description: 'Enterprise onboarding, support, and retention', status: true },
  ]);
  logger.info(`✅ ${depts.length} departments`);

  // ═════════════════════════════════════════════════════════════════════════════
  // 15 · JOBS  (mix of approved, 1 pending, 1 draft — all realistic)
  // ═════════════════════════════════════════════════════════════════════════════
  const itCat     = parentCats[0]._id;
  const mktCat    = parentCats[1]._id;
  const hrCat     = parentCats[3]._id;
  const designCat = parentCats[7]._id;
  const ftType    = jobTypes[0]._id;
  const inType    = jobTypes[3]._id;
  const remType   = jobTypes[5]._id;

  const jobs = await Job.insertMany([

    // ── JOB 1: Senior Full Stack Developer ───────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Senior Full Stack Developer (React + Node.js)',
      slug: 'senior-full-stack-developer-react-nodejs-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[3]._id, educationId: educations[2]._id,
      departmentId: depts[1]._id,
      tags: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'GraphQL', 'Docker'],
      status: 'approved',
      description: `<h3>About the Role</h3>
<p>We are looking for a <strong>Senior Full Stack Developer</strong> to join NexaCloud's Product Engineering squad. You will own end-to-end delivery of features on our flagship SaaS platform — from crafting pixel-perfect React UIs to designing robust Node.js microservices that process millions of events daily.</p>

<h3>What You'll Do</h3>
<ul>
  <li>Lead full-stack feature delivery from design handoff → code review → production deployment</li>
  <li>Design and implement RESTful & GraphQL APIs consumed by web and mobile clients</li>
  <li>Drive performance optimisations — reducing API p99 latency, improving Core Web Vitals</li>
  <li>Mentor 2–3 junior/mid engineers and participate in technical hiring</li>
  <li>Collaborate closely with Product Managers, Designers, and SRE on architecture decisions</li>
  <li>Write thorough unit, integration, and E2E test coverage (Jest + Cypress)</li>
</ul>

<h3>Tech Stack</h3>
<p>React 18, Next.js 14, TypeScript, Node.js 20, Express, MongoDB Atlas, Redis, GraphQL (Apollo), AWS (ECS · Lambda · S3 · SQS), Docker, GitHub Actions</p>

<h3>Why This Role?</h3>
<p>You will be joining the team at an inflection point — we are scaling from 500K to 2M active users. Real ownership, real impact.</p>`,
      qualifications: 'B.Tech / B.E in Computer Science or equivalent. 4–7 years of full-stack development experience with React and Node.js.',
      prefferdSkills: 'React.js, Next.js, TypeScript, Node.js, Express.js, MongoDB, Redis, GraphQL, AWS, Docker, Jest, Cypress, Git',
      city: 'Bengaluru', address1: 'Prestige Tech Park, Marathahalli',
      latitude: '12.9556', longitude: '77.7011',
      cities: [cities[2]._id], workplaceType: 'hybrid',
      contactEmail: 'careers@nexacloud.in', showContact: false,
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1800000, salaryMax: 3200000, currency: 'INR',
      experience: 4, noOfJobs: 3,
      expiresAt: new Date(n + 30 * 86400000),
      isGoldJob: true, startGoldDate: new Date(), endGoldDate: new Date(n + 30 * 86400000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(n + 14 * 86400000),
      isUrgent: true, urgentUntil: new Date(n + 7 * 86400000),
      viewsCount: 1248, applicationsCount: 32,
      userpackageId: upEmployer._id,
      aiJobSearchText: 'senior full stack developer react nodejs typescript mongodb aws graphql docker bengaluru hybrid 4 years',
      metaDescription: 'NexaCloud India hiring Senior Full Stack Developer (React + Node.js) in Bengaluru – 18–32 LPA, hybrid.',
      metaKeywords: 'full stack developer react nodejs bengaluru, senior sde jobs bangalore, react typescript job',
    },

    // ── JOB 2: DevOps / SRE Engineer ─────────────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'DevOps / SRE Engineer – AWS & Kubernetes',
      slug: 'devops-sre-engineer-aws-kubernetes-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[3]._id, educationId: educations[2]._id,
      departmentId: depts[3]._id,
      tags: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'GitHub Actions', 'Python', 'Golang'],
      status: 'approved',
      description: `<h3>Role Overview</h3>
<p>Join NexaCloud's DevOps & SRE team to build and operate the cloud infrastructure powering products used by 2M+ users. You will be responsible for reliability, scalability, and observability across our AWS-based multi-region setup.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Manage AWS EKS clusters (100+ nodes) and Helm chart releases</li>
  <li>Write reusable Terraform modules for AWS infrastructure (VPC, RDS, ElastiCache, SQS, Lambda)</li>
  <li>Build and maintain GitHub Actions CI/CD pipelines (build → test → deploy in < 8 min)</li>
  <li>Set up observability: Prometheus + Grafana dashboards, Datadog APM, PagerDuty alerting</li>
  <li>Conduct Game Days and lead post-mortems to drive SLA improvement</li>
  <li>Drive FinOps initiatives — currently targeting 20% AWS cost reduction this quarter</li>
</ul>

<h3>Tech Environment</h3>
<p>AWS (EKS · RDS Aurora · ElastiCache · S3 · SQS · Lambda · CloudFront), Kubernetes 1.29, Terraform 1.6, Helm, ArgoCD, GitHub Actions, Datadog, PagerDuty, Python, Bash, Golang (tooling)</p>`,
      qualifications: 'B.Tech or equivalent. 3+ years in DevOps / Cloud / SRE. AWS Solutions Architect or CKA certification preferred.',
      prefferdSkills: 'AWS EKS, Kubernetes, Terraform, Helm, ArgoCD, Docker, GitHub Actions, Prometheus, Grafana, Datadog, Python, Linux',
      city: 'Bengaluru', cities: [cities[2]._id, cities[8]._id], workplaceType: 'remote',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1600000, salaryMax: 2800000, currency: 'INR',
      experience: 3, noOfJobs: 2,
      expiresAt: new Date(n + 28 * 86400000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(n + 14 * 86400000),
      viewsCount: 876, applicationsCount: 21, userpackageId: upEmployer._id,
      aiJobSearchText: 'devops sre engineer aws kubernetes terraform docker github actions python golang bengaluru hyderabad remote',
      metaDescription: 'NexaCloud India – DevOps SRE Engineer (AWS, Kubernetes, Terraform) – Remote – 16–28 LPA.',
    },

    // ── JOB 3: Lead Data Scientist – NLP & LLMs ──────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Lead Data Scientist – NLP & Generative AI',
      slug: 'lead-data-scientist-nlp-generative-ai-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[4]._id, educationId: educations[3]._id,
      departmentId: depts[2]._id,
      tags: ['Python', 'Machine Learning', 'Deep Learning', 'Golang', 'AWS', 'React.js'],
      status: 'approved',
      description: `<h3>About the Opportunity</h3>
<p>NexaCloud's Data & AI team is building the next generation of intelligent features for our enterprise analytics platform. We're looking for a <strong>Lead Data Scientist</strong> to own our NLP and Generative AI roadmap — from research prototypes to production systems handling millions of daily queries.</p>

<h3>What You'll Build</h3>
<ul>
  <li>RAG-based document intelligence pipeline for enterprise knowledge bases</li>
  <li>Fine-tuned LLMs (LLaMA 3, Mistral) for domain-specific tasks using QLoRA</li>
  <li>Real-time anomaly detection models on streaming time-series data (AWS Kinesis)</li>
  <li>A/B testing framework for ML model experiments (30+ experiments/month)</li>
  <li>MLOps infrastructure: MLflow + AWS SageMaker + Weights & Biases</li>
</ul>

<h3>Stack</h3>
<p>Python 3.11, PyTorch 2, HuggingFace Transformers, LangChain, LlamaIndex, OpenAI API, Pinecone (vector DB), AWS SageMaker, MLflow, W&B, Kafka, Spark</p>

<h3>Team</h3>
<p>You will lead a team of 4 data scientists and 2 ML engineers, reporting to the VP of Engineering.</p>`,
      qualifications: "M.Tech / PhD in CS, Statistics, or related field. 5+ years ML experience including 2+ in production NLP systems.",
      prefferdSkills: 'Python, PyTorch, Transformers, RAG, LangChain, LlamaIndex, OpenAI API, Pinecone, MLflow, SageMaker, SQL, Spark, Statistics',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 2800000, salaryMax: 5000000, currency: 'INR',
      experience: 5, noOfJobs: 1,
      expiresAt: new Date(n + 25 * 86400000),
      isUrgent: true, urgentUntil: new Date(n + 7 * 86400000),
      viewsCount: 1530, applicationsCount: 44, userpackageId: upEmployer._id,
      aiJobSearchText: 'lead data scientist nlp generative ai llm python pytorch transformers langchain rag bengaluru hybrid 5 years',
      metaDescription: 'NexaCloud – Lead Data Scientist (NLP, GenAI, LLMs) Bengaluru – 28–50 LPA.',
    },

    // ── JOB 4: Senior Product Designer ────────────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Senior Product Designer (UI/UX)',
      slug: 'senior-product-designer-ui-ux-nexacloud',
      categoryId: designCat, jobType: ftType,
      careerLevel: careerLevels[3]._id, educationId: educations[2]._id,
      departmentId: depts[4]._id,
      tags: ['Figma', 'Adobe XD', 'Design System', 'SEO'],
      status: 'approved',
      description: `<h3>The Role</h3>
<p>We are looking for a <strong>Senior Product Designer</strong> to join the Design & Research team. You will own the end-to-end design experience for NexaCloud's core cloud management dashboard — used daily by 80,000+ enterprise users.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Lead UX research, user interviews, and usability testing (10+ sessions/quarter)</li>
  <li>Create wireframes, high-fidelity mockups, and interactive Figma prototypes</li>
  <li>Maintain and evolve NexaCloud Design System (200+ components, Figma + Storybook)</li>
  <li>Collaborate closely with engineers during implementation to ensure design fidelity</li>
  <li>Champion accessibility (WCAG 2.1 AA compliance) across the product</li>
  <li>Define and track UX metrics (task completion rate, CSAT, time-on-task)</li>
</ul>

<h3>Tools</h3>
<p>Figma, FigJam, Maze (user testing), Hotjar, Storybook, Zeplin, Miro, Notion</p>`,
      qualifications: 'B.Des / NID / NIFT or B.Tech with strong design portfolio. 4+ years of product design for web/SaaS.',
      prefferdSkills: 'Figma, User Research, Usability Testing, Design Systems, Prototyping, Accessibility, HTML/CSS basics, Storybook, Maze',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1400000, salaryMax: 2400000, currency: 'INR',
      experience: 4, noOfJobs: 1,
      expiresAt: new Date(n + 26 * 86400000),
      viewsCount: 643, applicationsCount: 18, userpackageId: upEmployer._id,
      aiJobSearchText: 'senior product designer ui ux figma design system user research bengaluru onsite 4 years saas',
      metaDescription: 'NexaCloud India – Senior Product Designer (UI/UX, Figma) Bengaluru – 14–24 LPA.',
    },

    // ── JOB 5: Engineering Manager – Platform ─────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Engineering Manager – Platform Engineering',
      slug: 'engineering-manager-platform-engineering-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[5]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['Leadership', 'Node.js', 'AWS', 'Agile / Scrum', 'System Design'],
      status: 'approved',
      description: `<h3>About the Role</h3>
<p>NexaCloud is looking for an experienced <strong>Engineering Manager</strong> to lead the Platform Engineering squad — a team of 12 engineers building the distributed systems and APIs at the heart of our SaaS platform.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Own team roadmap, sprint planning, and quarterly OKR delivery</li>
  <li>Drive architecture decisions for distributed systems (event-driven, microservices)</li>
  <li>Conduct 1:1s, performance reviews, and career growth conversations</li>
  <li>Partner with PM, Design, and SRE on cross-functional initiatives</li>
  <li>Reduce on-call burden through reliability improvements and runbook culture</li>
  <li>Lead technical hiring — sourcing, interviews, and onboarding</li>
</ul>

<h3>What We're Looking For</h3>
<p>Someone who has been a strong individual contributor (5+ years coding) and has transitioned into management (2+ years). You should be comfortable in both a code review and a business strategy meeting.</p>`,
      qualifications: 'B.Tech CS or equivalent. 8+ years of engineering experience with 2+ years in people management.',
      prefferdSkills: 'System Design, Node.js, AWS, Microservices, Technical Leadership, Hiring, Agile, PostgreSQL, Redis',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 4000000, salaryMax: 7000000, currency: 'INR',
      experience: 8, noOfJobs: 1,
      expiresAt: new Date(n + 30 * 86400000),
      viewsCount: 920, applicationsCount: 12, userpackageId: upEmployer._id,
      aiJobSearchText: 'engineering manager platform engineering nodejs aws microservices bengaluru hybrid leadership 8 years',
      metaDescription: 'NexaCloud India – Engineering Manager, Platform Engineering – Bengaluru – 40–70 LPA.',
    },

    // ── JOB 6: Mobile Developer (React Native) ────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'React Native Developer – Mobile Apps',
      slug: 'react-native-developer-mobile-apps-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: depts[1]._id,
      tags: ['React Native', 'TypeScript', 'REST API', 'Node.js', 'AWS'],
      status: 'approved',
      description: `<h3>Overview</h3>
<p>Build NexaCloud's enterprise mobile app (iOS + Android) used by 120,000+ field engineers. You will work on a green-field React Native 0.73 codebase with TypeScript from day one.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop performant, accessible mobile UI components (React Native + Expo)</li>
  <li>Integrate with REST and GraphQL APIs — implement offline-first data sync using Watermelon DB</li>
  <li>Implement push notifications (FCM + APNs), biometric auth, and deep linking</li>
  <li>Write Detox E2E tests and Maestro UI flows; target 80%+ test coverage</li>
  <li>Collaborate with design on pixel-perfect implementation from Figma files</li>
  <li>Submit monthly releases to App Store and Play Store via Fastlane + CodeMagic</li>
</ul>`,
      qualifications: 'B.Tech or equivalent. 2–4 years of React Native development. Apps in production on App Store / Play Store.',
      prefferdSkills: 'React Native, Expo, TypeScript, Redux Toolkit, React Query, WatermelonDB, Detox, Fastlane, Firebase, REST API',
      city: 'Bengaluru', cities: [cities[2]._id, cities[8]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1000000, salaryMax: 1800000, currency: 'INR',
      experience: 2, noOfJobs: 2,
      expiresAt: new Date(n + 22 * 86400000),
      viewsCount: 512, applicationsCount: 19, userpackageId: upEmployer._id,
      aiJobSearchText: 'react native developer mobile ios android typescript bengaluru hyderabad hybrid 2 years nexacloud',
    },

    // ── JOB 7: Growth Marketing Manager ──────────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Growth Marketing Manager – B2B SaaS',
      slug: 'growth-marketing-manager-b2b-saas-nexacloud',
      categoryId: mktCat, jobType: ftType,
      careerLevel: careerLevels[5]._id, educationId: educations[2]._id,
      departmentId: depts[6]._id,
      tags: ['Google Ads', 'SEO', 'Leadership', 'Communication', 'Problem Solving'],
      status: 'approved',
      description: `<h3>The Role</h3>
<p>NexaCloud is hiring a <strong>Growth Marketing Manager</strong> to own demand generation for our B2B SaaS products across APAC. You will manage ₹1.5 Cr/month in paid spend and drive MQL targets feeding a 50-person sales team.</p>

<h3>What You'll Own</h3>
<ul>
  <li>Full-funnel paid acquisition: Google Search, LinkedIn Ads, G2, Capterra, Review sites</li>
  <li>SEO – content strategy, technical SEO audits, link building (targeting 300% organic growth)</li>
  <li>Marketing automation: HubSpot workflows, lead scoring, email nurture sequences</li>
  <li>Product-led growth: in-app onboarding experiments, feature adoption campaigns</li>
  <li>Weekly performance reporting to CMO with channel ROI breakdown</li>
  <li>Manage a team of 3: 1 SEO specialist, 1 paid ads executive, 1 content writer</li>
</ul>`,
      qualifications: 'MBA Marketing or B.Tech + relevant experience. 5+ years in B2B SaaS marketing, 2+ years managing a team.',
      prefferdSkills: 'Google Ads, LinkedIn Ads, SEO, HubSpot, GA4, GTM, Salesforce, A/B Testing, SQL (analytics), Copywriting',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'hybrid',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1500000, salaryMax: 2800000, currency: 'INR',
      experience: 5, noOfJobs: 1,
      expiresAt: new Date(n + 20 * 86400000),
      viewsCount: 381, applicationsCount: 9, userpackageId: upEmployer._id,
      aiJobSearchText: 'growth marketing manager b2b saas google ads seo hubspot bengaluru hybrid 5 years demand generation',
    },

    // ── JOB 8: HR Business Partner (PENDING — not yet live) ──────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'HR Business Partner – Engineering & Product',
      slug: 'hr-business-partner-engineering-product-nexacloud',
      categoryId: hrCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: depts[7]._id,
      tags: ['Leadership', 'Communication', 'Agile / Scrum'],
      status: 'pending',
      description: `<h3>Role Summary</h3>
<p>Drive strategic HR partnerships for the Engineering and Product divisions at NexaCloud. You will be the single point of contact for 150+ employees across these two functions.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Partner with Engineering VPs and Directors on workforce planning and org design</li>
  <li>Own end-to-end talent acquisition for non-tech roles in the division (5–8 open positions at any time)</li>
  <li>Drive quarterly engagement surveys; own and execute action plans</li>
  <li>Handle performance management cycles, PIPs, and disciplinary proceedings</li>
  <li>Conduct compensation benchmarking using Radford / Mercer data</li>
</ul>`,
      qualifications: 'MBA HR or equivalent. 4–6 years HRBP experience, preferably in a tech product company.',
      prefferdSkills: 'HR Business Partnering, Talent Acquisition, Performance Management, Compensation Benchmarking, HRMS (Darwinbox / BambooHR), Employee Engagement',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 1000000, salaryMax: 1600000, currency: 'INR',
      experience: 4, noOfJobs: 1,
      expiresAt: new Date(n + 30 * 86400000),
      viewsCount: 0, applicationsCount: 0, userpackageId: upEmployer._id,
    },

    // ── JOB 9: Backend Engineer Golang (DRAFT) ────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Senior Backend Engineer – Golang (Payments Platform)',
      slug: 'senior-backend-engineer-golang-payments-nexacloud',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[3]._id, educationId: educations[2]._id,
      departmentId: depts[0]._id,
      tags: ['Golang', 'Kubernetes', 'PostgreSQL', 'REST API'],
      status: 'draft',
      description: '<p>Build NexaCloud\'s next-generation payments and billing microservices in Go. Own the subscription billing engine, usage-based pricing engine, and invoice generation pipeline.</p>',
      qualifications: 'B.Tech CS or equivalent. 5+ years backend, 2+ years Go.',
      prefferdSkills: 'Golang, gRPC, PostgreSQL, Redis, Kafka, Kubernetes, Docker, Stripe API, Clean Architecture',
      city: 'Bengaluru', workplaceType: 'remote',
      hideSalaryRange: true, experience: 5, noOfJobs: 1,
      userpackageId: upEmployer._id,
    },

    // ── JOB 10: Software Engineering Intern ───────────────────────────────────
    {
      uid: employer._id, companyId: company._id,
      title: 'Software Engineering Intern – Full Stack (6 Months)',
      slug: 'software-engineering-intern-full-stack-nexacloud',
      categoryId: itCat, jobType: inType,
      careerLevel: careerLevels[0]._id, educationId: educations[2]._id,
      departmentId: depts[1]._id,
      tags: ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'REST API'],
      status: 'approved',
      description: `<h3>Internship Overview</h3>
<p>NexaCloud's 6-month full-time internship is designed to give penultimate/final-year students real production experience. Interns ship actual features, attend design reviews, and get a dedicated mentor from the engineering team.</p>

<h3>What You'll Work On</h3>
<ul>
  <li>Build and ship 2–3 features on our customer-facing dashboard (React + Node.js)</li>
  <li>Write automated tests and participate in code reviews</li>
  <li>Attend weekly engineering all-hands and architecture walkthroughs</li>
  <li>Present your intern project to the CTO at the end of the internship</li>
</ul>

<p><strong>Stipend:</strong> ₹30,000–₹40,000/month + cab allowance + meals</p>
<p><strong>PPO:</strong> High-performing interns receive a Pre-Placement Offer (Full Time SDE-1)</p>`,
      qualifications: 'Pursuing B.Tech / B.E in CS or related field. 2024 or 2025 batch. Strong DSA and basic web development.',
      prefferdSkills: 'JavaScript, React.js, Node.js, MongoDB, HTML, CSS, Git, REST APIs, Problem Solving',
      city: 'Bengaluru', cities: [cities[2]._id], workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 30000, salaryMax: 40000, currency: 'INR',
      experience: 0, noOfJobs: 5,
      expiresAt: new Date(n + 35 * 86400000),
      viewsCount: 2140, applicationsCount: 87, userpackageId: upEmployer._id,
      aiJobSearchText: 'software engineering intern full stack react nodejs mongodb bengaluru onsite 2024 2025 batch fresher',
      metaDescription: 'NexaCloud India – SWE Intern (React + Node.js) 6 months – ₹30–40K/month – PPO available.',
    },
  ]);
  logger.info(`✅ ${jobs.length} jobs (approved / pending / draft)`);

  const approvedJobs = jobs.filter(j => j.status === 'approved');

  // ═════════════════════════════════════════════════════════════════════════════
  // 16 · RESUMES
  // ═════════════════════════════════════════════════════════════════════════════
  const [resume] = await Resume.insertMany([
    {
      uid: jobseeker._id,
      applicationTitle: 'Senior Full Stack Developer | React · Node.js · AWS',
      firstName: 'Priya', lastName: 'Nair',
      gender: 'female', emailAddress: 'jobseeker@hirehub.io', cell: '+91-9800000003',
      nationality: 'Indian',
      photo: {
        publicId: 'resumes/priya/photo',
        secureUrl: 'https://ui-avatars.com/api/?name=Priya+Nair&background=f59e0b&color=fff&size=200',
      },
      jobCategory: itCat, jobType: ftType,
      keywords: 'Full Stack Developer, React.js, Node.js, TypeScript, MongoDB, AWS, Docker, GraphQL, Senior SDE',
      tags: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'Redis', 'Next.js'],
      published: true, searchable: true, visibility: 'public', quickApply: true,
      resume: `<p>Results-driven <strong>Senior Full Stack Developer</strong> with 5+ years of experience architecting and delivering high-scale web applications. Deep expertise in React / Next.js on the frontend and Node.js / Express microservices on the backend. Led multiple 0→1 product launches including a SaaS platform now serving 400K+ active users. Passionate about clean code, DX tooling, and engineering teams that ship fast without sacrificing quality.</p>`,
      skills: 'React.js 18, Next.js 14, TypeScript, Redux Toolkit, React Query, Node.js 20, Express.js, NestJS, MongoDB Atlas, PostgreSQL 15, Redis, GraphQL (Apollo), REST APIs, AWS (EC2 · ECS · Lambda · S3 · SQS · CloudFront), Docker, Kubernetes, Terraform (basics), GitHub Actions, Jest, Cypress, Vitest, Zod, Prisma, Drizzle ORM, Git, Linux',
      institutes: [
        {
          institute: 'Indian Institute of Technology, Madras',
          instituteCertificateName: 'Bachelor of Technology',
          instituteStudyArea: 'Computer Science & Engineering',
          fromDate: '2015',
          toDate: '2019',
        },
      ],
      employers: [
        {
          employer: 'Razorpay Software Pvt Ltd',
          employerCity: 'Bengaluru',
          employerPosition: 'Senior Software Development Engineer',
          employerFromDate: '2022-03',
          employerToDate: '',
          employerCurrentStatus: 1,
        },
        {
          employer: 'Freshworks Inc.',
          employerCity: 'Chennai',
          employerPosition: 'Software Development Engineer – II',
          employerFromDate: '2019-07',
          employerToDate: '2022-02',
          employerCurrentStatus: 0,
        },
      ],
      languages: [
        { language: 'English',  proficiency: 'fluent' },
        { language: 'Hindi',    proficiency: 'fluent' },
        { language: 'Tamil',    proficiency: 'native' },
        { language: 'Kannada',  proficiency: 'beginner' },
      ],
      addresses: [
        {
          address: 'Flat 204, Prestige Lakeside Habitat, Varthur Road, Bengaluru – 560087',
          addressCity: 'Bengaluru',
          latitude: '12.9355',
          longitude: '77.7065',
        },
      ],
      files: [
        {
          publicId: 'resumes/priya/cv_2024',
          secureUrl: 'https://example.com/resumes/Priya_Nair_SDE_Resume_2024.pdf',
          filename: 'Priya_Nair_SDE_Resume_2024.pdf',
          filetype: 'application/pdf',
          filesize: 468000,
          uploadedAt: new Date(n - 3 * 86400000),
        },
      ],
      isFeaturedResume: true,
      startFeaturedDate: new Date(),
      endFeaturedDate: new Date(n + 14 * 86400000),
      atsScore: 91,
      completionPercentage: 96,
      hits: 342, viewsCount: 58, downloadCount: 9,
      aiResumeSearchText: 'senior full stack developer react nodejs typescript mongodb aws docker graphql bengaluru 5 years iit madras razorpay freshworks',
      userpackageId: upJobseeker._id,
    },
  ]);
  logger.info('✅ 1 resume (Priya Nair)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 17 · COVER LETTERS
  // ═════════════════════════════════════════════════════════════════════════════
  const [cl1, cl2] = await CoverLetter.insertMany([
    {
      uid: jobseeker._id,
      title: 'Senior SDE Role — General Cover Letter',
      alias: 'senior-sde-general-cover',
      description: `<p>Dear Hiring Manager,</p>
<p>I am excited to apply for the Senior Software Development Engineer role. Over the past 5+ years — including 2 years at Razorpay and 3 years at Freshworks — I have built full-stack products at scale, leading teams from prototype to millions of daily active users.</p>
<p>At Razorpay, I architected the micro-frontend migration that reduced our TTI by 42% and led a team of 4 engineers. At Freshworks, I built the core email-threading engine for Freshdesk, handling 10M+ events/day.</p>
<p>I am most energised by roles where I can own both the technical direction and the quality of code that ships. I am particularly drawn to your engineering culture and the scale of challenges you are solving.</p>
<p>I would welcome the opportunity to discuss how my experience aligns with your team's needs.</p>
<p>Warm regards,<br/><strong>Priya Nair</strong></p>`,
      published: true, searchable: true, status: true, hits: 6,
    },
    {
      uid: jobseeker._id,
      title: 'Startup / High-Growth Cover Letter',
      alias: 'startup-high-growth-cover',
      description: `<p>Dear Team,</p>
<p>I thrive in environments where speed, ownership, and impact matter. I have experience wearing multiple hats — from building the backend API to deploying on AWS to writing the E2E test that catches the regression at 2 AM.</p>
<p>I bring 5 years of full-stack depth (React + Node.js + AWS), a strong sense of product ownership, and the ability to mentor junior engineers while still contributing meaningfully myself.</p>
<p>Let's build something great together.</p>
<p>— Priya</p>`,
      published: true, searchable: false, status: true, hits: 2,
    },
  ]);
  logger.info('✅ 2 cover letters');

  // ═════════════════════════════════════════════════════════════════════════════
  // 18 · APPLICATIONS
  // ═════════════════════════════════════════════════════════════════════════════
  const ivDate = new Date(n + 2 * 86400000);

  const [app1, app2, app3] = await Application.insertMany([
    // Application 1: Priya → Senior Full Stack @ NexaCloud — interview_scheduled
    {
      jobId: approvedJobs[0]._id,
      uid: jobseeker._id,
      cvId: resume._id,
      companyId: company._id,
      applyMessage: "NexaCloud's scale and engineering culture are exactly what I'm looking for. My 5 years at Razorpay and Freshworks map perfectly to this role — especially the React + Node.js stack, GraphQL APIs, and AWS infrastructure. I'd love to bring that experience to your Product Engineering squad.",
      coverLetterId: cl1._id,
      quickApply: false,
      status: 'interview_scheduled',
      actionStatus: 3,
      statusHistory: [
        { status: 'applied',             note: 'Application submitted via HireHub.',          changedBy: jobseeker._id, changedAt: new Date(n - 6 * 86400000) },
        { status: 'reviewed',            note: 'Resume reviewed by Talent team.',              changedBy: employer._id,  changedAt: new Date(n - 4 * 86400000) },
        { status: 'shortlisted',         note: 'Strong IIT Madras + Razorpay background. Shortlisted for technical round.',  changedBy: employer._id, changedAt: new Date(n - 2 * 86400000) },
        { status: 'interview_scheduled', note: 'Round 1 – Technical (System Design + Coding, 90 min). Google Meet.', changedBy: employer._id, changedAt: new Date(n - 86400000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 4 * 86400000),
      rating: 4,
      employerNotes: 'IIT Madras + Razorpay – very strong profile. ATS 91. Shortlisted unanimously. Must move fast.',
      candidateNotes: 'Top priority company. Very interested in the Product Engineering squad.',
      interviewDate: ivDate,
      // interviewType: 'video',
      interviewLink: 'https://meet.google.com/nxc-sde1-priya',
      interviewNotes: 'Round 1 – Technical Interview (90 min): 30 min system design (design a job portals notification system), 45 min coding (LeetCode medium), 15 min Q&A. Interviewer: Rajan Pillai (Staff Engineer).',
      interviewScheduledAt: new Date(n - 86400000),
      activityLog: [
        { action: 'apply',         description: 'Application submitted via HireHub',  performedBy: jobseeker._id, ipAddress: '49.37.0.1',   createdAt: new Date(n - 6 * 86400000) },
        { action: 'resume_viewed', description: 'Employer viewed resume',             performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 4 * 86400000) },
        { action: 'status_change', description: 'Shortlisted by Talent team',         performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 2 * 86400000) },
        { action: 'status_change', description: 'Round 1 interview scheduled',         performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 86400000) },
      ],
      userpackageId: upJobseeker._id,
    },

    // Application 2: Priya → Data Scientist @ NexaCloud — applied (stretch role)
    {
      jobId: approvedJobs[2]._id,
      uid: jobseeker._id,
      cvId: resume._id,
      companyId: company._id,
      applyMessage: 'While my primary stack is full-stack, I have worked extensively with ML APIs and built data pipelines using Python. This role is a stretch goal but one I am actively upskilling for. Happy to discuss.',
      quickApply: true,
      status: 'reviewed',
      actionStatus: 2,
      statusHistory: [
        { status: 'applied',  note: 'Quick apply submitted.',      changedBy: jobseeker._id, changedAt: new Date(n - 3 * 86400000) },
        { status: 'reviewed', note: 'Profile reviewed. Strong eng background but limited ML depth.', changedBy: employer._id, changedAt: new Date(n - 86400000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 1 * 86400000),
      rating: 2,
      employerNotes: 'Good engineer but lacks ML specialisation for Lead DS role. May revisit for ML Eng opening.',
      activityLog: [
        { action: 'apply',         description: 'Quick apply submitted',  performedBy: jobseeker._id, ipAddress: '49.37.0.1',   createdAt: new Date(n - 3 * 86400000) },
        { action: 'resume_viewed', description: 'Resume viewed',          performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 86400000) },
      ],
      userpackageId: upJobseeker._id,
    },

    // Application 3: Priya → Senior Product Designer — rejected (wrong profile)
    {
      jobId: approvedJobs[3]._id,
      uid: jobseeker._id,
      cvId: resume._id,
      companyId: company._id,
      applyMessage: 'I have strong collaboration with design teams and basic Figma skills, but I am primarily applying to understand how the design and engineering handoff works at NexaCloud.',
      quickApply: true,
      status: 'rejected',
      actionStatus: 5,
      statusHistory: [
        { status: 'applied',  note: 'Quick apply submitted.', changedBy: jobseeker._id, changedAt: new Date(n - 10 * 86400000) },
        { status: 'reviewed', note: 'Reviewed – Engineering background, not design.',  changedBy: employer._id, changedAt: new Date(n - 8 * 86400000) },
        { status: 'rejected', note: 'Not a fit for this role — we need a dedicated UX designer, not an engineer with Figma exposure. Encouraged to apply to SDE roles.',  changedBy: employer._id, changedAt: new Date(n - 7 * 86400000) },
      ],
      resumeView: true, resumeViewedAt: new Date(n - 8 * 86400000),
      rating: 1,
      employerNotes: 'SDE profile, not a product designer. Rejected. Encouraged to apply for full stack role.',
      activityLog: [
        { action: 'apply',         description: 'Quick apply submitted',  performedBy: jobseeker._id, ipAddress: '49.37.0.1',   createdAt: new Date(n - 10 * 86400000) },
        { action: 'resume_viewed', description: 'Resume viewed',          performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 8 * 86400000) },
        { action: 'status_change', description: 'Application rejected',   performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(n - 7 * 86400000) },
      ],
      userpackageId: upJobseeker._id,
    },
  ]);
  logger.info('✅ 3 applications');

  // ═════════════════════════════════════════════════════════════════════════════
  // 19 · JOB SHORTLIST
  // ═════════════════════════════════════════════════════════════════════════════
  await JobShortlist.insertMany([
    { uid: jobseeker._id, jobId: approvedJobs[1]._id, comments: 'Fully remote DevOps role – need to brush up on Terraform before applying.', rate: '4', status: true },
    { uid: jobseeker._id, jobId: approvedJobs[4]._id, comments: 'EM role – great stretch goal for 2 years from now.', rate: '3', status: true },
    { uid: jobseeker._id, jobId: approvedJobs[5]._id, comments: 'React Native – interesting but not my primary target.', rate: '3', status: true },
  ]);
  logger.info('✅ Job shortlists');

  // ═════════════════════════════════════════════════════════════════════════════
  // 20 · JOB ALERTS
  // ═════════════════════════════════════════════════════════════════════════════
  await JobAlert.insertMany([
    {
      uid: jobseeker._id, categoryId: itCat,
      name: 'Senior Full Stack Roles – Bengaluru / Remote',
      contactEmail: 'jobseeker@hirehub.io',
      city: 'Bengaluru',
      keywords: 'senior full stack developer react nodejs typescript hybrid remote',
      alertType: 1, status: 1, sendTime: new Date(n + 86400000),
      userpackageId: upJobseeker._id,
    },
    {
      uid: jobseeker._id, categoryId: itCat,
      name: 'Remote SDE Roles – Senior Level',
      contactEmail: 'jobseeker@hirehub.io',
      keywords: 'senior software engineer remote typescript nodejs graphql',
      alertType: 2, status: 1, sendTime: new Date(n + 7 * 86400000),
      userpackageId: upJobseeker._id,
    },
  ]);
  logger.info('✅ Job alerts');

  // ═════════════════════════════════════════════════════════════════════════════
  // 21 · FOLLOWERS
  // ═════════════════════════════════════════════════════════════════════════════
  await Follower.insertMany([
    { followerId: jobseeker._id, companyId: company._id },
  ]);
  logger.info('✅ Followers');

  // ═════════════════════════════════════════════════════════════════════════════
  // 22 · EMPLOYER VIEW RESUME
  // ═════════════════════════════════════════════════════════════════════════════
  await EmployerViewResume.insertMany([
    { uid: employer._id, resumeId: resume._id, profileId: jobseeker._id, status: true, userpackageId: upEmployer._id },
  ]);
  logger.info('✅ Employer resume views');

  // ═════════════════════════════════════════════════════════════════════════════
  // 23 · SAVED SEARCHES
  // ═════════════════════════════════════════════════════════════════════════════
  await SavedSearch.insertMany([
    { uid: jobseeker._id,  searchName: 'Senior React Jobs Bengaluru',    status: true, searchParams: { keyword: 'react typescript', city: 'Bengaluru', experience: 4 }, userpackageId: upJobseeker._id },
    { uid: jobseeker._id,  searchName: 'Remote Senior Node.js Roles',    status: true, searchParams: { keyword: 'nodejs senior', workplaceType: 'remote' },             userpackageId: upJobseeker._id },
    { uid: employer._id,   searchName: 'Senior Full Stack Candidates',   status: true, searchParams: { keyword: 'senior full stack react', experience: 4 },             userpackageId: upEmployer._id },
    { uid: employer._id,   searchName: 'DevOps Engineers India',         status: true, searchParams: { keyword: 'devops kubernetes aws', experience: 3 },               userpackageId: upEmployer._id },
  ]);
  logger.info('✅ Saved searches');

  // ═════════════════════════════════════════════════════════════════════════════
  // 24 · FOLDERS + FOLDER RESUMES
  // ═════════════════════════════════════════════════════════════════════════════
  const [fol1, fol2] = await Folder.insertMany([
    { uid: employer._id, jobId: approvedJobs[0]._id, name: 'Senior Full Stack – Round 1', alias: 'sfs-round-1', description: 'Shortlisted for Round 1 technical interview', status: true },
    { uid: employer._id, global: true, name: 'Top Candidates Pool – 2025', alias: 'top-candidates-2025', description: 'Global shortlist of exceptional candidates across all roles', status: true },
  ]);
  await FolderResume.insertMany([
    { uid: employer._id, jobId: approvedJobs[0]._id, resumeId: resume._id, folderId: fol1._id },
    { uid: employer._id, resumeId: resume._id, folderId: fol2._id },
  ]);
  logger.info('✅ Folders + folder resumes');

  // ═════════════════════════════════════════════════════════════════════════════
  // 25 · CONVERSATIONS + MESSAGES
  // ═════════════════════════════════════════════════════════════════════════════
  const conv1 = await new Conversation({
    participants: [employer._id, jobseeker._id],
    jobId: approvedJobs[0]._id,
    employerId: employer._id,
    jobseekerId: jobseeker._id,
    lastMessageText: 'All the best Priya! The interviewer will reach out via Google Meet link 5 min before the slot.',
    lastMessageAt: new Date(n - 1800000),
    unreadCount: new Map([[jobseeker._id.toString(), 1]]),
  }).save();

  const msgs = await Message.insertMany([
    {
      conversationId: conv1._id,
      sendBy: employer._id, employerId: employer._id, jobseekerId: jobseeker._id, jobId: approvedJobs[0]._id,
      subject: 'Interview Invite – Senior Full Stack Developer | NexaCloud India',
      message: "Hi Priya! 👋 I'm Arjun from NexaCloud's Talent team. We reviewed your application and were really impressed by your Razorpay and Freshworks experience, especially the micro-frontend work and the email-threading engine you built at scale. We'd love to have you for a Round 1 Technical Interview. Are you available this Thursday, 15 Feb at 11:00 AM IST? It'll be ~90 minutes on Google Meet.",
      isRead: true, readBy: [jobseeker._id], readAt: new Date(n - 7200000),
      status: true, createdAt: new Date(n - 10800000),
    },
    {
      conversationId: conv1._id,
      sendBy: jobseeker._id, employerId: employer._id, jobseekerId: jobseeker._id, jobId: approvedJobs[0]._id,
      message: "Hi Arjun! Thank you so much — really thrilled to hear this! 🎉 Thursday 15 Feb at 11:00 AM IST works perfectly for me. Looking forward to the conversation. Could you let me know who I'll be speaking with and what areas to prepare for? Thanks again!",
      isRead: true, readBy: [employer._id], readAt: new Date(n - 3600000),
      status: true, createdAt: new Date(n - 7200000),
    },
    {
      conversationId: conv1._id,
      sendBy: employer._id, employerId: employer._id, jobseekerId: jobseeker._id, jobId: approvedJobs[0]._id,
      message: "Great! You'll be speaking with Rajan Pillai (Staff Engineer, Platform Engineering). The interview will cover:\n\n1. System Design (30 min) — design a scalable notification system\n2. Coding (45 min) — 2 LeetCode-style problems (Medium difficulty)\n3. Q&A (15 min)\n\nMeet link: https://meet.google.com/nxc-sde1-priya\n\nAll the best Priya! The interviewer will reach out via Google Meet link 5 min before the slot.",
      isRead: false,
      status: true, createdAt: new Date(n - 1800000),
    },
  ]);
  await Conversation.findByIdAndUpdate(conv1._id, { lastMessage: msgs[2]._id });
  logger.info('✅ 1 conversation + 3 messages');

  // ═════════════════════════════════════════════════════════════════════════════
  // 26 · NOTIFICATIONS
  // ═════════════════════════════════════════════════════════════════════════════
  await Notification.insertMany([
    // ── Employer notifications ────────────────────────────────────────────────
    {
      recipientId: employer._id, senderId: jobseeker._id,
      type: 'application_received',
      title: 'New Application – Senior Full Stack Developer',
      message: 'Priya Nair (IIT Madras · Razorpay · 5 yrs) applied for Senior Full Stack Developer.',
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: `/employer/applications/${app1._id}`, actionText: 'Review Application',
    },
    {
      recipientId: employer._id, senderId: jobseeker._id,
      type: 'application_received',
      title: 'New Application – Lead Data Scientist',
      message: 'Priya Nair applied for Lead Data Scientist – NLP & Generative AI (stretch application).',
      refModel: 'Application', refId: app2._id,
      isRead: true, readAt: new Date(n - 3600000),
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: `/employer/applications/${app2._id}`, actionText: 'Review Application',
    },
    {
      recipientId: employer._id,
      type: 'package_expiry',
      title: '⚠️ Employer Growth Package Expiring in 7 Days',
      message: 'Your Employer Growth package expires on ' + new Date(n + 55 * 86400000).toLocaleDateString('en-IN') + '. Renew now to keep your job postings active and resume search quota.',
      refModel: 'Package',
      isRead: false,
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: '/employer/packages', actionText: 'Renew Package',
    },
    {
      recipientId: employer._id,
      type: 'payment_success',
      title: '✅ Payment Confirmed – ₹2,999',
      message: 'Your payment for Employer Growth package has been confirmed. 50 job posts and 999 resume views unlocked.',
      refModel: 'Invoice', refId: inv1._id,
      isRead: true, readAt: new Date(n - 4 * 86400000),
      channels: { inApp: true }, actionUrl: `/employer/invoices/${inv1._id}`, actionText: 'View Invoice',
    },

    // ── Jobseeker notifications ───────────────────────────────────────────────
    {
      recipientId: jobseeker._id, senderId: employer._id,
      type: 'shortlisted',
      title: '🌟 You have been Shortlisted at NexaCloud India!',
      message: 'NexaCloud India shortlisted you for Senior Full Stack Developer. You are one step closer!',
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: `/jobseeker/applications/${app1._id}`, actionText: 'View Application',
    },
    {
      recipientId: jobseeker._id, senderId: employer._id,
      type: 'interview_scheduled',
      title: '📅 Interview Scheduled – NexaCloud India',
      message: `Your Round 1 Technical Interview for Senior Full Stack Developer at NexaCloud India is scheduled for ${ivDate.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })} IST.`,
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: `/jobseeker/applications/${app1._id}`, actionText: 'View Interview Details',
    },
    {
      recipientId: jobseeker._id,
      type: 'rejected',
      title: 'Application Update – Senior Product Designer',
      message: 'NexaCloud India reviewed your application for Senior Product Designer and decided to move forward with other candidates at this time.',
      refModel: 'Application', refId: app3._id,
      isRead: true, readAt: new Date(n - 6 * 86400000),
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: `/jobseeker/applications/${app3._id}`, actionText: 'View Application',
    },
    {
      recipientId: jobseeker._id,
      type: 'job_alert',
      title: '🔔 5 New Jobs Match Your Alert',
      message: '5 new Senior Full Stack (React + Node.js) jobs in Bengaluru match your "Senior Full Stack Roles" alert.',
      isRead: false,
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: '/jobs?keyword=senior+full+stack&city=Bengaluru', actionText: 'View Jobs',
    },
    {
      recipientId: jobseeker._id, senderId: employer._id,
      type: 'message_received',
      title: '💬 New Message from NexaCloud India',
      message: 'Arjun Mehta sent you interview details for Senior Full Stack Developer role.',
      refModel: 'Message', refId: msgs[2]._id,
      isRead: false,
      channels: { inApp: true }, actionUrl: `/jobseeker/messages/${conv1._id}`, actionText: 'Read Message',
    },
    {
      recipientId: jobseeker._id,
      type: 'payment_success',
      title: '✅ Jobseeker Premium Activated',
      message: 'Your Jobseeker Premium package (90 days) is now active. You can now apply to 999 jobs and create up to 20 resumes.',
      refModel: 'Invoice', refId: inv2._id,
      isRead: true, readAt: new Date(n - 2 * 86400000),
      channels: { inApp: true, email: true }, emailSent: true,
      actionUrl: '/jobseeker/packages', actionText: 'View Package',
    },

    // ── Admin / Superadmin notifications ──────────────────────────────────────
    {
      recipientId: admin._id,
      type: 'system',
      title: 'New Company Awaiting Verification',
      message: 'NexaCloud India Pvt Ltd has submitted verification documents. Please review within 24 hours.',
      refModel: 'Company', refId: company._id,
      isRead: false,
      channels: { inApp: true }, actionUrl: `/admin/companies/${company._id}`, actionText: 'Review Company',
    },
    {
      recipientId: admin._id,
      type: 'payment_success',
      title: 'New Package Purchase – ₹2,999',
      message: 'Arjun Mehta (NexaCloud India) purchased Employer Growth package.',
      refModel: 'Invoice', refId: inv1._id,
      isRead: true, readAt: new Date(n - 4 * 86400000),
      channels: { inApp: true }, actionUrl: `/admin/invoices/${inv1._id}`, actionText: 'View Invoice',
    },
    {
      recipientId: superAdmin._id,
      type: 'system',
      title: 'Admin Dashboard Daily Summary',
      message: 'Today: 1 new employer registered, 3 jobs pending review, 2 new invoices totalling ₹3,798.',
      isRead: false,
      channels: { inApp: true }, actionUrl: '/admin/dashboard', actionText: 'View Dashboard',
    },
  ]);
  logger.info('✅ 13 notifications');

  // ═════════════════════════════════════════════════════════════════════════════
  // 27 · ACTIVITY LOG
  // ═════════════════════════════════════════════════════════════════════════════
  await ActivityLog.insertMany([
    { uid: superAdmin._id,  performedBy: superAdmin._id, description: 'Superadmin logged in',                         action: 'login',          ipAddress: '127.0.0.1',    browser: 'Chrome', os: 'macOS' },
    { uid: admin._id,       performedBy: admin._id,      description: 'Admin logged in',                              action: 'login',          ipAddress: '103.21.0.1',   browser: 'Chrome', os: 'Windows' },
    { uid: admin._id,       performedBy: admin._id,      description: 'Admin verified NexaCloud India',               action: 'company_verify', ipAddress: '103.21.0.1',   referenceFor: 'Company',      referenceId: company._id },
    { uid: admin._id,       performedBy: admin._id,      description: `Admin approved job: ${jobs[0].title}`,         action: 'job_approve',    ipAddress: '103.21.0.1',   referenceFor: 'Job', referenceId: jobs[0]._id },
    { uid: admin._id,       performedBy: admin._id,      description: `Admin approved job: ${jobs[1].title}`,         action: 'job_approve',    ipAddress: '103.21.0.1',   referenceFor: 'Job', referenceId: jobs[1]._id },
    { uid: employer._id,    performedBy: employer._id,   description: 'Employer Arjun Mehta logged in',               action: 'login',          ipAddress: '49.205.1.100', browser: 'Chrome', os: 'macOS' },
    { uid: employer._id,    performedBy: employer._id,   description: 'Created company: NexaCloud India',             action: 'company_create', ipAddress: '49.205.1.100', referenceFor: 'Company', referenceId: company._id },
    { uid: employer._id,    performedBy: employer._id,   description: `Posted job: ${jobs[0].title}`,                 action: 'job_post',       ipAddress: '49.205.1.100', referenceFor: 'Job', referenceId: jobs[0]._id },
    { uid: employer._id,    performedBy: employer._id,   description: `Posted job: ${jobs[1].title}`,                 action: 'job_post',       ipAddress: '49.205.1.100', referenceFor: 'Job', referenceId: jobs[1]._id },
    { uid: employer._id,    performedBy: employer._id,   description: `Posted job: ${jobs[2].title}`,                 action: 'job_post',       ipAddress: '49.205.1.100', referenceFor: 'Job', referenceId: jobs[2]._id },
    { uid: employer._id,    performedBy: employer._id,   description: 'Purchased Employer Growth package – ₹2,999',   action: 'package_buy',    ipAddress: '49.205.1.100', referenceFor: 'Invoice', referenceId: inv1._id },
    { uid: employer._id,    performedBy: employer._id,   description: 'Shortlisted Priya Nair for Senior Full Stack', action: 'status_change',  ipAddress: '49.205.1.100', referenceFor: 'Application', referenceId: app1._id },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: 'Jobseeker Priya Nair logged in',               action: 'login',          ipAddress: '49.37.0.1',    browser: 'Chrome', os: 'macOS' },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: `Applied: ${jobs[0].title} at NexaCloud`,       action: 'job_apply',      ipAddress: '49.37.0.1',    referenceFor: 'Application', referenceId: app1._id },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: 'Purchased Jobseeker Premium – ₹799',           action: 'package_buy',    ipAddress: '49.37.0.1',    referenceFor: 'Invoice', referenceId: inv2._id },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: `Saved job: ${jobs[1].title}`,                  action: 'job_save',       ipAddress: '49.37.0.1',    referenceFor: 'Job', referenceId: jobs[1]._id },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: 'Created resume: Senior Full Stack Developer',  action: 'resume_create',  ipAddress: '49.37.0.1',    referenceFor: 'Resume', referenceId: resume._id },
    { uid: jobseeker._id,   performedBy: jobseeker._id,  description: 'Followed NexaCloud India',                     action: 'company_follow', ipAddress: '49.37.0.1',    referenceFor: 'Company', referenceId: company._id },
  ]);
  logger.info('✅ Activity logs');

  // ═════════════════════════════════════════════════════════════════════════════
  // 28 · REPORTS
  // ═════════════════════════════════════════════════════════════════════════════
  await Report.insertMany([
    {
      reportedBy: jobseeker._id,
      refModel: 'Job', refId: approvedJobs[5]._id,
      reason: 'Misleading job description',
      description: 'The job listing mentions "2 years experience" but the HR screening call asked for 4+ years. The salary range shown on the listing (₹10–18 LPA) was also very different from what was discussed in the call (₹6–9 LPA).',
      status: 'pending',
    },
  ]);
  logger.info('✅ Reports');

  // ═════════════════════════════════════════════════════════════════════════════
  // 29 · SYSTEM ERRORS
  // ═════════════════════════════════════════════════════════════════════════════
  await SystemError.insertMany([
    {
      error: 'MongoServerError: E11000 duplicate key error – hirehub.applications index: jobId_1_uid_1 dup key: { jobId: ObjectId("..."), uid: ObjectId("...") }',
      isView: true,
    },
    {
      uid: employer._id,
      error: 'CloudinaryError: Payload too large – file size 12.3 MB exceeds maximum allowed 10 MB for company logo upload.',
      isView: false,
    },
    {
      error: 'Redis ECONNREFUSED – Unable to connect to Redis at redis://localhost:6379. Falling back to in-memory cache. Check REDIS_URL in .env.',
      isView: false,
    },
  ]);
  logger.info('✅ System errors');

  // ═════════════════════════════════════════════════════════════════════════════
  // 🎉 DONE
  // ═════════════════════════════════════════════════════════════════════════════
  logger.info('');
  logger.info('🎉 ══════════════════════════════════════════════════════════');
  logger.info('🎉  FULL REALISTIC SEED COMPLETE');
  logger.info('🎉 ══════════════════════════════════════════════════════════');
  logger.info('');
  logger.info('📋  Login Credentials  (password: Pass@123456)');
  logger.info('    👑 Superadmin → superadmin@hirehub.io  (Rohan Kapoor)');
  logger.info('    🛡️  Admin      → admin@hirehub.io       (Kavya Sharma)');
  logger.info('    🏢 Employer   → employer@hirehub.io     (Arjun Mehta – NexaCloud India, Growth pkg)');
  logger.info('    👤 Jobseeker  → jobseeker@hirehub.io    (Priya Nair – Senior SDE, Premium pkg)');
  logger.info('');
  logger.info('📊  What was seeded:');
  logger.info('    • 8 currencies, 12 parent categories, sub-categories');
  logger.info('    • 6 job types, 10 career levels, 8 education levels, 5 salary types');
  logger.info('    • 8 countries, 11 states, 18 cities');
  logger.info('    • 36 tags, 7 packages, 1 bank_details setting');
  logger.info('    • 4 users (superadmin, admin, employer, jobseeker)');
  logger.info('    • 2 user packages + 2 invoices + 2 transaction logs');
  logger.info('    • 1 company (NexaCloud India) with gallery, verification, socials');
  logger.info('    • 10 departments');
  logger.info('    • 10 jobs (8 approved, 1 pending, 1 draft) – realistic descriptions');
  logger.info('    • 1 resume (Priya Nair – ATS 91%, full work history)');
  logger.info('    • 2 cover letters');
  logger.info('    • 3 applications (shortlisted/interview_scheduled, reviewed, rejected)');
  logger.info('    • 3 job shortlists, 2 job alerts, 1 follower');
  logger.info('    • 1 employer resume view, 4 saved searches');
  logger.info('    • 2 folders + 2 folder resumes');
  logger.info('    • 1 conversation + 3 messages (realistic interview invite thread)');
  logger.info('    • 13 notifications (employer + jobseeker + admin + superadmin)');
  logger.info('    • 18 activity log entries, 1 report, 3 system errors');
  logger.info('');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});