import { Category, User, Product, Review, Order, Message, Report } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'أزياء وملابس', icon: 'Shirt' },
  { id: 'cat-2', name: 'أحذية وحقائب', icon: 'Luggage' },
  { id: 'cat-3', name: 'إلكترونيات', icon: 'Tv' },
  { id: 'cat-4', name: 'موبايلات وإكسسوارات', icon: 'Smartphone' },
  { id: 'cat-5', name: 'أجهزة منزلية', icon: 'Home' },
  { id: 'cat-6', name: 'سيارات وقطع تبديل', icon: 'Car' },
  { id: 'cat-7', name: 'عقارات', icon: 'Building' },
  { id: 'cat-8', name: 'أثاث ومفروشات', icon: 'Bed' },
  { id: 'cat-9', name: 'معدات صناعية', icon: 'Cpu' },
  { id: 'cat-10', name: 'معدات زراعية', icon: 'Leaf' },
  { id: 'cat-11', name: 'رياضة وهوايات', icon: 'Dumbbell' },
  { id: 'cat-12', name: 'كتب وقرطاسية', icon: 'BookOpen' },
  { id: 'cat-13', name: 'ألعاب أطفال', icon: 'Gamepad' },
  { id: 'cat-14', name: 'صحة وجمال', icon: 'Sparkles' },
  { id: 'cat-15', name: 'أطعمة ومشروبات', icon: 'Utensils' },
  { id: 'cat-16', name: 'خدمات', icon: 'Wrench' },
  { id: 'cat-17', name: 'أخرى', icon: 'MoreHorizontal' }
];

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'عبد الرحمن الشمري',
    username: 'abdurrahman_admin',
    email: 'admin@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80',
    bio: 'المدير العام لمنصة فيلوريا المفتوحة والمشرف العام على استقرار السوق وتمكين صغار التجار.',
    badges: ['verified'],
    isPremium: false,
    followersCount: 35,
    ratingAverage: 5.0,
    ratingsCount: 4,
    role: 'admin',
    joinedAt: '2026-01-10',
    city: 'الرياض',
    phone: '0500000001',
    whatsapp_number: '966500000001',
    salesCount: 0,
    trustLevel: 'المدير العام'
  },
  {
    id: 'user-mod',
    name: 'سليمان الحربي',
    username: 'sulaiman_mod',
    email: 'mod@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&h=300&q=80',
    bio: 'مشرف على نزاهة المحتوى، معالجة البلاغات، حل النزاعات وتقديم الدعم الفني للتجار.',
    badges: ['verified'],
    isPremium: false,
    followersCount: 18,
    ratingAverage: 4.8,
    ratingsCount: 8,
    role: 'moderator',
    joinedAt: '2026-02-15',
    city: 'جدة',
    phone: '0500000002',
    whatsapp_number: '966500000002',
    salesCount: 0,
    trustLevel: 'مشرف السوق المعتمد'
  },
  {
    id: 'seller-1',
    name: 'ورشة أبو أحمد للنجارة والتحف',
    username: 'abu_ahmed_wood',
    email: 'abu_ahmed@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'أصنع أجود أنواع الأثاث الخشبي الكلاسيكي والتحف اليدوية بأسعار مناسبة وخشب زان طبيعي.',
    badges: ['verified', 'active_seller', 'featured_seller'],
    isPremium: true,
    premiumConfig: {
      primaryColor: '#b45309', // Amber-700
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&h=300&q=80',
      logo: '🪵',
      avatarBorder: 'ring-4 ring-amber-500 ring-offset-2',
      customSlug: 'abu-ahmed-wood'
    },
    followersCount: 142,
    ratingAverage: 4.9,
    ratingsCount: 45,
    role: 'user',
    joinedAt: '2026-03-01',
    city: 'الرياض',
    phone: '0501111111',
    whatsapp_number: '966501111111',
    salesCount: 68,
    trustLevel: 'بائع ذهبي موثوق'
  },
  {
    id: 'seller-2',
    name: 'سارة للحلويات المنزلية الغربية والشرقية',
    username: 'sara_cakes',
    email: 'sara_cakes@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1516054901232-563a42c86240?auto=format&fit=crop&w=800&h=300&q=80',
    bio: 'صناعة منزلية فاخرة بأجود المكونات الطازجة. كعكات مناسبات، تارت، وحلويات شعبية حسب الطلب وبأرخص الأسعار.',
    badges: ['verified', 'active_seller'],
    isPremium: false,
    followersCount: 89,
    ratingAverage: 4.7,
    ratingsCount: 32,
    role: 'user',
    joinedAt: '2026-03-12',
    city: 'جدة',
    phone: '0502222222',
    whatsapp_number: '966502222222',
    salesCount: 114,
    trustLevel: 'بائع نشط موثوق'
  },
  {
    id: 'seller-3',
    name: 'متجر الرقميات الحديثة',
    username: 'modern_tech',
    email: 'modern_tech@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'وكيل وموزع معتمد لأحدث الهواتف الذكية والإكسسوارات بأسعار الجملة وتوصيل فوري لكافة المناطق.',
    badges: ['verified', 'official_store'],
    isPremium: true,
    premiumConfig: {
      primaryColor: '#0f172a', // Slate-900
      coverImage: 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=800&h=300&q=80',
      logo: '⚡',
      avatarBorder: 'ring-4 ring-blue-600 ring-offset-2',
      customSlug: 'modern-tech-store'
    },
    followersCount: 520,
    ratingAverage: 4.6,
    ratingsCount: 128,
    role: 'user',
    joinedAt: '2026-02-01',
    city: 'الدمام',
    phone: '0503333333',
    whatsapp_number: '966503333333',
    salesCount: 410,
    trustLevel: 'متجر رسمي معتمد'
  },
  {
    id: 'buyer-1',
    name: 'خالد الحربي',
    username: 'khaled_alharbi',
    email: 'khaled@veloria.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=800&h=300&q=80',
    bio: 'محب للمنتجات المحلية ودعم المشاريع الوطنية والأعمال اليدوية المنزلية.',
    badges: [],
    isPremium: false,
    followersCount: 4,
    ratingAverage: 4.5,
    ratingsCount: 2,
    role: 'user',
    joinedAt: '2026-04-05',
    city: 'الرياض',
    phone: '0504444444',
    whatsapp_number: '966504444444',
    salesCount: 0,
    trustLevel: 'مشترٍ معتمد'
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'طاولة طعام من خشب الساج الطبيعي الفاخر',
    description: 'طاولة مصنوعة يدوياً بالكامل من خشب الساج الصلب، تتسع لـ 6 أشخاص. متينة ومقاومة للرطوبة وبتصميم ريفي كلاسيكي فاخر يضفي الدفء على منزلك.',
    price: 1850,
    currency: 'ل.س',
    categoryId: 'cat-8', // أثاث ومفروشات
    images: [
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-1',
    status: 'active',
    location: 'الرياض، المملكة العربية السعودية',
    createdAt: '2026-06-15T10:00:00Z',
    rating: 4.9,
    reviewsCount: 12,
    viewsCount: 1420
  },
  {
    id: 'prod-2',
    title: 'مجموعة أدوات قهوة خشبيّة مخرطة يدوية',
    description: 'صندوق خشبي أنيق مخصص لعشاق القهوة يحتوي على: حامل فلاتر، كوب خشبي عازل للحرارة ومكبس بن (Tamper) بمقبض خشبي مريح من خشب الجوز المختار بعناية.',
    price: 340,
    currency: 'ل.س',
    categoryId: 'cat-8', // أثاث ومفروشات
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-1',
    status: 'active',
    location: 'الرياض، المملكة العربية السعودية',
    createdAt: '2026-06-20T12:00:00Z',
    rating: 4.8,
    reviewsCount: 8,
    viewsCount: 854
  },
  {
    id: 'prod-3',
    title: 'علبة حلا مشكّل (بسبوسة بالبستاشيو ومعمول فاخر)',
    description: 'علبة تزن 1.5 كجم من ألذ الحلويات المصنوعة منزلياً بالسمن البلدي والزعفران الأصلي والمحشوة بأفخر أنواع الفستق والتمر العضوي الموثق.',
    price: 120,
    currency: 'ل.س',
    categoryId: 'cat-15', // أطعمة ومشروبات
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-2',
    status: 'active',
    location: 'جدة، المملكة العربية السعودية',
    createdAt: '2026-06-24T09:30:00Z',
    rating: 4.7,
    reviewsCount: 15,
    viewsCount: 2310
  },
  {
    id: 'prod-4',
    title: 'كعكة الفراولة والمخمل الأحمر الفاخرة (ريد فيلفيت)',
    description: 'كعكة غنية ومغطاة بطبقات من كريمة الجبن البلجيكية الناعمة مع قطع الفراولة الطازجة تكفي لـ 10-12 شخص. يتم تجهيزها طازجة خلال 24 ساعة من الطلب.',
    price: 180,
    currency: 'ل.س',
    categoryId: 'cat-15', // أطعمة ومشروبات
    images: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-2',
    status: 'active',
    location: 'جدة، المملكة العربية السعودية',
    createdAt: '2026-06-23T15:45:00Z',
    rating: 4.6,
    reviewsCount: 6,
    viewsCount: 912
  },
  {
    id: 'prod-5',
    title: 'سماعات رأس لاسلكية ANC عازلة للضوضاء',
    description: 'سماعة محيطية فاخرة تدعم ميزة إلغاء الضوضاء النشط (Active Noise Cancellation) مع بطارية عملاقة تدوم حتى 40 ساعة متواصلة وميكروفون نقي جداً للمكالمات.',
    price: 499,
    currency: 'ل.س',
    categoryId: 'cat-3', // إلكترونيات
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-3',
    status: 'active',
    location: 'الدمام، المملكة العربية السعودية',
    createdAt: '2026-06-18T08:00:00Z',
    rating: 4.5,
    reviewsCount: 22,
    viewsCount: 3105
  },
  {
    id: 'prod-6',
    title: 'شاحن جداري ذكي بتقنية GaN سريع جداً بقوة 100 واط',
    description: 'يتميز بصغر حجمه الشديد واحتوائه على 3 منافذ Type-C ومنفذ USB-A، يشحن كمبيوترك المحمول وهاتفك في نفس الوقت وبسرعة قصوى وآمنة.',
    price: 150,
    currency: 'ل.س',
    categoryId: 'cat-4', // موبايلات وإكسسوارات
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-3',
    status: 'active',
    location: 'الدمام، المملكة العربية السعودية',
    createdAt: '2026-06-22T11:20:00Z',
    rating: 4.7,
    reviewsCount: 19,
    viewsCount: 1250
  },
  {
    id: 'prod-7',
    title: 'لوحة فنية أصلية مرسومة يدوياً بالزيت والسكين',
    description: 'لوحة تعبيرية رائعة للمستشرقين تعكس حياة الصحراء والخيول العربية الأصيلة، مقاس 120 × 80 سم ببرواز خشبي فاخر مذهب هادئ وبألوان عالية الجودة.',
    price: 2500,
    currency: 'ل.س',
    categoryId: 'cat-17', // أخرى
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    sellerId: 'seller-1',
    status: 'active',
    location: 'الرياض، المملكة العربية السعودية',
    createdAt: '2026-06-10T14:00:00Z',
    rating: 5.0,
    reviewsCount: 4,
    viewsCount: 524
  }
];

