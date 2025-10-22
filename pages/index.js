import React, { useEffect, useState } from 'react';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('f1');

  useEffect(() => {
    document.title = currentPage === 'f1' 
      ? 'Apple 宣布与 F1 达成五年独家转播协议 - Apple 新闻中心'
      : '新款 iPhone Air、iPad Pro、14 英寸 MacBook Pro 和 Apple Vision Pro 现已正式发售';

    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = currentPage === 'f1'
      ? 'Apple 宣布自 2026 年起通过 Apple TV 在美国独家播出 F1 赛车，签订五年协议，总价值 7.5 亿美元。'
      : 'iPhone Air、搭载 M5 芯片的新款 iPad Pro、14 英寸 MacBook Pro 和 Apple Vision Pro 现已正式发售。';
    document.head.appendChild(metaDescription);

    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.content = currentPage === 'f1'
      ? 'Apple 宣布与 F1 达成五年独家转播协议'
      : '新款 iPhone Air、iPad Pro、14 英寸 MacBook Pro 和 Apple Vision Pro 现已正式发售';
    document.head.appendChild(ogTitle);

    const ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.content = currentPage === 'f1'
      ? 'Apple 将自 2026 年起通过 Apple TV 平台在美国独家播出 F1 赛车赛事。'
      : 'Apple 顾客现可通过 Apple Store 零售店、apple.com.cn 和 Apple Store app 探索与购买 iPhone Air。';
    document.head.appendChild(ogDesc);

    const ogImg = document.createElement('meta');
    ogImg.setAttribute('property', 'og:image');
    ogImg.content = currentPage === 'f1'
      ? 'https://www.apple.com/newsroom/images/default/apple-logo-og.jpg'
      : 'https://www.apple.com/newsroom/images/default/apple-logo-og.jpg';
    document.head.appendChild(ogImg);

    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'https://www.apple.com/favicon.ico';
    document.head.appendChild(favicon);

    return () => {
      document.head.removeChild(metaDescription);
      document.head.removeChild(ogTitle);
      document.head.removeChild(ogDesc);
      document.head.removeChild(ogImg);
      document.head.removeChild(favicon);
    };
  }, [currentPage]);

  const handleNextPage = () => {
    setCurrentPage('products');
  };

  const handleBackPage = () => {
    setCurrentPage('f1');
  };

  if (currentPage === 'f1') {
    return (
      <div style={styles.body}>
        <div style={styles.container}>
          <h1 style={styles.title}>
            Apple 正式敲定与一级方程式 F1 赛车达成五年独家转播权协议
          </h1>
          <p style={styles.date}>2025 年 10 月 21 日 · Apple 新闻中心</p>

          <img
            src="https://www.apple.com/newsroom/images/default/apple-logo-og.jpg"
            alt="Apple F1"
            style={styles.image}
          />

          <p style={styles.text}>
            Apple（苹果公司）正式敲定与一级方程式 F1 赛车（Formula 1）达成五年独家转播权协议，
            将自 2026 年起通过 Apple TV 平台在美国独家播出 F1 赛事。
            这项交易总价值约 7.5 亿美元，每年约支付 1.5 亿美元，
            同时也展现了苹果进军体育转播领域的决心与野心。
          </p>

          <p style={styles.text}>
            根据苹果与 F1 官方声明，此项合作将让美国 Apple TV 订阅用户无需额外付费，
            即可观看所有 F1 赛事，包括自由练习、排位赛与正赛等所有场次的实时转播内容，
            同时还将整合 F1 官方频道 “F1 TV” 所制作的深度节目与数据内容。
          </p>

          <p style={styles.text}>
            这是苹果首次将大型国际赛事纳入自家流媒体平台的订阅服务。
            虽然此前曾推出美国职业足球大联盟（MLS）转播方案，但需额外付费；
            此次则首次纳入 Apple TV 标准订阅范围，
            显示苹果希望通过内容差异化巩固平台订阅用户。
          </p>

          <img
            src="https://mrmad.com.tw/wp-content/uploads/2025/10/apple-f1-exclusive-tv-deal-free-us.jpg"
            alt="F1 Race"
            style={styles.image}
          />

          <p style={styles.text}>
            目前 Apple TV 的 F1 转播相关安排尚未最终确定，
            预计初期不会自制评论内容，而是考虑采购 F1 TV 或英国 Sky 体育台的转播音轨，
            以确保内容质量与播出水准。
          </p>

          <p style={styles.text}>
            值得注意的是，今年初由布拉德·皮特主演、Apple 出资制作的 F1 主题电影上映后广受好评，
            全球票房突破 6.3 亿美元，不仅成为史上票房最高的体育电影，
            也是皮特个人票房最高作品。
            该片在北美市场显著提升了 F1 的关注度，
            被视为此次谈判成功的重要推手。
          </p>

          <p style={styles.text}>
            Apple 服务事业高级副总裁 Eddy Cue 表示，
            F1 在美国市场仍有巨大发展潜力：
            “我们不仅仅是做五年，我们的目标是长期投入，
            让这项合作成为苹果的重要内容战略之一。”
          </p>

          <p style={styles.text}>
            F1 主席 Stefano Domenicali 则表示：
            “这是一项极具战略意义的合作，
            能通过苹果横跨新闻、音乐、运动、健身等生态系统平台，
            全面提升 F1 在美国市场的曝光度与成长潜力。”
          </p>

          <p style={styles.text}>
            相比之下，F1 目前与 ESPN 的美国转播权合作每年仅约 8,000 万美元，
            苹果此举有望为 F1 带来更大的资源投入与观众基础，
            并重新定义流媒体平台在体育转播市场的竞争格局。
          </p>

          <p style={styles.text}>
            至于 Netflix 热门的 F1 纪录片剧集《极速求生》（Drive to Survive）
            则不受此次协议影响，仍将持续在该平台上线播出。
          </p>

          <div style={styles.buttonContainer}>
            <button onClick={handleNextPage} style={styles.nextButton}>
              下一页
            </button>
          </div>

          <footer style={styles.footer}>
            © 2025 Apple Inc. 版权所有。  
            Apple TV、Apple News 与 F1 为各自商标。
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div style={productStyles.body}>
      <div style={productStyles.container}>
        <h1 style={productStyles.title}>
          新款 iPhone Air、iPad Pro、14 英寸 MacBook Pro 和 Apple Vision Pro
        </h1>
        
        <p style={productStyles.update}>更新 2025 年 10 月 22 日</p>
        
        <div style={productStyles.section}>          
          <h3 style={productStyles.h3}>iPhone Air</h3>
          <p style={productStyles.p}>
            iPhone Air 采用极致轻薄的设计，比所有前代机型更加坚固耐用，具备专业性能表现、先进的 4800 万像素融合式主摄、创新 Center Stage 前置摄像头和满足全天所需的出色电池续航。以 iPhone 史上最薄身姿带来专业级性能表现。极致纤薄的钛金属设计优雅轻盈而又极为坚固，依托创新内部架构带来最新 iPhone 体验。iPhone Air 背部由超瓷晶面板保护，硬度远胜各种智能手机玻璃面板或玻璃陶瓷面板；正面使用超瓷晶面板 2 打造，抗刮划能力提升至上代机型的 3 倍，使得 iPhone Air 比此前所有 iPhone 机型都更加耐用。iPhone Air 还配备了绚丽的 6.5 英寸超视网膜 XDR 显示屏，ProMotion 自适应刷新率最高可达 120Hz。强大的 4800 万像素融合式主摄图像可实现相当于四颗镜头的卓越画质，包括一颗 2 倍光学品质长焦镜头。Center Stage 前置摄像头采用创新正方形传感器，具有宽视角，可在拍摄集体自拍时自动从纵向模式旋转为横向模式；用户还可使用同步双拍功能，同时使用前后摄像头拍摄视频。iPhone Air 已得到中国移动、中国电信和中国联通支持，采用 eSIM 设计，在节省内部空间的同时，提供比传统实体 SIM 卡更高的灵活性、安全性和无缝网络连接体验，在出国旅行途中尤为方便。iPhone Air 搭载了 iPhone 迄今最多的 Apple 设计芯片，包括强大的 A19 Pro、N1 和 C1X，使其登顶史上能效最高的 iPhone。结合重新设计的内部架构和软件优化，iPhone Air 在提供专业级性能的同时，仍具备满足全天所需的卓越电池续航。提供四种可选颜色：天蓝色、浅金色、云白色和深空黑色。
          </p>
          <img
            src="https://www.apple.com.cn/newsroom/images/2025/10/new-iphone-air-ipad-pro-14-inch-macbook-pro-and-apple-vision-pro-now-available/article/Apple-iPhone-Air-color-lineup_big.jpg.large_2x.jpg"
            alt="新款 iPhone Air 天蓝色钛金属设计概念图"
            style={productStyles.productImage}
          />
          
          <h3 style={productStyles.h3}>iPad Pro</h3>
          <p style={productStyles.p}>
            搭载 M5 芯片的 iPad Pro 解锁了最为先进的 iPad 体验，在超便携设计中纳入澎湃性能。结合 iPadOS 26，为寻求利用 iPad 完成更多任务的用户提供了前所未见的功能与表现。新款 iPad Pro 解锁了迄今最先进的 iPad 体验，在极致轻薄的设计中纳入了澎湃性能。新一代图形处理器的每颗核心都搭载了一枚神经网络加速器，使新款 iPad Pro 的 AI 性能相比上代机型提升最高 3.5 倍，相比搭载 M1 芯片的 iPad Pro 提升最高 5.6 倍。新款 iPad Pro 还搭载了速度更快的图形处理器、性能提升的神经网络引擎和加大的统一内存带宽，并首次配备了 C1X 调制解调器和 Apple 设计的全新无线网络芯片 N1。iPad Pro 提供 11 英寸和 13 英寸两种尺寸，均配备绚丽的超精视网膜 XDR 显示屏和新进的双层串联 OLED 技术，通过 iPadOS 提供生动使用体验。妙控键盘与 Apple Pencil 等先进配件为 iPad 解锁更多用途。
          </p>
          <img
            src="https://www.apple.com.cn/newsroom/images/2025/10/new-iphone-air-ipad-pro-14-inch-macbook-pro-and-apple-vision-pro-now-available/article/Apple-iPad-Pro-lineup_big.jpg.large_2x.jpg"
            alt="iPad Pro 图像"
            style={productStyles.productImage}
          />
          
          <h3 style={productStyles.h3}>14 英寸 MacBook Pro</h3>
          <p style={productStyles.p}>
            新款 14 英寸 MacBook Pro 由 M5 芯片强势驱动，整体性能实现跃升，AI 任务大幅提速，存储速度更快，电池续航最长可达 24 小时，并通过设计优美的 macOS Tahoe 带来生动使用体验。搭载 M5 芯片的新款 14 英寸 MacBook Pro 速度更快、功能更强、AI 性能大幅跃升。新一代图形处理器的每颗核心都搭载了一枚神经网络加速器，使新款 MacBook Pro 的 AI 性能相比上代机型提升最高 3.5 倍，相比搭载 M1 芯片的 13 英寸 MacBook Pro 提升最高 6 倍。图形性能相比上代机型提升最多 1.6 倍，相比搭载 M1 芯片的 13 英寸 MacBook Pro 提升最高 2.7 倍。此外，M5 芯片还集成了速度更快的中央处理器、性能提升的神经网络引擎和加大的统一内存带宽，从启动 app 到运行设备端大语言模型，速度都显著提升。依托最新存储技术，搭载 M5 芯片的新款 14 英寸 MacBook Pro 固态硬盘在运行导入 RAW 图像文件、导出大型视频等任务时，速度比上代机型快最多 2 倍。结合绚丽的 Liquid 视网膜 XDR 显示屏（提供纳米纹理玻璃面板选项）、1200 万像素 Center Stage 摄像头、六扬声器音响系统、丰富的端口和出类拔萃的 macOS Tahoe，造就了 MacBook Pro 的卓越体验。
          </p>
          <img
            src="https://www.apple.com.cn/newsroom/images/2025/10/new-iphone-air-ipad-pro-14-inch-macbook-pro-and-apple-vision-pro-now-available/article/Apple-MacBook-Pro-14-in-silver_big.jpg.large_2x.jpg"
            alt="14 英寸 MacBook Pro 图像"
            style={productStyles.productImage}
          />
          
          <h3 style={productStyles.h3}>Apple Vision Pro</h3>
          <p style={productStyles.p}>
            在 M5 芯片加持下，Apple Vision Pro 性能大幅跃升，显示渲染更出色，电池续航亦有提升，且配备新款双圈编织头带，为用户提供舒适佩戴体验。搭载 M5 芯片的 Apple Vision Pro 性能大幅跃升，显示渲染更出色，AI 工作流实现提速，电池续航亦有提升。Vision Pro 现配备带软垫的双圈编织头带，佩戴感更加舒适，并通过 visionOS 26 解锁更多创新空间体验。此外，用户还可畅享 App Store 中的上百万款 app 和数千款游戏，Apple TV app 中的数百部 3D 电影，以及全新 Apple 沉浸影片和系列视频。双圈编织头带可单独购买。升级版 Apple Vision Pro 搭载强劲的 M5 芯片，配备舒适的双圈编织头带，通过 visionOS 26 为用户提供创新功能，以及全新空间 app 和 Apple 沉浸内容。
          </p>
          <img
            src="https://www.apple.com.cn/newsroom/images/2025/10/new-iphone-air-ipad-pro-14-inch-macbook-pro-and-apple-vision-pro-now-available/article/Apple-Vision-Pro-Dual-Knit-Band_big.jpg.large_2x.jpg"
            alt="Apple Vision Pro 图像"
            style={productStyles.productImage}
          />
        </div>

        <div style={productStyles.buttonContainer}>
          <button onClick={handleBackPage} style={productStyles.backButton}>
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: '#fafafa',
    color: '#333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '800px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#000',
    marginBottom: '10px',
  },
  date: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '20px',
  },
  image: {
    width: '100%',
    borderRadius: '10px',
    margin: '20px 0',
  },
  text: {
    lineHeight: 1.8,
    fontSize: '17px',
    marginBottom: '15px',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '40px 0',
  },
  nextButton: {
    backgroundColor: '#0071e3',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-block',
  },
  footer: {
    borderTop: '1px solid #ddd',
    marginTop: '30px',
    paddingTop: '15px',
    fontSize: '14px',
    color: '#777',
    textAlign: 'center',
  },
};

const productStyles = {
  body: {
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.4,
    color: '#1d1d1f',
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '0 20px',
    backgroundColor: '#ffffff',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '800px',
    background: '#fff',
    padding: '30px',
  },
  title: {
    fontSize: 'clamp(1.875rem, 5vw, 4rem)',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    margin: '2rem 0 0.5rem',
    lineHeight: 1.1,
  },
  update: {
    color: '#6e6e73',
    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
    fontWeight: 400,
    marginBottom: '2rem',
    letterSpacing: '-0.01em',
  },
  p: {
    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
    lineHeight: 1.5,
    marginBottom: '1.5rem',
    maxWidth: '800px',
  },
  h2: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: 600,
    margin: '3rem 0 1rem',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
    fontWeight: 600,
    margin: '2.5rem 0 1rem',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  productImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '18px',
    margin: '2rem 0',
    display: 'block',
  },
  section: {
    marginBottom: '3rem',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '40px 0',
  },
  backButton: {
    backgroundColor: '#0071e3',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-block',
  },
};
