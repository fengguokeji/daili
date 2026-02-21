import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('home'); // home | admin
  const [copyBtnText, setCopyBtnText] = useState('一键复制链接');
  const [copyBtnColor, setCopyBtnColor] = useState('linear-gradient(135deg, #10b981, #059669)');

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setView('admin');
    }
  }, []);

  const handleGenerate = async () => {
    if (!longUrl) return;
    if (!/^https?:\/\//i.test(longUrl)) {
      alert('请输入包含 http:// 或 https:// 的有效网址');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const randomCode = array[0].toString(36).slice(0, 6);
      setShortUrl(`${window.location.origin}/${randomCode}`);
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopyBtnText('已复制');
      setCopyBtnColor('linear-gradient(135deg, #059669, #047857)');
      setTimeout(() => {
        setCopyBtnText('一键复制链接');
        setCopyBtnColor('linear-gradient(135deg, #10b981, #059669)');
      }, 2000);
    });
  };

  const handleAdminLogin = () => {
    alert("系统维护中，暂时无法登录后台");
  };

  return (
    <>
      <Head>
        <title>短链接测试</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className={`container fade-in ${view === 'home' ? 'flex' : 'hidden'}`}>
        <div className="glass-card">
          <div className="icon-wrapper">
            <i className="fa-solid fa-link"></i>
          </div>
          <h1>创建短链接</h1>
          <p className="subtitle">简单、快速、安全的链接缩短服务</p>

          <div className="input-group">
            <div className="input-icon"><i className="fa-solid fa-globe"></i></div>
            <input
              type="text"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="请粘贴您的长链接 (https://...)"
            />
          </div>

          <button
            onClick={handleGenerate}
            className={`btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : '立即生成'}
          </button>

          {shortUrl && (
            <div className="result-box slide-up">
              <div className="result-header">
                <i className="fa-solid fa-check-circle"></i> 生成成功
              </div>
              <a href={shortUrl} target="_blank" rel="noreferrer" className="short-url">{shortUrl}</a>
              <button
                onClick={handleCopy}
                className="btn-copy"
                style={{ background: copyBtnColor }}
              >
                <i className={`fa-solid ${copyBtnText === '已复制' ? 'fa-check' : 'fa-copy'}`}></i> {copyBtnText}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`container fade-in ${view === 'admin' ? 'flex' : 'hidden'}`}>
        <div className="glass-card small-card">
          <div className="icon-wrapper admin-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2>后台登录</h2>

          <div className="input-group">
            <div className="input-icon"><i className="fa-solid fa-user"></i></div>
            <input type="text" placeholder="管理员账号" />
          </div>
          <div className="input-group">
            <div className="input-icon"><i className="fa-solid fa-lock"></i></div>
            <input type="password" placeholder="为了安全请输入密码" />
          </div>

          <button onClick={handleAdminLogin} className="btn-primary" style={{ marginTop: '10px' }}>
            登录系统
          </button>
        </div>
      </div>

      <div className="footer">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          ICP备案号：皖ICP备2025081222号
        </a>
      </div>

      <style jsx global>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #6366f1, #a855f7);
          --glass-bg: rgba(255, 255, 255, 0.8);
          --glass-border: rgba(0, 0, 0, 0.05);
          --text-color: #1f2937;
          --text-secondary: #6b7280;
        }

        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          margin: 0; 
          color: var(--text-color);
          background: #ffffff;
        }
        
        .container { 
          display: flex; 
          flex-direction: column;
          justify-content: center; 
          align-items: center; 
          min-height: calc(100vh - 60px); 
          padding: 20px; 
          box-sizing: border-box;
        }
        
        .hidden { display: none; }
        .flex { display: flex; }

        /* Card */
        .glass-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
          text-align: center;
          transition: transform 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-5px);
        }
        .small-card { max-width: 360px; padding: 2.5rem 2rem; }

        .icon-wrapper {
          width: 64px; height: 64px;
          background: var(--primary-gradient);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
          color: white; font-size: 28px;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
        }
        .admin-icon { background: linear-gradient(135deg, #3b82f6, #06b6d4); box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3); }

        h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h2 { margin: 0 0 25px 0; font-size: 24px; font-weight: 700; }
        .subtitle { color: var(--text-secondary); margin-bottom: 30px; font-size: 15px; }

        /* Inputs */
        .input-group { position: relative; margin-bottom: 20px; text-align: left; width: 100%; }
        .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; z-index: 2;}
        input { 
          width: 100%; 
          padding: 16px 16px 16px 48px; 
          border: 1.5px solid #e5e7eb; 
          border-radius: 16px; 
          font-size: 15px; 
          background: #f9fafb; 
          transition: all 0.3s ease;
          outline: none;
          color: var(--text-color);
          box-sizing: border-box;
        }
        input:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05); }
        input::placeholder { color: #9ca3af; }

        /* Buttons */
        .btn-primary { 
          width: 100%; 
          padding: 16px; 
          border: none; 
          border-radius: 16px; 
          background: var(--primary-gradient); 
          color: white; 
          font-size: 16px; font-weight: 700; 
          cursor: pointer; 
          transition: all 0.3s; 
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
          position: relative; overflow: hidden;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 20px rgba(99, 102, 241, 0.25); }
        .loading { opacity: 0.8; cursor: wait; }

        /* Result Area */
        .result-box { 
          margin-top: 25px; 
          padding: 20px; 
          background: #f0fdf4; 
          border: 1px solid #dcfce7; 
          border-radius: 16px; 
          text-align: left; 
        }
        .result-header { color: #166534; font-weight: 700; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .short-url { 
          display: block; 
          font-size: 16px; font-weight: 700; color: #111827; 
          text-decoration: none; word-break: break-all; margin-bottom: 15px; 
          padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 12px;
        }
        .btn-copy { 
          width: 100%; padding: 12px; border: none; border-radius: 12px; 
          color: white; font-weight: 600; font-size: 14px; cursor: pointer; 
          transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-copy:hover { opacity: 0.9; }

        /* Footer */
        .footer { padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; }
        .footer a { color: #9ca3af; text-decoration: none; font-size: 12px; transition: 0.2s; }
        .footer a:hover { color: var(--text-color); }

        /* Animations */
        .fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 480px) {
          .glass-card { padding: 2rem 1.5rem; }
          h1 { font-size: 24px; }
        }
      `}</style>
    </>
  );
}
