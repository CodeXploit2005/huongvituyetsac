import { Category, Product, Banner, Order, Review, FlashDeal, Coupon } from "@/models";

export async function runDatabaseSeed() {
  console.log("🌱 Starting Database Seeding...");

  // 1. CLEAR EXISTING DATA
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Banner.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});
  await FlashDeal.deleteMany({});
  await Coupon.deleteMany({});

  // 2. SEED CATEGORIES (4 Danh mục đặc tả)
  const categoriesData = [
    {
      _id: "cat-1",
      name: { vi: "Nước Mắm Truyền Thống", en: "Traditional Fish Sauce" },
      slug: "nuoc-mam-truyen-thong",
      order: 1,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      description: {
        vi: "Ủ chượp từ cá cơm than tươi ngon và muối tinh khiết trong thùng gỗ bời lời hàng trăm năm.",
        en: "Fermented from fresh anchovies and pure sea salt in century-old wooden barrels.",
      },
    },
    {
      _id: "cat-2",
      name: { vi: "Mì Gói Đặc Sản", en: "Specialty Instant Noodles" },
      slug: "mi-goi-dac-san",
      order: 2,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
      description: {
        vi: "Sợi mì dai giòn thượng hạng kết hợp nước súp hải sản chua cay chuẩn 7 cấp độ.",
        en: "Crispy chewy noodles paired with rich 7-level spicy seafood broth.",
      },
    },
    {
      _id: "cat-3",
      name: { vi: "Gia Vị Kho Nấu", en: "Braising & Cooking Seasonings" },
      slug: "gia-vi-kho-nau",
      order: 3,
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
      description: {
        vi: "Bí quyết tạo nên màu sắc óng ánh và hương thơm ngào ngạt cho món kho thịt, cá gia đình.",
        en: "Secret recipe for rich golden color and aromatic braised dishes.",
      },
    },
    {
      _id: "cat-4",
      name: { vi: "Gia Vị Tiện Lợi", en: "Convenient Sauces & Salts" },
      slug: "gia-vi-tien-loi",
      order: 4,
      image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80",
      description: {
        vi: "Gia vị chấm và sốt ướp pha sẵn cao cấp, mở nắp dùng ngay mà không cần nêm nếm thêm.",
        en: "Ready-to-use dipping sauces and seasoning salts with authentic taste.",
      },
    },
  ];

  await Category.insertMany(categoriesData);
  console.log("✓ Categories seeded: 4 items");

  // 3. SEED PRODUCTS
  const productsData = [
    // --- Nhóm Mì Gói Đặc Sản (Dữ liệu thật nuocmamtin.com) ---
    {
      _id: "prod-mi-cay-root",
      name: {
        vi: "Mì Cay Hải Sản Seoul Chua Cay 7 Cấp Độ – 6 Gói Gia Vị Làng Xưa",
        en: "Seoul Spicy Seafood Noodles 7 Levels – 6 Seasoning Packets",
      },
      slug: "mi-cay-hai-san-seoul-chua-cay-7-cap-do-6-goi",
      categoryId: "cat-2",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "Mì cay hải sản Seoul chua cay 7 cấp độ được làm từ bột mì thượng hạng, sợi mì dai mướt kết hợp cùng gói súp cốt tôm mực cô đặc và ớt hiểm xay nồng nàn. Đi kèm hộp 6 gói gia vị độc quyền.",
        en: "Authentic Seoul 7-level spicy seafood noodles made from premium flour, springy noodles with rich seafood concentrate broth and ground chili packets.",
      },
      price: 22000,
      originalPrice: 25000,
      images: [
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80",
      ],
      videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"],
      videoPoster: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
      stock: 350,
      tags: ["mì cay", "hải sản", "seoul", "làng xưa", "bán chạy"],
      rating: 4.9,
      reviewsCount: 348,
      soldCount: 1520,
      isFeatured: true,
      isBestSeller: true,
      discountBadge: { vi: "-12%", en: "-12%" },
      origin: { vi: "Việt Nam (Công nghệ Hàn Quốc)", en: "Vietnam (Korean Technology)" },
      ingredients: {
        vi: "Vắt mì (bột mì, tinh bột khoai mì, dầu cọ, muối), Gói súp (bột tôm, bột mực, ớt hiểm, sả, tỏi, nước mắm truyền thống, hành tím khô).",
        en: "Noodles (wheat flour, tapioca starch, palm oil, salt), Soup base (shrimp powder, squid powder, chili, lemongrass, garlic, traditional fish sauce).",
      },
      usage: {
        vi: "Cho vắt mì và các gói rau vào tô. Đổ 450ml nước sôi, đậy nắp trong 4 phút. Tùy chỉnh gói ớt theo cấp độ 1 đến 7 để thưởng thức.",
        en: "Put noodles and veggie flakes in bowl. Pour 450ml boiling water, cover for 4 minutes. Add chili packet according to level 1-7.",
      },
    },
    // Biến thể 1: Cấp độ 1 (Gói lẻ)
    {
      _id: "prod-mi-cay-v1",
      name: {
        vi: "Mì Cay Hải Sản Seoul – Cấp Độ 1 (Gói Lẻ)",
        en: "Seoul Spicy Seafood Noodles – Level 1 (Single Pack)",
      },
      slug: "mi-cay-hai-san-seoul-cap-do-1",
      categoryId: "cat-2",
      parentProductId: "prod-mi-cay-root",
      isVariant: true,
      variantLabel: { vi: "Cấp độ 1 (Cay nhẹ)", en: "Level 1 (Mild Spicy)" },
      description: {
        vi: "Cấp độ 1 phù hợp cho cả gia đình và trẻ em, vị cay thanh ngọt vị hải sản.",
        en: "Level 1 is suitable for everyone, mild heat with rich seafood sweetness.",
      },
      price: 18000,
      originalPrice: 20000,
      images: ["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"],
      stock: 200,
      tags: ["mì cay", "cấp độ 1", "gói lẻ"],
      rating: 4.8,
      reviewsCount: 95,
      soldCount: 650,
      isFeatured: false,
      isBestSeller: false,
      discountBadge: { vi: "-10%", en: "-10%" },
      origin: { vi: "Việt Nam", en: "Vietnam" },
    },
    // Biến thể 2: Cấp độ 3 (Gói lẻ)
    {
      _id: "prod-mi-cay-v2",
      name: {
        vi: "Mì Cay Hải Sản Seoul – Cấp Độ 3 (Gói Lẻ)",
        en: "Seoul Spicy Seafood Noodles – Level 3 (Single Pack)",
      },
      slug: "mi-cay-hai-san-seoul-cap-do-3",
      categoryId: "cat-2",
      parentProductId: "prod-mi-cay-root",
      isVariant: true,
      variantLabel: { vi: "Cấp độ 3 (Cay vừa)", en: "Level 3 (Medium Spicy)" },
      description: {
        vi: "Cấp độ 3 chuẩn vị quán cay, thơm nồng ớt tươi và nước dùng sánh mịn.",
        en: "Level 3 restaurant-grade medium heat, full-bodied soup with chili aroma.",
      },
      price: 18000,
      originalPrice: 20000,
      images: ["https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80"],
      stock: 220,
      tags: ["mì cay", "cấp độ 3", "gói lẻ"],
      rating: 4.9,
      reviewsCount: 142,
      soldCount: 880,
      isFeatured: false,
      isBestSeller: true,
      discountBadge: { vi: "-10%", en: "-10%" },
      origin: { vi: "Việt Nam", en: "Vietnam" },
    },
    // Biến thể 3: Cấp độ 7 (Gói lẻ Thách Thức)
    {
      _id: "prod-mi-cay-v3",
      name: {
        vi: "Mì Cay Hải Sản Seoul – Cấp Độ 7 Thách Thức (Gói Lẻ)",
        en: "Seoul Spicy Seafood Noodles – Extreme Level 7 (Single Pack)",
      },
      slug: "mi-cay-hai-san-seoul-cap-do-7",
      categoryId: "cat-2",
      parentProductId: "prod-mi-cay-root",
      isVariant: true,
      variantLabel: { vi: "Cấp độ 7 (Siêu cay cực đại)", en: "Level 7 (Extreme Spicy)" },
      description: {
        vi: "Cấp độ 7 thách thức tín đồ ăn cay thứ thiệt, bổ sung gói ớt bột Habanero và ớt chỉ thiên rực lửa.",
        en: "Level 7 extreme challenge for true spice lovers with Habanero and bird's eye chili powder.",
      },
      price: 20000,
      originalPrice: 24000,
      images: ["https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80"],
      stock: 150,
      tags: ["mì cay", "cấp độ 7", "siêu cay"],
      rating: 5.0,
      reviewsCount: 110,
      soldCount: 720,
      isFeatured: false,
      isBestSeller: true,
      discountBadge: { vi: "-16%", en: "-16%" },
      origin: { vi: "Việt Nam", en: "Vietnam" },
    },
    // Mì Trộn Tương Đen
    {
      _id: "prod-mi-tron-tuong-den",
      name: {
        vi: "Mì Trộn Tương Đen Sốt Thịt Băm Hàn Quốc",
        en: "Korean Jajangmyeon Black Bean Noodles with Minced Meat",
      },
      slug: "mi-tron-tuong-den-sot-thit-bam",
      categoryId: "cat-2",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "Sợi mì to dai chuẩn công nghệ Hàn Quốc kết hợp gói sốt tương đen đậm đà nấu cùng thịt băm và hành tây caramel.",
        en: "Thick springy noodles with authentic rich Korean black bean paste sauce cooked with minced meat.",
      },
      price: 24000,
      originalPrice: 28000,
      images: ["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"],
      stock: 180,
      tags: ["mì trộn", "tương đen", "jajangmyeon"],
      rating: 4.7,
      reviewsCount: 88,
      soldCount: 430,
      isFeatured: false,
      isBestSeller: false,
      discountBadge: { vi: "-14%", en: "-14%" },
      origin: { vi: "Việt Nam", en: "Vietnam" },
    },

    // --- Nhóm Nước Mắm Truyền Thống (Placeholder [Mẫu]) ---
    {
      _id: "prod-nuoc-mam-ca-na",
      name: {
        vi: "[Mẫu] Nước Mắm Cá Cơm Than Cà Ná 40° Đạm – Chai Thủy Tinh 500ml",
        en: "[Demo] Ca Na Black Anchovy Fish Sauce 40° N – Glass Bottle 500ml",
      },
      slug: "nuoc-mam-ca-com-than-ca-na-40-dam-500ml",
      categoryId: "cat-1",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Nước mắm cá cơm than nguyên chất Cà Ná Ninh Thuận, ủ chượp tự nhiên 18 tháng trong thùng gỗ bời lời.",
        en: "[Demo placeholder data] Pure black anchovy fish sauce from Ca Na Ninh Thuan, naturally aged for 18 months in wooden barrels.",
      },
      price: 95000,
      originalPrice: 110000,
      images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"],
      stock: 120,
      tags: ["nước mắm", "cá cơm than", "cà ná", "truyền thống"],
      rating: 5.0,
      reviewsCount: 215,
      soldCount: 890,
      isFeatured: true,
      isBestSeller: true,
      discountBadge: { vi: "BÁN CHẠY", en: "BEST SELLER" },
      origin: { vi: "Làng nghề Cà Ná, Thuận Nam, Ninh Thuận", en: "Ca Na Village, Ninh Thuan" },
    },
    {
      _id: "prod-nuoc-mam-phu-quoc",
      name: {
        vi: "[Mẫu] Nước Mắm Nhĩ Thượng Hạng Phú Quốc 43° Đạm – Hộp Quà 2 Chai",
        en: "[Demo] Phu Quoc Extra Virgin Fish Sauce 43° N – Premium Gift Box 2 Bottles",
      },
      slug: "nuoc-mam-nhi-thuong-hang-phu-quoc-43-dam",
      categoryId: "cat-1",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Tuyệt phẩm nước mắm nhĩ đảo ngọc Phú Quốc, màu cánh gián hổ phách trong vắt, hậu vị ngọt sâu từ đạm cá cơm tự nhiên.",
        en: "[Demo placeholder data] Premium Phu Quoc extra virgin fish sauce with amber red color and deep natural sweetness.",
      },
      price: 240000,
      originalPrice: 280000,
      images: ["https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80"],
      stock: 80,
      tags: ["nước mắm", "phú quốc", "hộp quà", "cao cấp"],
      rating: 4.9,
      reviewsCount: 180,
      soldCount: 420,
      isFeatured: true,
      isBestSeller: false,
      discountBadge: { vi: "HỘP QUÀ VIP", en: "GIFT BOX" },
      origin: { vi: "Đảo Ngọc Phú Quốc, Kiên Giang", en: "Phu Quoc Island, Kien Giang" },
    },
    {
      _id: "prod-nuoc-mam-lang-chai-xua",
      name: {
        vi: "[Mẫu] Nước Mắm Cốt Nhĩ Làng Chài Xưa Ủ Thùng Gỗ 500ml",
        en: "[Demo] Ancient Fishing Village Fish Sauce Barrel Aged 500ml",
      },
      slug: "nuoc-mam-cot-nhi-lang-chai-xua-500ml",
      categoryId: "cat-1",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Nước mắm cốt nhĩ kéo rút truyền thống 300 năm làng chài Phan Thiết.",
        en: "[Demo placeholder data] Traditional first-draw fish sauce from 300-year-old Phan Thiet fishing village.",
      },
      price: 85000,
      originalPrice: 99000,
      images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"],
      stock: 140,
      tags: ["nước mắm", "làng chài xưa", "phan thiết"],
      rating: 4.8,
      reviewsCount: 142,
      soldCount: 560,
      isFeatured: false,
      isBestSeller: true,
      discountBadge: { vi: "HOT", en: "HOT" },
      origin: { vi: "Phan Thiết, Bình Thuận", en: "Phan Thiet, Binh Thuan" },
    },

    // --- Nhóm Gia Vị Kho Nấu (Placeholder [Mẫu]) ---
    {
      _id: "prod-nuoc-mau-dua",
      name: {
        vi: "[Mẫu] Nước Màu Dừa Bến Tre Nguyên Chất Nấu Kho Tiêu 250ml",
        en: "[Demo] Ben Tre Pure Coconut Caramel Color for Braising 250ml",
      },
      slug: "nuoc-mau-dua-ben-tre-nguyen-chat-250ml",
      categoryId: "cat-3",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Thắng cô đặc 100% từ nước dừa tươi Bến Tre nguyên chất, không phẩm màu hóa học.",
        en: "[Demo placeholder data] Concentrated 100% from fresh Ben Tre coconut water, no artificial colorings.",
      },
      price: 65000,
      originalPrice: 75000,
      images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80"],
      stock: 160,
      tags: ["nước màu dừa", "bến tre", "gia vị kho"],
      rating: 4.9,
      reviewsCount: 118,
      soldCount: 680,
      isFeatured: true,
      isBestSeller: false,
      discountBadge: { vi: "-13%", en: "-13%" },
      origin: { vi: "Mỏ Cày Nam, Bến Tre", en: "Ben Tre, Vietnam" },
    },
    {
      _id: "prod-sot-kho-ca-to",
      name: {
        vi: "[Mẫu] Sốt Kho Cá Tộ Cổ Truyền Chuẩn Vị Nam Bộ 280g",
        en: "[Demo] Traditional Claypot Fish Braising Sauce 280g",
      },
      slug: "sot-kho-ca-to-co-truyen-280g",
      categoryId: "cat-3",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Sốt kho cá tộ tiện lợi pha sẵn từ nước mắm nhĩ, tiêu đen Đắk Lắk và ớt hiểm.",
        en: "[Demo placeholder data] Ready braising sauce made with fish sauce, Dak Lak black pepper and chili.",
      },
      price: 45000,
      originalPrice: 52000,
      images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80"],
      stock: 190,
      tags: ["sốt kho cá", "kho tộ", "nam bộ"],
      rating: 4.8,
      reviewsCount: 76,
      soldCount: 390,
      isFeatured: false,
      isBestSeller: false,
      discountBadge: null,
      origin: { vi: "Việt Nam", en: "Vietnam" },
    },

    // --- Nhóm Gia Vị Tiện Lợi (Placeholder [Mẫu]) ---
    {
      _id: "prod-muoi-ot-xanh",
      name: {
        vi: "[Mẫu] Muối Ớt Xanh Hải Sản Nha Trang Cay Nồng 260g",
        en: "[Demo] Nha Trang Green Chili Seafood Dipping Sauce 260g",
      },
      slug: "muoi-ot-xanh-hai-san-nha-trang-260g",
      categoryId: "cat-4",
      parentProductId: null,
      isVariant: false,
      variantLabel: null,
      description: {
        vi: "[Dữ liệu mẫu demo] Nước chấm muối ớt xiêm rừng xanh thơm lừng kết hợp cốt chanh tươi chua ngọt cay nồng.",
        en: "[Demo placeholder data] Green wild chili dipping sauce with fresh lime juice, perfect for seafood.",
      },
      price: 38000,
      originalPrice: 45000,
      images: ["https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80"],
      stock: 250,
      tags: ["muối ớt xanh", "nha trang", "chấm hải sản"],
      rating: 5.0,
      reviewsCount: 290,
      soldCount: 1850,
      isFeatured: true,
      isBestSeller: true,
      discountBadge: { vi: "-15%", en: "-15%" },
      origin: { vi: "Nha Trang, Khánh Hòa", en: "Nha Trang, Khanh Hoa" },
    },
  ];

  await Product.insertMany(productsData);
  console.log("✓ Products seeded: " + productsData.length + " items");

  // 4. SEED BANNERS
  const bannersData = [
    {
      _id: "banner-1",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
      title: {
        vi: "Tinh Hoa Nước Mắm & Gia Vị Truyền Thống",
        en: "Essence of Traditional Fish Sauce & Spices",
      },
      subtitle: {
        vi: "Ủ chượp tự nhiên từ cá cơm than tươi nguyên chất làng nghề Cà Ná - Phú Quốc",
        en: "Naturally brewed from fresh anchovies in Ca Na and Phu Quoc ancient villages",
      },
      ctaText: { vi: "Khám Phá Bộ Sưu Tập", en: "Explore Collection" },
      ctaLink: "/danh-muc/nuoc-mam-truyen-thong",
      order: 1,
      isActive: true,
    },
    {
      _id: "banner-2",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1600&q=80",
      title: {
        vi: "Mì Cay Hải Sản Seoul 7 Cấp Độ Đậm Đà",
        en: "Seoul Spicy Seafood Noodles 7 Fiery Levels",
      },
      subtitle: {
        vi: "Sợi mì dai giòn thượng hạng cùng gói gia vị nước dùng cốt tôm mực trứ danh",
        en: "Chewy springy noodles with rich concentrated shrimp & squid seafood broth",
      },
      ctaText: { vi: "Thử Thách Vị Giác", en: "Taste the Challenge" },
      ctaLink: "/san-pham/mi-cay-hai-san-seoul-chua-cay-7-cap-do-6-goi",
      order: 2,
      isActive: true,
    },
  ];

  await Banner.insertMany(bannersData);
  console.log("✓ Banners seeded: 2 items");

  // 5. SEED COUPON + FLASH DEAL (the coupon is the only time source)
  const flashCoupon = await Coupon.create({
    _id: "coupon-golden-hour",
    code: "GOLDEN30",
    discountType: "percent",
    discountValue: 30,
    minOrderValue: 150000,
    description: { vi: "Giảm 30% cho Ưu Đãi Giờ Vàng", en: "30% off Golden Hour Deals" },
    startAt: new Date(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  });
  const flashDealData = {
    _id: "flash-deal-current",
    title: { vi: "Ưu Đãi Giờ Vàng", en: "Flash Sale Deals" },
    subtitle: {
      vi: "Giá sốc chỉ trong hôm nay - Số lượng có hạn!",
      en: "Special discounts for limited time only!",
    },
    couponId: String(flashCoupon._id),
    isActive: true,
    productIds: ["prod-mi-cay-root", "prod-nuoc-mam-ca-na", "prod-muoi-ot-xanh"],
  };

  await FlashDeal.create(flashDealData);
  console.log("✓ Flash Deal seeded with Coupon-driven countdown");

  // 7. ORDERS
  // Không tạo đơn mẫu: khu vực quản trị chỉ hiển thị đơn hàng thật do khách tạo.
  const ordersData: never[] = [];
  console.log("✓ Orders seed skipped (production-clean data)");

  // 8. SEED REVIEWS
  const reviewsData = [
    {
      _id: "rev-1",
      productId: "prod-mi-cay-root",
      userName: "Nguyễn Minh Tuấn",
      userEmail: "tuan.nm@gmail.com",
      rating: 5,
      comment: "Mì cay hải sản ăn siêu cuốn, sợi mì dai ngon đúng vị Seoul, nước dùng cốt tôm mực đậm đặc cực kỳ thơm ngon!",
      images: ["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80"],
      verifiedPurchase: true,
      helpfulCount: 24,
      status: "approved",
      adminReply: {
        comment: "Cảm ơn bạn Tuấn đã tin dùng Mì Cay Hải Sản Seoul của Hương Vị Tuyệt Sắc! Chúc bạn có những bữa ăn ngon miệng!",
        repliedAt: "2026-08-25T14:30:00.000Z",
      },
    },
    {
      _id: "rev-2",
      productId: "prod-mi-cay-root",
      userName: "Phạm Thảo Vy",
      userEmail: "thaovy.foodie@gmail.com",
      rating: 5,
      comment: "Đóng gói 6 gói gia vị rất tiện lợi, mình thích cấp độ 3 cay vừa phải thơm nồng. Giao hàng nhanh đóng gói cẩn thận.",
      images: [],
      verifiedPurchase: true,
      helpfulCount: 16,
      status: "approved",
      adminReply: null,
    },
    {
      _id: "rev-3",
      productId: "prod-nuoc-mam-ca-na",
      userName: "Lê Văn Hùng",
      userEmail: "hung.levan@gmail.com",
      rating: 5,
      comment: "Nước mắm Cà Ná mùi thơm truyền thống rất dịu, màu cánh gián hổ phách trong vắt, chấm thịt luộc hay kho cá đều tuyệt đỉnh.",
      images: [],
      verifiedPurchase: true,
      helpfulCount: 19,
      status: "approved",
      adminReply: null,
    },
  ];

  await Review.insertMany(reviewsData);
  console.log("✓ Reviews seeded: 3 items");

  return {
    success: true,
    message: "Đã nạp dữ liệu hoàn tất vào MongoDB thành công!",
    counts: {
      categories: categoriesData.length,
      products: productsData.length,
      banners: bannersData.length,
      orders: ordersData.length,
      reviews: reviewsData.length,
    },
  };
}
