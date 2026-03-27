import bcrypt from "bcryptjs";
import {
  MatchStatus,
  NewsCategory,
  PrismaClient,
  SquadType,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.favoriteMatch.deleteMany();
  await prisma.favoriteNews.deleteMany();
  await prisma.favoriteProduct.deleteMany();
  await prisma.ticketInfo.deleteMany();
  await prisma.playerMoment.deleteMany();
  await prisma.player.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.clubHonor.deleteMany();
  await prisma.match.deleteMany();
  await prisma.registrationToken.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  const userPassword = await bcrypt.hash("User@123456", 10);

  const admin = await prisma.user.create({
    data: {
      name: "CD Rangers 管理员",
      email: "admin@cdrfc.cn",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      preferences: {
        create: {
          favoriteCompetition: "中超联赛",
          favoritePlayer: "韦世豪",
          receiveNewsletter: true,
          language: "zh-CN",
        },
      },
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: "示例球迷",
      email: "fan@cdrfc.cn",
      passwordHash: userPassword,
      role: UserRole.USER,
      emailVerified: new Date(),
      preferences: {
        create: {
          favoriteCompetition: "足协杯",
          favoritePlayer: "费利佩",
          receiveNewsletter: true,
          language: "zh-CN",
        },
      },
    },
  });

  const matches = await Promise.all(
    [
      {
        slug: "cdr-vs-shenhua-2026-04-06",
        kickoffAt: new Date("2026-04-06T19:35:00+08:00"),
        competition: "中超联赛",
        round: "第 5 轮",
        homeTeam: "成都蓉城",
        awayTeam: "上海申花",
        venue: "凤凰山体育公园专业足球场",
        status: MatchStatus.UPCOMING,
        report:
          "关键抢分战，球队将继续以高压逼抢与快速边路推进争取主场三分。",
        highlightsUrl: "https://www.bilibili.com",
        technicalStats: {
          possessionTarget: "55%",
          keyFocus: ["边路推进", "中场二次球", "定位球防守"],
        },
      },
      {
        slug: "taishan-vs-cdr-2026-04-12",
        kickoffAt: new Date("2026-04-12T19:00:00+08:00"),
        competition: "中超联赛",
        round: "第 6 轮",
        homeTeam: "山东泰山",
        awayTeam: "成都蓉城",
        venue: "济南奥体中心体育场",
        status: MatchStatus.UPCOMING,
        report: "客场强强对话，球队目标带分离场。",
        highlightsUrl: "https://www.bilibili.com",
      },
      {
        slug: "cdr-vs-zhejiang-2026-03-28",
        kickoffAt: new Date("2026-03-28T19:35:00+08:00"),
        competition: "中超联赛",
        round: "第 4 轮",
        homeTeam: "成都蓉城",
        awayTeam: "浙江队",
        venue: "凤凰山体育公园专业足球场",
        status: MatchStatus.FINISHED,
        homeScore: 2,
        awayScore: 1,
        report:
          "蓉城在下半场通过边路传中完成反超，主场全取三分，稳住积分榜前列位置。",
        highlightsUrl: "https://www.bilibili.com",
        technicalStats: {
          possession: "53%",
          shots: "14",
          shotsOnTarget: "6",
          passes: "426",
        },
        lineupHome: {
          starters: ["蹇韬", "唐淼", "周定洋", "费利佩"],
        },
        lineupAway: {
          starters: ["赵博", "程进", "莱昂纳多"],
        },
      },
      {
        slug: "guoan-vs-cdr-2026-03-20",
        kickoffAt: new Date("2026-03-20T20:00:00+08:00"),
        competition: "中超联赛",
        round: "第 3 轮",
        homeTeam: "北京国安",
        awayTeam: "成都蓉城",
        venue: "工人体育场",
        status: MatchStatus.FINISHED,
        homeScore: 1,
        awayScore: 1,
        report:
          "客场面对高压环境，球队在最后阶段守住比分，带回宝贵一分。",
        highlightsUrl: "https://www.bilibili.com",
      },
      {
        slug: "cdr-vs-wuhan-2026-03-14",
        kickoffAt: new Date("2026-03-14T19:35:00+08:00"),
        competition: "中超联赛",
        round: "第 2 轮",
        homeTeam: "成都蓉城",
        awayTeam: "武汉三镇",
        venue: "凤凰山体育公园专业足球场",
        status: MatchStatus.FINISHED,
        homeScore: 3,
        awayScore: 0,
        report: "攻防两端表现均衡，蓉城以一场完胜点燃主场。",
        highlightsUrl: "https://www.bilibili.com",
      },
      {
        slug: "cdr-vs-henan-fa-cup-2026-04-20",
        kickoffAt: new Date("2026-04-20T19:30:00+08:00"),
        competition: "中国足协杯",
        round: "第四轮",
        homeTeam: "成都蓉城",
        awayTeam: "河南队",
        venue: "凤凰山体育公园专业足球场",
        status: MatchStatus.UPCOMING,
        report: "杯赛单场淘汰，球队将全力冲击晋级资格。",
        highlightsUrl: "https://www.bilibili.com",
      },
    ].map((item) => prisma.match.create({ data: item })),
  );

  const firstTeamPlayers = [
    {
      slug: "wei-shihao",
      name: "韦世豪",
      jerseyNumber: 7,
      position: "前锋",
      nationality: "中国",
      birthDate: new Date("1995-04-08"),
      heightCm: 178,
      weightKg: 72,
      bio: "具备强突能力和门前嗅觉，是蓉城前场的重要进攻点。",
      portraitUrl: "/images/players/wei-shihao.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 6,
      goals: 3,
      assists: 2,
      moments: {
        create: [
          {
            title: "2026 赛季首球",
            videoUrl: "https://www.bilibili.com",
            sortOrder: 1,
          },
        ],
      },
    },
    {
      slug: "felipe-silva",
      name: "费利佩",
      jerseyNumber: 9,
      position: "中锋",
      nationality: "巴西",
      birthDate: new Date("1991-01-07"),
      heightCm: 193,
      weightKg: 86,
      bio: "支点能力出色，背身拿球和高空争顶优势明显。",
      portraitUrl: "/images/players/felipe.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 6,
      goals: 4,
      assists: 1,
    },
    {
      slug: "zhou-dingyang",
      name: "周定洋",
      jerseyNumber: 8,
      position: "中场",
      nationality: "中国",
      birthDate: new Date("1994-01-18"),
      heightCm: 181,
      weightKg: 74,
      bio: "中场节拍器，覆盖面积大，攻防转换作用突出。",
      portraitUrl: "/images/players/zhou-dingyang.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 6,
      goals: 1,
      assists: 2,
    },
    {
      slug: "kim-minwoo",
      name: "金敃友",
      jerseyNumber: 11,
      position: "边后卫",
      nationality: "韩国",
      birthDate: new Date("1990-02-25"),
      heightCm: 172,
      weightKg: 68,
      bio: "经验丰富，能在边路提供持续推进与回防硬度。",
      portraitUrl: "/images/players/kim-minwoo.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 5,
      goals: 0,
      assists: 1,
    },
    {
      slug: "jiang-shenglong",
      name: "蒋圣龙",
      jerseyNumber: 5,
      position: "中后卫",
      nationality: "中国",
      birthDate: new Date("2000-12-24"),
      heightCm: 193,
      weightKg: 80,
      bio: "防空能力出色，擅长对抗与后场组织。",
      portraitUrl: "/images/players/jiang-shenglong.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 6,
      goals: 1,
      assists: 0,
    },
    {
      slug: "tang-miao",
      name: "唐淼",
      jerseyNumber: 20,
      position: "右后卫",
      nationality: "中国",
      birthDate: new Date("1990-10-16"),
      heightCm: 177,
      weightKg: 70,
      bio: "攻守兼备的边后卫，传中质量稳定。",
      portraitUrl: "/images/players/tang-miao.svg",
      squad: SquadType.FIRST_TEAM,
      appearances: 5,
      goals: 0,
      assists: 2,
    },
  ];

  const academyPlayers = [
    {
      slug: "li-yuhao",
      name: "李昱昊",
      jerseyNumber: 37,
      position: "中场",
      nationality: "中国",
      birthDate: new Date("2006-08-22"),
      heightCm: 176,
      weightKg: 67,
      bio: "梯队重点培养中场，脚下技术细腻。",
      portraitUrl: "/images/players/li-yuhao.svg",
      squad: SquadType.ACADEMY,
      appearances: 2,
      goals: 0,
      assists: 1,
    },
    {
      slug: "sun-jiacheng",
      name: "孙嘉成",
      jerseyNumber: 40,
      position: "边锋",
      nationality: "中国",
      birthDate: new Date("2007-03-10"),
      heightCm: 174,
      weightKg: 65,
      bio: "速度快、突破犀利，具备一对一能力。",
      portraitUrl: "/images/players/sun-jiacheng.svg",
      squad: SquadType.ACADEMY,
      appearances: 1,
      goals: 1,
      assists: 0,
    },
  ];

  const coachingStaff = [
    {
      slug: "seo-jungwon",
      name: "徐正源",
      jerseyNumber: null,
      position: "主教练",
      nationality: "韩国",
      birthDate: new Date("1970-12-17"),
      heightCm: 176,
      weightKg: 72,
      bio: "强调组织纪律与快速反击，带队风格鲜明。",
      portraitUrl: "/images/staff/seo-jungwon.svg",
      squad: SquadType.COACHING_STAFF,
      appearances: 0,
      goals: 0,
      assists: 0,
    },
    {
      slug: "assistant-liu",
      name: "刘毅",
      jerseyNumber: null,
      position: "助理教练",
      nationality: "中国",
      birthDate: new Date("1981-05-03"),
      heightCm: 180,
      weightKg: 75,
      bio: "长期负责训练质量管理与球员状态跟踪。",
      portraitUrl: "/images/staff/assistant-liu.svg",
      squad: SquadType.COACHING_STAFF,
      appearances: 0,
      goals: 0,
      assists: 0,
    },
  ];

  await prisma.player.createMany({
    data: [...firstTeamPlayers, ...academyPlayers, ...coachingStaff],
  });

  await prisma.newsPost.createMany({
    data: [
      {
        slug: "matchday-shenhua-preview",
        title: "赛前发布会：主场迎战上海申花",
        excerpt: "教练组表示球队将坚持主动进攻，争取在凤凰山拿下关键三分。",
        content:
          "在赛前新闻发布会上，教练组与球员代表强调了执行力和比赛专注度。球队近期训练围绕高位逼抢与攻防转换展开，目标是在主场打出强度与节奏。",
        coverImage: "/images/news/news-1.svg",
        category: NewsCategory.NEWS,
        publishedAt: new Date("2026-03-26T10:00:00+08:00"),
      },
      {
        slug: "club-announcement-youth-camp",
        title: "官方公告：2026 青训开放日启动",
        excerpt: "俱乐部将举办青训开放日，面向 10-15 岁青少年开放体验。",
        content:
          "活动将由青训教练组统一组织，包含基础技术测试、训练展示与家长交流环节。报名通道将于本周开放。",
        coverImage: "/images/news/news-2.svg",
        category: NewsCategory.ANNOUNCEMENT,
        publishedAt: new Date("2026-03-23T09:30:00+08:00"),
      },
      {
        slug: "video-training-weekly",
        title: "视频：一线队本周训练集锦",
        excerpt: "围绕高压逼抢和边路推进，球队完成了多组高强度对抗训练。",
        content:
          "训练视频记录了球队在比赛周中的准备节奏，包括小范围对抗、定位球演练以及体能恢复环节。",
        coverImage: "/images/news/news-3.svg",
        category: NewsCategory.VIDEO,
        publishedAt: new Date("2026-03-22T18:00:00+08:00"),
      },
      {
        slug: "result-cdr-vs-zhejiang",
        title: "战报：成都蓉城 2-1 浙江队",
        excerpt: "球队下半场连入两球完成逆转，收获联赛宝贵三分。",
        content:
          "比赛上半场双方节奏较快，下半场蓉城通过换人调整加强边路冲击，最终凭借稳定执行力完成逆转。",
        coverImage: "/images/news/news-4.svg",
        category: NewsCategory.NEWS,
        publishedAt: new Date("2026-03-29T22:10:00+08:00"),
      },
      {
        slug: "ticket-policy-update",
        title: "票务公告：主场实名制购票提醒",
        excerpt: "请球迷朋友提前完成实名信息绑定，入场需核验人证信息。",
        content:
          "俱乐部提醒球迷按照票务平台提示完善实名信息，比赛日请预留充足入场时间，配合现场安检与验票。",
        coverImage: "/images/news/news-5.svg",
        category: NewsCategory.ANNOUNCEMENT,
        publishedAt: new Date("2026-03-24T15:30:00+08:00"),
      },
      {
        slug: "community-activity-recap",
        title: "社区活动回顾：球员走进校园",
        excerpt: "俱乐部开展校园公益活动，推广足球文化。",
        content:
          "多名一线队球员参与互动，分享职业经历并组织趣味训练，鼓励更多青少年参与足球运动。",
        coverImage: "/images/news/news-6.svg",
        category: NewsCategory.NEWS,
        publishedAt: new Date("2026-03-18T11:00:00+08:00"),
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        slug: "home-jersey-2026",
        name: "2026 赛季主场球衣",
        description:
          "主色延续蓉城红，透气面料与轻量版型兼顾比赛与日常穿着。",
        priceCny: 499,
        stock: 138,
        coverImage: "/images/shop/home-jersey-1.svg",
      },
      {
        slug: "training-jacket-2026",
        name: "2026 训练外套",
        description: "立领设计，防风面料，适合通勤和训练前后穿搭。",
        priceCny: 359,
        stock: 72,
        coverImage: "/images/shop/jacket-1.svg",
      },
      {
        slug: "club-scarf-classic",
        name: "经典围巾",
        description: "红金主视觉，适用于比赛日助威与收藏。",
        priceCny: 129,
        stock: 220,
        coverImage: "/images/shop/scarf-1.svg",
      },
    ],
  });

  const products = await prisma.product.findMany();
  await prisma.productImage.createMany({
    data: products.flatMap((product) => [
      {
        productId: product.id,
        imageUrl: product.coverImage,
        alt: `${product.name} 主图`,
        sortOrder: 1,
      },
      {
        productId: product.id,
        imageUrl: product.coverImage.replace("-1.svg", "-2.svg"),
        alt: `${product.name} 角度图`,
        sortOrder: 2,
      },
      {
        productId: product.id,
        imageUrl: product.coverImage.replace("-1.svg", "-3.svg"),
        alt: `${product.name} 细节图`,
        sortOrder: 3,
      },
    ]),
  });

  await prisma.ticketInfo.createMany({
    data: [
      {
        title: "成都蓉城 vs 上海申花",
        description: "联赛主场焦点战，建议提前购票。",
        purchaseUrl: "https://detail.damai.cn",
        saleStartAt: new Date("2026-03-31T10:00:00+08:00"),
        priceTiers: [
          { name: "看台 A", price: 180 },
          { name: "看台 B", price: 280 },
          { name: "VIP", price: 480 },
        ],
        matchId: matches[0].id,
      },
      {
        title: "成都蓉城 vs 河南队",
        description: "足协杯淘汰赛，限时优惠票档开放中。",
        purchaseUrl: "https://detail.damai.cn",
        saleStartAt: new Date("2026-04-12T10:00:00+08:00"),
        priceTiers: [
          { name: "看台 A", price: 120 },
          { name: "看台 B", price: 220 },
          { name: "VIP", price: 380 },
        ],
        matchId: matches[5].id,
      },
      {
        title: "主场季票（模拟）",
        description: "覆盖联赛主场场次，含专属周边福利。",
        purchaseUrl: "https://detail.damai.cn",
        saleStartAt: new Date("2026-03-15T10:00:00+08:00"),
        priceTiers: [
          { name: "标准季票", price: 1680 },
          { name: "尊享季票", price: 2680 },
        ],
      },
    ],
  });

  await prisma.clubHonor.createMany({
    data: [
      {
        year: 2021,
        title: "中国足球协会甲级联赛亚军",
        description: "成功升级中国足球协会超级联赛。",
      },
      {
        year: 2022,
        title: "中超联赛第 5 名",
        description: "队史中超首赛季即跻身上半区。",
      },
      {
        year: 2023,
        title: "中超联赛季军",
        description: "持续稳定表现，建立强主场标签。",
      },
      {
        year: 2024,
        title: "亚冠精英联赛资格",
        description: "通过联赛成绩获得洲际赛事资格。",
      },
    ],
  });

  const news = await prisma.newsPost.findMany({ take: 2 });
  const prods = await prisma.product.findMany({ take: 2 });

  await prisma.favoriteMatch.create({
    data: {
      userId: demoUser.id,
      matchId: matches[0].id,
    },
  });

  await prisma.favoriteNews.create({
    data: {
      userId: demoUser.id,
      newsId: news[0].id,
    },
  });

  await prisma.favoriteProduct.create({
    data: {
      userId: demoUser.id,
      productId: prods[0].id,
    },
  });

  console.log("Seed completed.");
  console.log("Admin account: admin@cdrfc.cn / Admin@123456");
  console.log("Demo account: fan@cdrfc.cn / User@123456");
  console.log(`Seeded by user: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