export const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    reviewerId: 'buyer-1',
    reviewerName: 'خالد الحربي',
    reviewerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    rating: 5,
    comment: 'ما شاء الله تبارك الله، الخشب ثقيل جداً ونوعه فاخر وتفاصيله تدل على ذوق ومهارة عالية. أبو أحمد خلوق جداً وتعامل راقٍ وتوصيل سريع عن طريق مندوب محلي.',
    createdAt: '2026-06-17T14:30:00Z'
  },
  {
    id: 'rev-2',
    productId: 'prod-3',
    reviewerId: 'buyer-1',
    reviewerName: 'خالد الحربي',
    reviewerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    rating: 5,
    comment: 'الحلوى طازجة وحشو الفستق غني ولذيذ، والسمن البلدي غير ثقيل ومثالي. بالتأكيد سأكرر التجربة، شكراً للأخت سارة.',
    createdAt: '2026-06-24T18:15:00Z'
  },
  {
    id: 'rev-3',
    productId: 'prod-5',
    reviewerId: 'buyer-1',
    reviewerName: 'خالد الحربي',
    reviewerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    rating: 4,
    comment: 'سماعة جيدة جداً بالنسبة لخصائصها، وعزل الضوضاء ممتاز في المكتب والقهوة. تعامل المتجر ممتاز ولكن تم التوصيل بعد يومين من الموعد لظروف الشحن المستقل.',
    createdAt: '2026-06-19T20:00:00Z'
  }
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1',
    productId: 'prod-3',
    productTitle: 'علبة حلا مشكّل (بسبوسة بالبستاشيو ومعمول فاخر)',
    productImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=400&q=80',
    buyerId: 'buyer-1',
    buyerName: 'خالد الحربي',
    sellerId: 'seller-2',
    sellerName: 'سارة للحلويات المنزلية الغربية والشرقية',
    price: 120,
    quantity: 2,
    status: 'completed',
    notes: 'يرجى تسليمها قبل يوم الجمعة صباحاً، مع تقليل السكر قليلاً إن أمكن.',
    createdAt: '2026-06-23T10:15:00Z'
  },
  {
    id: 'ord-2',
    productId: 'prod-2',
    productTitle: 'مجموعة أدوات قهوة خشبيّة مخرطة يدوية',
    productImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&h=400&q=80',
    buyerId: 'buyer-1',
    buyerName: 'خالد الحربي',
    sellerId: 'seller-1',
    sellerName: 'ورشة أبو أحمد للنجارة والتحف',
    price: 340,
    quantity: 1,
    status: 'pending',
    notes: 'أحتاجها هدية لصديق يرجى تلميع الكوب الخشبي جيداً وكتابة اسم (محمد) عليه بخط مذهب.',
    createdAt: '2026-06-25T01:30:00Z'
  }
];

