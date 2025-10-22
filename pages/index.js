import React, { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    document.title = 'Apple 宣布与 F1 达成五年独家转播协议 - Apple 新闻中心';

    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content =
      'Apple 宣布自 2026 年起通过 Apple TV 在美国独家播出 F1 赛车，签订五年协议，总价值 7.5 亿美元。';
    document.head.appendChild(metaDescription);

    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.content = 'Apple 宣布与 F1 达成五年独家转播协议';
    document.head.appendChild(ogTitle);

    const ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.content =
      'Apple 将自 2026 年起通过 Apple TV 平台在美国独家播出 F1 赛车赛事。';
    document.head.appendChild(ogDesc);

    const ogImg = document.createElement('meta');
    ogImg.setAttribute('property', 'og:image');
    ogImg.content =
      'https://www.apple.com/newsroom/images/default/apple-logo-og.jpg';
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
  }, []);

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

        <footer style={styles.footer}>
          © 2025 Apple Inc. 版权所有。  
          Apple TV、Apple News 与 F1 为各自商标。
        </footer>
      </div>
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: '#fafafa',
    color: '#333',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
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
  footer: {
    borderTop: '1px solid #ddd',
    marginTop: '30px',
    paddingTop: '15px',
    fontSize: '14px',
    color: '#777',
    textAlign: 'center',
  },
};