export const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    senderId: 'buyer-1',
    receiverId: 'seller-1',
    text: 'السلام عليكم يا أبا أحمد، بخصوص كوب القهوة الخشبي، هل يمكنني غسله بالماء والصابون بشكل عادي؟',
    createdAt: '2026-06-24T14:00:00Z'
  },
  {
    id: 'msg-2',
    senderId: 'seller-1',
    receiverId: 'buyer-1',
    text: 'وعليكم السلام ورحمة الله وبركاته يا خالد حياك الله. نعم، يمكنك غسله بالماء البارد وصابون خفيف ولكن تجنب نقعه في الماء لفترات طويلة وتجنب غسالة الصحون تماماً ليحافظ على رونقه وسماكته الدهنية الطبيعية.',
    createdAt: '2026-06-24T14:15:00Z'
  },
  {
    id: 'msg-3',
    senderId: 'buyer-1',
    receiverId: 'seller-1',
    text: 'رائع جداً! شكراً لك على النصائح القيمة وسأطلب المخرطة اليدوية اليوم.',
    createdAt: '2026-06-24T14:20:00Z'
  }
];

export const DEFAULT_REPORTS: Report[] = [
  {
    id: 'rep-1',
    type: 'product',
    targetId: 'prod-5',
    targetName: 'سماعات رأس لاسلكية ANC عازلة للضوضاء',
    reporterId: 'buyer-1',
    reporterName: 'خالد الحربي',
    reason: 'سعر غير دقيق أو مضلل',
    details: 'المعلن كتب أن التوصيل مجاني، ولكن عندما تواصلت معه طلب 45,000 ل.س إضافية للتوصيل بالرغم من أن البائع من نفس مدينتي.',
    status: 'pending',
    createdAt: '2026-06-24T16:00:00Z'
  }
];
